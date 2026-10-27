const express = require('express');
const router = express.Router();
const {
  getStudents,
  addStudent,
  updateStudent,
  markAttendance,
  getAttendanceHistory,
  createTest,
  getTests
} = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middlewares/auth');

// All teacher routes require authentication and teacher role
router.use(authenticate, authorize('teacher'));

router.get('/students', getStudents);
router.post('/students', addStudent);
router.put('/students/:id', updateStudent);

router.post('/attendance', markAttendance);
router.get('/attendance', getAttendanceHistory);

router.post('/tests', createTest);
router.get('/tests', getTests);

module.exports = router;
