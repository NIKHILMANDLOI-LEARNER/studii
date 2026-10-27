const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
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
    subjects: [
      {
        type: String,
        trim: true
      }
    ],
    parentContacts: [
      {
        name: String,
        relationship: String,
        phone: String,
        email: String
      }
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated'],
      default: 'active'
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Helpful index for fast lookups by studentId and teacher
studentProfileSchema.index({ studentId: 1, teacher: 1 });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
