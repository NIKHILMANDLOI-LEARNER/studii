const StudentProfile = require('../models/StudentProfile');
const Test = require('../models/Test');
const Attendance = require('../models/Attendance');
const { generateStudentAnalytics } = require('../services/analyticsService');

// @route   GET /api/student/profile
// @desc    Get student profile details
exports.getMyProfile = async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.user._id })
      .populate('user', 'name email phone avatar')
      .populate('teacher', 'name email phone teacherCode');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    res.status(200).json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @route   GET /api/student/report-card
// @desc    Get complete test history and marks breakdown
exports.getMyReportCard = async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const tests = await Test.find({
      'scores.student': student._id
    }).sort({ date: -1 });

    const reportCard = tests.map((t) => {
      const myScore = t.scores.find((s) => s.student.toString() === student._id.toString());
      return {
        testId: t._id,
        title: t.title,
        subject: t.subject,
        classLevel: t.classLevel,
        date: t.date,
        totalMarks: t.totalMarks,
        marksObtained: myScore ? myScore.marksObtained : 0,
        percentage: myScore ? Math.round((myScore.marksObtained / t.totalMarks) * 1000) / 10 : 0,
        topicScores: myScore ? myScore.topicScores : [],
        remarks: myScore ? myScore.remarks : ''
      };
    });

    res.status(200).json({ success: true, count: reportCard.length, reportCard });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch report card', error: error.message });
  }
};

// @route   GET /api/student/attendance
// @desc    Get personal attendance records
exports.getMyAttendance = async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const sessions = await Attendance.find({
      'records.student': student._id
    }).sort({ date: -1 });

    let present = 0;
    let late = 0;
    let absent = 0;

    const sessionList = sessions.map((s) => {
      const rec = s.records.find((r) => r.student.toString() === student._id.toString());
      const status = rec ? rec.status : 'absent';
      if (status === 'present') present++;
      else if (status === 'late') late++;
      else absent++;

      return {
        attendanceId: s._id,
        date: s.date,
        sessionTitle: s.sessionTitle,
        classLevel: s.classLevel,
        status,
        remarks: rec ? rec.remarks : ''
      };
    });

    const total = present + late + absent;
    const attendancePercentage = total > 0 ? Math.round(((present + late * 0.75) / total) * 1000) / 10 : 100;

    res.status(200).json({
      success: true,
      summary: {
        totalSessions: total,
        present,
        late,
        absent,
        attendancePercentage
      },
      history: sessionList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: error.message });
  }
};

// @route   GET /api/student/analytics
// @desc    Get weakness/strength breakdown and performance trends
exports.getMyAnalytics = async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const analytics = await generateStudentAnalytics(student._id);

    res.status(200).json({
      success: true,
      analytics: analytics.report,
      allTopicBreakdown: analytics.allTopicBreakdown,
      attendanceStats: analytics.attendanceStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate analytics', error: error.message });
  }
};
