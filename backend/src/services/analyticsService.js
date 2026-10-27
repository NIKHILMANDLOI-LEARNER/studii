const Test = require('../models/Test');
const Attendance = require('../models/Attendance');
const AnalyticsReport = require('../models/AnalyticsReport');
const StudentProfile = require('../models/StudentProfile');

/**
 * Calculate detailed strengths and weaknesses for an individual student
 * based on all historical tests and topic breakdowns.
 */
const generateStudentAnalytics = async (studentProfileId) => {
  const student = await StudentProfile.findById(studentProfileId).populate('user', 'name email');
  if (!student) {
    throw new Error('Student profile not found');
  }

  // 1. Fetch all tests that include this student's score
  const tests = await Test.find({
    'scores.student': studentProfileId
  }).sort({ date: 1 });

  // Map to hold aggregated topic performance
  // topic -> { totalScore: number, totalMax: number, count: number, subject: string }
  const topicStats = {};
  const trendHistory = [];
  let totalMarksScored = 0;
  let totalMarksPossible = 0;

  tests.forEach((test) => {
    const studentEntry = test.scores.find(
      (s) => s.student.toString() === studentProfileId.toString()
    );

    if (studentEntry) {
      const percentage = (studentEntry.marksObtained / test.totalMarks) * 100;
      totalMarksScored += studentEntry.marksObtained;
      totalMarksPossible += test.totalMarks;

      trendHistory.push({
        testId: test._id,
        title: test.title,
        date: test.date,
        percentage: Math.round(percentage * 10) / 10
      });

      // Process topic scores
      if (studentEntry.topicScores && studentEntry.topicScores.length > 0) {
        studentEntry.topicScores.forEach((ts) => {
          const key = ts.topic.trim().toLowerCase();
          if (!topicStats[key]) {
            topicStats[key] = {
              topic: ts.topic.trim(),
              subject: test.subject,
              totalScore: 0,
              totalMax: 0,
              attempts: 0
            };
          }
          topicStats[key].totalScore += ts.score;
          topicStats[key].totalMax += ts.maxScore;
          topicStats[key].attempts += 1;
        });
      }
    }
  });

  // Calculate percentage proficiency per topic
  const strengths = [];
  const weaknesses = [];
  const allTopicBreakdown = [];

  Object.values(topicStats).forEach((item) => {
    const proficiency = item.totalMax > 0 
      ? Math.round((item.totalScore / item.totalMax) * 1000) / 10 
      : 0;

    const topicData = {
      topic: item.topic,
      subject: item.subject,
      proficiency,
      attempts: item.attempts
    };

    allTopicBreakdown.push(topicData);

    if (proficiency >= 75) {
      strengths.push(topicData);
    } else if (proficiency < 60) {
      weaknesses.push(topicData);
    }
  });

  // Sort strengths descending (highest mastery first)
  strengths.sort((a, b) => b.proficiency - a.proficiency);
  // Sort weaknesses ascending (most critical first)
  weaknesses.sort((a, b) => a.proficiency - b.proficiency);

  // 2. Fetch Attendance Records for this student
  const attendanceSessions = await Attendance.find({
    'records.student': studentProfileId
  });

  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;

  attendanceSessions.forEach((session) => {
    const rec = session.records.find(
      (r) => r.student.toString() === studentProfileId.toString()
    );
    if (rec) {
      if (rec.status === 'present') presentCount++;
      else if (rec.status === 'late') lateCount++;
      else if (rec.status === 'absent') absentCount++;
    }
  });

  const totalSessions = presentCount + lateCount + absentCount;
  const attendancePercentage = totalSessions > 0
    ? Math.round(((presentCount + lateCount * 0.75) / totalSessions) * 1000) / 10
    : 100;

  const overallAverage = totalMarksPossible > 0
    ? Math.round((totalMarksScored / totalMarksPossible) * 1000) / 10
    : 0;

  // 3. Generate tailored recommendations
  const recommendations = [];
  if (weaknesses.length > 0) {
    const weakList = weaknesses.slice(0, 3).map((w) => `${w.topic} (${w.proficiency}%)`).join(', ');
    recommendations.push(`Priority focus needed on topics: ${weakList}.`);
  }
  if (attendancePercentage < 75) {
    recommendations.push(`Attendance is currently ${attendancePercentage}%, which is below the recommended 75% threshold.`);
  }
  if (strengths.length > 0) {
    recommendations.push(`Strong understanding demonstrated in: ${strengths.slice(0, 2).map((s) => s.topic).join(', ')}.`);
  }
  if (recommendations.length === 0) {
    recommendations.push('Keep maintaining consistent performance and study habits across all scheduled topics.');
  }

  // 4. Upsert AnalyticsReport document
  const report = await AnalyticsReport.findOneAndUpdate(
    { student: studentProfileId },
    {
      student: studentProfileId,
      teacher: student.teacher,
      overallAverage,
      attendancePercentage,
      totalTestsTaken: tests.length,
      strengths,
      weaknesses,
      trendHistory,
      recommendations,
      lastGeneratedAt: new Date()
    },
    { upsert: true, new: true }
  );

  return {
    report,
    allTopicBreakdown,
    attendanceStats: {
      totalSessions,
      presentCount,
      lateCount,
      absentCount,
      attendancePercentage
    }
  };
};

/**
 * Calculate aggregate class-wide performance analytics for Teacher Dashboard
 */
const generateClassAnalytics = async (teacherId, classLevel) => {
  const query = { teacher: teacherId };
  if (classLevel && classLevel !== 'all') {
    query.classLevel = classLevel;
  }

  const tests = await Test.find(query).populate('scores.student', 'studentId user classLevel');
  const students = await StudentProfile.find(query).populate('user', 'name email');

  let totalTestsGiven = tests.length;
  let totalStudentSubmissions = 0;
  let aggregateClassScoreSum = 0;
  let aggregateClassMaxSum = 0;

  const topicAggregate = {}; // topic -> { score, max }

  tests.forEach((test) => {
    test.scores.forEach((sc) => {
      totalStudentSubmissions++;
      aggregateClassScoreSum += sc.marksObtained;
      aggregateClassMaxSum += test.totalMarks;

      if (sc.topicScores && sc.topicScores.length > 0) {
        sc.topicScores.forEach((ts) => {
          const key = ts.topic.trim();
          if (!topicAggregate[key]) {
            topicAggregate[key] = { topic: key, score: 0, max: 0 };
          }
          topicAggregate[key].score += ts.score;
          topicAggregate[key].max += ts.maxScore;
        });
      }
    });
  });

  const classTopicProficiency = Object.values(topicAggregate).map((t) => ({
    topic: t.topic,
    proficiency: t.max > 0 ? Math.round((t.score / t.max) * 1000) / 10 : 0
  })).sort((a, b) => a.proficiency - b.proficiency);

  const classWeakTopics = classTopicProficiency.filter((t) => t.proficiency < 65);
  const classStrongTopics = classTopicProficiency.filter((t) => t.proficiency >= 75);

  const classAverage = aggregateClassMaxSum > 0
    ? Math.round((aggregateClassScoreSum / aggregateClassMaxSum) * 1000) / 10
    : 0;

  return {
    totalStudents: students.length,
    totalTestsGiven,
    classAverage,
    classWeakTopics,
    classStrongTopics,
    allTopicProficiencies: classTopicProficiency
  };
};

module.exports = {
  generateStudentAnalytics,
  generateClassAnalytics
};
