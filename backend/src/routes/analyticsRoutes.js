const express = require('express');
const router = express.Router();
const {
  getStudentAnalytics,
  getClassAnalytics
} = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Student strength/weakness analytics (Teacher, Parent, or the Student themselves)
router.get('/student/:profileId', getStudentAnalytics);

// Class aggregate analytics (Teacher only)
router.get('/class', authorize('teacher'), getClassAnalytics);

module.exports = router;
