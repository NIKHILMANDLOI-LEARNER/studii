const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Test = require('../models/Test');
const Attendance = require('../models/Attendance');
const { generateStudentAnalytics } = require('../services/analyticsService');

// @route   POST /api/parent/link-student
// @desc    Add/link a student to parent account using unique Student ID
exports.linkStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const cleanId = studentId.trim().toUpperCase();
    const studentProfile = await StudentProfile.findOne({ studentId: cleanId })
      .populate('user', 'name email avatar')
      .populate('teacher', 'name email');

    if (!studentProfile) {
      return res.status(404).json({ success: false, message: `No student found with ID "${cleanId}"` });
    }

    const parent = await User.findById(req.user._id);

    // Check if already linked
    const alreadyLinked = parent.linkedStudents.some(
      (id) => id.toString() === studentProfile._id.toString()
    );

    if (alreadyLinked) {
      return res.status(400).json({ success: false, message: 'This student is already linked to your account' });
    }

    parent.linkedStudents.push(studentProfile._id);
    await parent.save();

    res.status(200).json({
      success: true,
      message: `Successfully linked ${studentProfile.user.name} (${cleanId}) to your account`,
      student: studentProfile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to link student', error: error.message });
  }
};

// @route   DELETE /api/parent/unlink-student/:profileId
// @desc    Unlink a student from parent account
exports.unlinkStudent = async (req, res) => {
  try {
    const parent = await User.findById(req.user._id);
    parent.linkedStudents = parent.linkedStudents.filter(
      (id) => id.toString() !== req.params.profileId
    );
    await parent.save();

    res.status(200).json({ success: true, message: 'Student unlinked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unlink student', error: error.message });
  }
};

// @route   GET /api/parent/children
// @desc    Get all linked children with academic summary overview
exports.getLinkedChildren = async (req, res) => {
  try {
    const parent = await User.findById(req.user._id).populate({
      path: 'linkedStudents',
      populate: [
        { path: 'user', select: 'name email phone avatar' },
        { path: 'teacher', select: 'name email phone teacherCode' }
      ]
    });

    const childrenData = await Promise.all(
      parent.linkedStudents.map(async (child) => {
        const analytics = await generateStudentAnalytics(child._id);
        return {
          profile: child,
          overallAverage: analytics.report.overallAverage,
          attendancePercentage: analytics.report.attendancePercentage,
          totalTests: analytics.report.totalTestsTaken,
          topStrengths: analytics.report.strengths.slice(0, 3),
          topWeaknesses: analytics.report.weaknesses.slice(0, 3)
        };
      })
    );

    res.status(200).json({
      success: true,
      count: childrenData.length,
      children: childrenData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch linked children', error: error.message });
  }
};

// @route   GET /api/parent/child/:profileId
// @desc    Get detailed dashboard data for a specific child (marks, attendance, weaknesses)
exports.getChildDetails = async (req, res) => {
  try {
    const parent = await User.findById(req.user._id);
    const isLinked = parent.linkedStudents.some(
      (id) => id.toString() === req.params.profileId
    );

    if (!isLinked) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this student profile' });
    }

    const studentProfile = await StudentProfile.findById(req.params.profileId)
      .populate('user', 'name email phone avatar')
      .populate('teacher', 'name email phone teacherCode');

    if (!studentProfile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Analytics report
    const analytics = await generateStudentAnalytics(studentProfile._id);

    // Tests history
    const tests = await Test.find({ 'scores.student': studentProfile._id }).sort({ date: -1 });
    const formattedTests = tests.map((t) => {
      const score = t.scores.find((s) => s.student.toString() === studentProfile._id.toString());
      return {
        testId: t._id,
        title: t.title,
        subject: t.subject,
        date: t.date,
        totalMarks: t.totalMarks,
        marksObtained: score ? score.marksObtained : 0,
        percentage: score ? Math.round((score.marksObtained / t.totalMarks) * 1000) / 10 : 0,
        topicScores: score ? score.topicScores : [],
        remarks: score ? score.remarks : ''
      };
    });

    // Attendance history
    const attendanceRecords = await Attendance.find({
      'records.student': studentProfile._id
    }).sort({ date: -1 });

    const attendanceHistory = attendanceRecords.map((a) => {
      const rec = a.records.find((r) => r.student.toString() === studentProfile._id.toString());
      return {
        date: a.date,
        sessionTitle: a.sessionTitle,
        status: rec ? rec.status : 'absent',
        remarks: rec ? rec.remarks : ''
      };
    });

    res.status(200).json({
      success: true,
      studentProfile,
      analytics: analytics.report,
      allTopicBreakdown: analytics.allTopicBreakdown,
      attendanceStats: analytics.attendanceStats,
      tests: formattedTests,
      attendanceHistory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve child details', error: error.message });
  }
};
