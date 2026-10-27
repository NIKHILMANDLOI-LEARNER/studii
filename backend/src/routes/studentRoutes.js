const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  getMyReportCard,
  getMyAttendance,
  getMyAnalytics
} = require('../controllers/studentController');
const { authenticate, authorize } = require('../middlewares/auth');

// All student routes require authentication and student role
router.use(authenticate, authorize('student'));

router.get('/profile', getMyProfile);
router.get('/report-card', getMyReportCard);
router.get('/attendance', getMyAttendance);
router.get('/analytics', getMyAnalytics);

module.exports = router;
