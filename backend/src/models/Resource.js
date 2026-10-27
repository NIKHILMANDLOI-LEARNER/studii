const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    publicId: {
      type: String,
      default: ''
    },
    fileType: {
      type: String,
      default: 'pdf'
    },
    fileSize: {
      type: Number,
      default: 0
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    classLevel: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    assignedScope: {
      type: String,
      enum: ['all', 'specific'],
      default: 'all'
    },
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentProfile'
      }
    ]
  },
  {
    timestamps: true
  }
);

resourceSchema.index({ teacher: 1, classLevel: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
