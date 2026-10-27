const mongoose = require('mongoose');

const topicProficiencySchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      default: ''
    },
    proficiency: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    attempts: {
      type: Number,
      default: 1
    }
  },
  { _id: false }
);

const analyticsReportSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true,
      unique: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    overallAverage: {
      type: Number,
      default: 0
    },
    attendancePercentage: {
      type: Number,
      default: 0
    },
    totalTestsTaken: {
      type: Number,
      default: 0
    },
    strengths: [topicProficiencySchema],
    weaknesses: [topicProficiencySchema],
    trendHistory: [
      {
        testId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Test'
        },
        title: String,
        date: Date,
        percentage: Number
      }
    ],
    recommendations: [
      {
        type: String
      }
    ],
    lastGeneratedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AnalyticsReport', analyticsReportSchema);
