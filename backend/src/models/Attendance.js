const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present'
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
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
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    sessionTitle: {
      type: String,
      default: 'Regular Class'
    },
    records: [attendanceRecordSchema]
  },
  {
    timestamps: true
  }
);

// Prevent duplicate attendance for the same teacher, class, and date
attendanceSchema.index({ teacher: 1, classLevel: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
