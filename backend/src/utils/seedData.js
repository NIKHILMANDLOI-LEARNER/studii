const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Test = require('../models/Test');
const Attendance = require('../models/Attendance');
const Resource = require('../models/Resource');
const { generateStudentAnalytics } = require('../services/analyticsService');

dotenv.config();

const seedDB = async () => {
  try {
    console.log('Seeding demo database...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      StudentProfile.deleteMany({}),
      Test.deleteMany({}),
      Attendance.deleteMany({}),
      Resource.deleteMany({})
    ]);

    // 1. Create Teacher
    // NOTE: Pass plain password so User pre-save hook handles hashing cleanly!
    const teacher = await User.create({
      name: 'Dr. Evelyn Reed',
      email: 'teacher@demo.com',
      password: 'password123',
      role: 'teacher',
      teacherCode: 'TCH-DEMO',
      phone: '+1 555-019-2834'
    });

    // 2. Create Students & Profiles
    const student1User = await User.create({
      name: 'Liam Davies',
      email: 'student@demo.com',
      password: 'password123',
      role: 'student',
      studentId: 'STU-1001'
    });

    const student1 = await StudentProfile.create({
      user: student1User._id,
      studentId: 'STU-1001',
      teacher: teacher._id,
      classLevel: 'Grade 10',
      subjects: ['Mathematics', 'Physics']
    });

    const student2User = await User.create({
      name: 'Sophia Martinez',
      email: 'sophia@demo.com',
      password: 'password123',
      role: 'student',
      studentId: 'STU-1002'
    });

    const student2 = await StudentProfile.create({
      user: student2User._id,
      studentId: 'STU-1002',
      teacher: teacher._id,
      classLevel: 'Grade 10',
      subjects: ['Mathematics', 'Chemistry']
    });

    // 3. Create Parent and link student Liam and Sophia
    const parentUser = await User.create({
      name: 'Robert Davies',
      email: 'parent@demo.com',
      password: 'password123',
      role: 'parent',
      linkedStudents: [student1._id, student2._id],
      phone: '+1 555-014-9911'
    });

    // 4. Create Tests with Granular Topic Breakdowns
    const test1 = await Test.create({
      title: 'Algebra & Quadratic Equations Assessment',
      subject: 'Mathematics',
      classLevel: 'Grade 10',
      teacher: teacher._id,
      totalMarks: 50,
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      topicsCovered: ['Factoring', 'Quadratic Formula', 'Completing the Square'],
      scores: [
        {
          student: student1._id,
          marksObtained: 42,
          topicScores: [
            { topic: 'Factoring', score: 18, maxScore: 20 },
            { topic: 'Quadratic Formula', score: 16, maxScore: 20 },
            { topic: 'Completing the Square', score: 8, maxScore: 10 }
          ],
          remarks: 'Good grasp of algebra methods.'
        },
        {
          student: student2._id,
          marksObtained: 34,
          topicScores: [
            { topic: 'Factoring', score: 14, maxScore: 20 },
            { topic: 'Quadratic Formula', score: 12, maxScore: 20 },
            { topic: 'Completing the Square', score: 8, maxScore: 10 }
          ],
          remarks: 'Needs further drill on formula application.'
        }
      ]
    });

    const test2 = await Test.create({
      title: 'Trigonometry & Calculus Fundamentals',
      subject: 'Mathematics',
      classLevel: 'Grade 10',
      teacher: teacher._id,
      totalMarks: 50,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      topicsCovered: ['Trigonometric Identities', 'Limits & Continuity', 'Derivatives Basics'],
      scores: [
        {
          student: student1._id,
          marksObtained: 28,
          topicScores: [
            { topic: 'Trigonometric Identities', score: 15, maxScore: 20 },
            { topic: 'Limits & Continuity', score: 7, maxScore: 15 },
            { topic: 'Derivatives Basics', score: 6, maxScore: 15 }
          ],
          remarks: 'Struggling with limits and rate of change definitions.'
        },
        {
          student: student2._id,
          marksObtained: 44,
          topicScores: [
            { topic: 'Trigonometric Identities', score: 19, maxScore: 20 },
            { topic: 'Limits & Continuity', score: 13, maxScore: 15 },
            { topic: 'Derivatives Basics', score: 12, maxScore: 15 }
          ],
          remarks: 'Excellent mastery.'
        }
      ]
    });

    // 5. Create Attendance Records
    for (let i = 10; i >= 1; i--) {
      await Attendance.create({
        teacher: teacher._id,
        classLevel: 'Grade 10',
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        sessionTitle: `Math Lecture Day ${11 - i}`,
        records: [
          {
            student: student1._id,
            status: i === 3 ? 'late' : i === 7 ? 'absent' : 'present'
          },
          {
            student: student2._id,
            status: 'present'
          }
        ]
      });
    }

    // 6. Create Resources
    await Resource.create([
      {
        title: 'Trigonometry Identities Master Cheat-Sheet',
        description: 'Complete list of double angle formulas, Pythagorean identities, and practice proofs.',
        fileUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed_trig_formula',
        fileType: 'pdf',
        fileSize: 1024 * 740,
        teacher: teacher._id,
        classLevel: 'Grade 10',
        subject: 'Mathematics',
        assignedScope: 'all'
      },
      {
        title: 'Calculus Limit Theorems & Worked Solutions',
        description: 'Step-by-step solutions for epsilon-delta proofs and indeterminate limits.',
        fileUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed_calculus_notes',
        fileType: 'pdf',
        fileSize: 1024 * 1250,
        teacher: teacher._id,
        classLevel: 'Grade 10',
        subject: 'Mathematics',
        assignedScope: 'all'
      }
    ]);

    // 7. Auto-generate Analytics Reports for both students
    await generateStudentAnalytics(student1._id);
    await generateStudentAnalytics(student2._id);

    console.log('✅ Demo Data Seeded Successfully!');
    console.log('Teacher: teacher@demo.com / password123 (Code: TCH-DEMO)');
    console.log('Student: student@demo.com / password123 (ID: STU-1001)');
    console.log('Parent: parent@demo.com / password123 (Has 2 linked children)');
  } catch (error) {
    console.error('Seeding Error:', error);
    throw error;
  }
};

// If run directly via node src/utils/seedData.js
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition_management')
    .then(async () => {
      await seedDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error('MongoDB connection failed for seeder:', err.message);
      process.exit(1);
    });
}

module.exports = seedDB;
