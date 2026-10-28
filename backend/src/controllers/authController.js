const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'super_secret_jwt_key_tuition_app_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate unique code helper
const generateUniqueCode = (prefix, length = 6) => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = prefix + '-';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// @route   POST /api/auth/register
// @desc    Register a new user (Teacher, Student, or Parent)
exports.register = async (req, res) => {
  try {
    const { name, password, role, teacherCode, classLevel, subjects, phone, studentIdsToLink } = req.body;
    const email = typeof req.body.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    let userRole = role ? role.toLowerCase() : 'student';
    let assignedTeacherCode = null;
    let assignedStudentId = null;
    let teacherUser = null;

    if (userRole === 'teacher') {
      assignedTeacherCode = generateUniqueCode('TCH', 5);
    } else if (userRole === 'student') {
      if (!teacherCode) {
        return res.status(400).json({
          success: false,
          message: 'Teacher Code is required for student registration'
        });
      }

      teacherUser = await User.findOne({ teacherCode: teacherCode.toUpperCase(), role: 'teacher' });
      if (!teacherUser) {
        return res.status(404).json({
          success: false,
          message: 'Invalid Teacher Code. Please verify with your tutor.'
        });
      }

      assignedStudentId = generateUniqueCode('STU', 5);
    }

    // Create user record
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      phone,
      ...(assignedTeacherCode ? { teacherCode: assignedTeacherCode } : {}),
      ...(assignedStudentId ? { studentId: assignedStudentId } : {})
    });

    // If Student, create corresponding StudentProfile linked to teacher
    let studentProfile = null;
    if (userRole === 'student') {
      studentProfile = await StudentProfile.create({
        user: user._id,
        studentId: assignedStudentId,
        teacher: teacherUser._id,
        classLevel: classLevel || 'General',
        subjects: Array.isArray(subjects) ? subjects : (subjects ? [subjects] : ['All Subjects'])
      });
    }

    // If Parent, optionally link initial student IDs if provided
    if (userRole === 'parent' && Array.isArray(studentIdsToLink) && studentIdsToLink.length > 0) {
      const foundProfiles = await StudentProfile.find({
        studentId: { $in: studentIdsToLink.map((s) => s.toUpperCase()) }
      });
      user.linkedStudents = foundProfiles.map((p) => p._id);
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        teacherCode: user.teacherCode,
        studentId: user.studentId,
        studentProfileId: studentProfile ? studentProfile._id : null
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      const duplicateErrorDetails = `${error.message || ''} ${JSON.stringify(error.keyPattern || {})}`;
      const conflictingField = Object.keys(error.keyPattern || {})[0] ||
        ['email', 'teacherCode', 'studentId'].find((field) =>
          duplicateErrorDetails.includes(field)
        );
      const duplicateMessages = {
        email: 'This email is already registered. Please sign in or use another email.',
        teacherCode: 'A teacher code conflict occurred. Please try registering again.',
        studentId: 'A student ID conflict occurred. Please try registering again.'
      };
      return res.status(409).json({
        success: false,
        message: duplicateMessages[conflictingField] ||
          'A unique account value conflicted. Please try again or contact support.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Registration error',
      error: error.message
    });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    let studentProfileId = null;
    if (user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: user._id });
      if (profile) studentProfileId = profile._id;
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        teacherCode: user.teacherCode,
        studentId: user.studentId,
        studentProfileId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login error',
      error: error.message
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current logged in user details
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'linkedStudents',
      populate: { path: 'user', select: 'name email avatar' }
    });

    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await StudentProfile.findOne({ user: user._id }).populate('teacher', 'name email');
    }

    res.status(200).json({
      success: true,
      user,
      studentProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message
    });
  }
};
