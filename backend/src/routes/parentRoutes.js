const express = require('express');
const router = express.Router();
const {
  linkStudent,
  unlinkStudent,
  getLinkedChildren,
  getChildDetails
} = require('../controllers/parentController');
const { authenticate, authorize } = require('../middlewares/auth');

// All parent routes require authentication and parent role
router.use(authenticate, authorize('parent'));

router.post('/link-student', linkStudent);
router.delete('/unlink-student/:profileId', unlinkStudent);
router.get('/children', getLinkedChildren);
router.get('/child/:profileId', getChildDetails);

module.exports = router;
