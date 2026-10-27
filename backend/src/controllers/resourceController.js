const Resource = require('../models/Resource');
const StudentProfile = require('../models/StudentProfile');
const { uploadToCloudinary } = require('../middlewares/upload');
const cloudinary = require('../config/cloudinary');

// @route   POST /api/resources/upload
// @desc    Upload study material / PDF to Cloudinary and save resource record
exports.uploadResource = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload' });
    }

    const { title, description, classLevel, subject, assignedScope, assignedStudents } = req.body;

    if (!title || !classLevel || !subject) {
      return res.status(400).json({ success: false, message: 'Title, class level, and subject are required' });
    }

    // Stream file buffer to Cloudinary
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      `tuition_resources/${req.user._id}`
    );

    let parsedAssignedStudents = [];
    if (assignedStudents) {
      parsedAssignedStudents = typeof assignedStudents === 'string'
        ? JSON.parse(assignedStudents)
        : assignedStudents;
    }

    const resource = await Resource.create({
      title,
      description: description || '',
      fileUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      fileType: uploadResult.format,
      fileSize: uploadResult.bytes,
      teacher: req.user._id,
      classLevel,
      subject,
      assignedScope: assignedScope || 'all',
      assignedStudents: parsedAssignedStudents
    });

    res.status(201).json({
      success: true,
      message: 'Resource uploaded successfully',
      resource
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
};

// @route   GET /api/resources
// @desc    Get resources based on role (Teacher sees theirs, Student sees assigned, Parent sees linked)
exports.getResources = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    } else if (req.user.role === 'student') {
      const student = await StudentProfile.findOne({ user: req.user._id });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      query = {
        teacher: student.teacher,
        $or: [
          { assignedScope: 'all', classLevel: student.classLevel },
          { assignedStudents: student._id }
        ]
      };
    } else if (req.user.role === 'parent') {
      // Find classLevels and teachers of linked children
      const profiles = await StudentProfile.find({ _id: { $in: req.user.linkedStudents } });
      const teachers = profiles.map((p) => p.teacher);
      const classes = profiles.map((p) => p.classLevel);
      const studentIds = profiles.map((p) => p._id);

      query = {
        teacher: { $in: teachers },
        $or: [
          { assignedScope: 'all', classLevel: { $in: classes } },
          { assignedStudents: { $in: studentIds } }
        ]
      };
    }

    const { subject, classLevel } = req.query;
    if (subject) query.subject = subject;
    if (classLevel && classLevel !== 'all') query.classLevel = classLevel;

    const resources = await Resource.find(query)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: resources.length, resources });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch resources', error: error.message });
  }
};

// @route   DELETE /api/resources/:id
// @desc    Delete resource (Teacher only)
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found or unauthorized' });
    }

    // Try deleting from Cloudinary if publicId exists
    if (resource.publicId && process.env.CLOUDINARY_API_KEY) {
      try {
        await cloudinary.uploader.destroy(resource.publicId, { resource_type: 'raw' });
      } catch (err) {
        console.warn('Cloudinary delete warning:', err.message);
      }
    }

    await Resource.deleteOne({ _id: resource._id });

    res.status(200).json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete resource', error: error.message });
  }
};
