const express = require('express');
const router = express.Router();
const {
  uploadResource,
  getResources,
  deleteResource
} = require('../controllers/resourceController');
const { authenticate, authorize } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

// All resource routes require authentication
router.use(authenticate);

// Accessible by Teacher, Student, Parent
router.get('/', getResources);

// Teacher-only actions
router.post('/upload', authorize('teacher'), upload.single('file'), uploadResource);
router.delete('/:id', authorize('teacher'), deleteResource);

module.exports = router;
