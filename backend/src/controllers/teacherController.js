const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Attendance = require('../models/Attendance');
const Test = require('../models/Test');
const { generateStudentAnalytics } = require('../services/analyticsService');

// @route   GET /api/teacher/students
// @desc    Get all students linked to this teacher
exports.getStudents = async (req, res) => {
  try {
    const students = await StudentProfile.find({ teacher: req.user._id })
      .populate('user', 'name email phone avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
};

// @route   POST /api/teacher/students
// @desc    Teacher manually registers or enrolls a new student
exports.addStudent = async (req, res) => {
  try {
    const { name, email, password, classLevel, subjects, parentName, parentPhone } = req.body;

    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let assignedStudentId = 'STU-';
    for (let i = 0; i < 5; i++) {
      assignedStudentId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const studentUser = await User.create({
      name,
      email,
      password: password || 'Welcome@123',
      role: 'student',
      studentId: assignedStudentId
    });

    const studentProfile = await StudentProfile.create({
      user: studentUser._id,
      studentId: assignedStudentId,
      teacher: req.user._id,
      classLevel: classLevel || 'Grade 10',
      subjects: Array.isArray(subjects) ? subjects : [subjects || 'General'],
      parentContacts: parentName ? [{ name: parentName, phone: parentPhone }] : []
    });

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      student: {
        profileId: studentProfile._id,
        studentId: assignedStudentId,
        name: studentUser.name,
        email: studentUser.email,
        classLevel: studentProfile.classLevel,
        initialPassword: password || 'Welcome@123'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add student', error: error.message });
  }
};

// @route   PUT /api/teacher/students/:id
// @desc    Update student profile details
exports.updateStudent = async (req, res) => {
  try {
    const { classLevel, subjects, status } = req.body;
    const student = await StudentProfile.findOne({
      _id: req.params.id,
      teacher: req.user._id
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    if (classLevel) student.classLevel = classLevel;
    if (subjects) student.subjects = Array.isArray(subjects) ? subjects : [subjects];
    if (status) student.status = status;

    await student.save();

    res.status(200).json({ success: true, message: 'Student profile updated', student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update student', error: error.message });
  }
};

// @route   POST /api/teacher/attendance
// @desc    Mark or update attendance for a class session
exports.markAttendance = async (req, res) => {
  try {
    const { classLevel, date, sessionTitle, records } = req.body;

    if (!classLevel || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Class level and attendance records array are required' });
    }

    const sessionDate = date ? new Date(date) : new Date();
    // Normalize date to start of day for easy querying
    const normalizedDate = new Date(sessionDate.setHours(0, 0, 0, 0));

    // Upsert attendance for this teacher, class, and date
    let attendance = await Attendance.findOne({
      teacher: req.user._id,
      classLevel,
      date: {
        $gte: normalizedDate,
        $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (attendance) {
      attendance.records = records;
      attendance.sessionTitle = sessionTitle || attendance.sessionTitle;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        teacher: req.user._id,
        classLevel,
        date: normalizedDate,
        sessionTitle: sessionTitle || 'Regular Session',
        records
      });
    }

    // Trigger asynchronous update of student analytics reports
    records.forEach((r) => {
      generateStudentAnalytics(r.student).catch((err) => console.error('Analytics update error:', err));
    });

    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark attendance', error: error.message });
  }
};

// @route   GET /api/teacher/attendance
// @desc    Get attendance records filterable by class and date
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { classLevel, startDate, endDate } = req.query;
    const query = { teacher: req.user._id };

    if (classLevel && classLevel !== 'all') {
      query.classLevel = classLevel;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const records = await Attendance.find(query)
      .populate({
        path: 'records.student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve attendance history', error: error.message });
  }
};

// @route   POST /api/teacher/tests
// @desc    Create a new test with topic breakdowns & student scores
exports.createTest = async (req, res) => {
  try {
    const { title, subject, classLevel, totalMarks, date, topicsCovered, scores } = req.body;

    if (!title || !subject || !classLevel || !totalMarks) {
      return res.status(400).json({ success: false, message: 'Title, subject, class level, and total marks are required' });
    }

    const test = await Test.create({
      title,
      subject,
      classLevel,
      totalMarks: Number(totalMarks),
      date: date ? new Date(date) : new Date(),
      topicsCovered: Array.isArray(topicsCovered) ? topicsCovered : [topicsCovered],
      teacher: req.user._id,
      scores: scores || []
    });

    // Auto-recalculate analytics for all students in this test
    if (scores && scores.length > 0) {
      scores.forEach((s) => {
        generateStudentAnalytics(s.student).catch((err) => console.error('Analytics recalculation err:', err));
      });
    }

    res.status(201).json({
      success: true,
      message: 'Test created and scores recorded',
      test
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create test', error: error.message });
  }
};

// @route   GET /api/teacher/tests
// @desc    Get all tests created by teacher
exports.getTests = async (req, res) => {
  try {
    const { classLevel, subject } = req.query;
    const query = { teacher: req.user._id };

    if (classLevel && classLevel !== 'all') query.classLevel = classLevel;
    if (subject) query.subject = subject;

    const tests = await Test.find(query)
      .populate({
        path: 'scores.student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: tests.length, tests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tests', error: error.message });
  }
};
