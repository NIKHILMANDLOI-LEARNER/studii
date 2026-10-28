const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['teacher', 'student', 'parent'],
      required: true,
      default: 'student'
    },
    // For Teachers: Unique identifier code students use to join this teacher's center
    teacherCode: {
      type: String,
      uppercase: true,
      trim: true
    },
    // For Students: Unique student admission/registration ID
    studentId: {
      type: String,
      uppercase: true,
      trim: true
    },
    // For Parents: Array of linked student profiles
    linkedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentProfile'
      }
    ],
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Optional IDs should be unique only when they contain a string value.
// This permits multiple accounts with absent IDs, including legacy nulls.
userSchema.index(
  { teacherCode: 1 },
  {
    unique: true,
    partialFilterExpression: { teacherCode: { $type: 'string' } },
    name: 'teacherCode_1'
  }
);
userSchema.index(
  { studentId: 1 },
  {
    unique: true,
    partialFilterExpression: { studentId: { $type: 'string' } },
    name: 'studentId_1'
  }
);

module.exports = mongoose.model('User', userSchema);
