const mongoose = require('mongoose');

const topicScoreSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const studentScoreSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0
    },
    topicScores: [topicScoreSchema],
    remarks: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
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
    totalMarks: {
      type: Number,
      required: [true, 'Total marks are required'],
      min: 1
    },
    date: {
      type: Date,
      default: Date.now
    },
    topicsCovered: [
      {
        type: String,
        trim: true
      }
    ],
    scores: [studentScoreSchema]
  },
  {
    timestamps: true
  }
);

testSchema.index({ teacher: 1, classLevel: 1, date: -1 });

module.exports = mongoose.model('Test', testSchema);
