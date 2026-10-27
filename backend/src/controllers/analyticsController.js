const { generateStudentAnalytics, generateClassAnalytics } = require('../services/analyticsService');
const StudentProfile = require('../models/StudentProfile');

// @route   GET /api/analytics/student/:profileId
// @desc    Get comprehensive strength & weakness report for a student
exports.getStudentAnalytics = async (req, res) => {
  try {
    const { profileId } = req.params;

    // RBAC check
    if (req.user.role === 'teacher') {
      const student = await StudentProfile.findOne({ _id: profileId, teacher: req.user._id });
      if (!student) {
        return res.status(403).json({ success: false, message: 'Student does not belong to your classes' });
      }
    } else if (req.user.role === 'parent') {
      const isLinked = req.user.linkedStudents.some((id) => id.toString() === profileId);
      if (!isLinked) {
        return res.status(403).json({ success: false, message: 'You are not authorized to view this student' });
      }
    } else if (req.user.role === 'student') {
      const myProfile = await StudentProfile.findOne({ user: req.user._id });
      if (!myProfile || myProfile._id.toString() !== profileId) {
        return res.status(403).json({ success: false, message: 'You can only view your own analytics' });
      }
    }

    const analytics = await generateStudentAnalytics(profileId);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics',
      error: error.message
    });
  }
};

// @route   GET /api/analytics/class
// @desc    Get aggregate analytics for teacher's class
exports.getClassAnalytics = async (req, res) => {
  try {
    const { classLevel } = req.query;
    const analytics = await generateClassAnalytics(req.user._id, classLevel);

    res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate class analytics',
      error: error.message
    });
  }
};
