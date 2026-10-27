# TuitionNexus - Full-Stack Tuition & Academic Management System

A production-ready full-stack web application designed for private tuition teachers, students, and parents to manage academic records, learning resources, automated strength/weakness performance analytics, and daily attendance.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 18 (Vite), Tailwind CSS, Lucide React icons, Recharts data visualization.
- **Backend**: Node.js & Express.js (Modular MVC Pattern).
- **Database**: MongoDB with Mongoose ODM (Relational-style referencing & indexing).
- **Asset Storage**: Cloudinary CDN (Direct streaming upload for PDFs, notes & worksheets via Multer).
- **Authentication**: Stateless JWT (JSON Web Tokens) with `bcryptjs` password hashing and Role-Based Access Control (RBAC).

---

## 📁 Project Directory Structure

```plaintext
tuition-management-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # MongoDB connection
│   │   │   └── cloudinary.js         # Cloudinary SDK configuration
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, Login, Me endpoints
│   │   │   ├── teacherController.js  # Student enroll, attendance & test marks
│   │   │   ├── studentController.js  # Report card, attendance, student analytics
│   │   │   ├── parentController.js   # Multi-student linkage & child dashboards
│   │   │   ├── resourceController.js # Study material upload & download
│   │   │   └── analyticsController.js# Student & Class analytics endpoints
│   │   ├── middlewares/
│   │   │   ├── auth.js               # JWT verification & RBAC check
│   │   │   └── upload.js             # Multer + Cloudinary streaming uploader
│   │   ├── models/
│   │   │   ├── User.js               # Teacher, Student, Parent schemas
│   │   │   ├── StudentProfile.js     # Enrolled student profiles & links
│   │   │   ├── Test.js               # Exams, max scores, and topic marks
│   │   │   ├── Attendance.js         # Daily attendance sessions
│   │   │   ├── Resource.js           # Cloudinary file metadata & permissions
│   │   │   └── AnalyticsReport.js    # Pre-computed strengths & weaknesses
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── teacherRoutes.js
│   │   │   ├── studentRoutes.js
│   │   │   ├── parentRoutes.js
│   │   │   ├── resourceRoutes.js
│   │   │   └── analyticsRoutes.js
│   │   ├── services/
│   │   │   └── analyticsService.js   # Topic proficiency & strength/weakness engine
│   │   ├── utils/
│   │   │   └── seedData.js           # Database seeder with demo accounts
│   │   └── server.js                 # Express application entrypoint
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Navbar.jsx            # Dynamic role-based header with child switcher
    │   ├── context/
    │   │   └── AuthContext.jsx       # Global Auth & JWT session state
    │   ├── pages/
    │   │   ├── AuthPage.jsx          # Login & Multi-role registration
    │   │   ├── TeacherAnalyticsPage.jsx # Cohort proficiency & topic analysis
    │   │   ├── TeacherStudentsPage.jsx  # Daily attendance & test score entry
    │   │   ├── StudentDashboard.jsx     # Personal report card & radar charts
    │   │   ├── StudentResourceView.jsx  # Cloudinary file library & upload modal
    │   │   └── ParentDashboard.jsx      # Multi-student switcher & child records
    │   ├── services/
    │   │   └── api.js                # Axios client with JWT interceptors
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🗄️ Database Schemas (Mongoose)

### 1. `User` Model
```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (hashed via bcryptjs),
  role: Enum ['teacher', 'student', 'parent'],
  teacherCode: String (unique, uppercase for Teachers),
  studentId: String (unique, uppercase for Students),
  linkedStudents: [ObjectId -> StudentProfile] (for Parents),
  phone: String,
  avatar: String
}
```

### 2. `StudentProfile` Model
```javascript
{
  user: ObjectId -> User (required, unique),
  studentId: String (required, unique),
  teacher: ObjectId -> User (required),
  classLevel: String (e.g. "Grade 10"),
  subjects: [String],
  parentContacts: [{ name, relationship, phone, email }],
  status: Enum ['active', 'inactive', 'graduated']
}
```

### 3. `Test` Model
```javascript
{
  title: String (required),
  subject: String (required),
  teacher: ObjectId -> User (required),
  classLevel: String,
  totalMarks: Number,
  date: Date,
  topicsCovered: [String],
  scores: [
    {
      student: ObjectId -> StudentProfile,
      marksObtained: Number,
      topicScores: [{ topic: String, score: Number, maxScore: Number }],
      remarks: String
    }
  ]
}
```

### 4. `Attendance` Model
```javascript
{
  teacher: ObjectId -> User (required),
  classLevel: String,
  date: Date,
  sessionTitle: String,
  records: [
    {
      student: ObjectId -> StudentProfile,
      status: Enum ['present', 'absent', 'late'],
      remarks: String
    }
  ]
}
```

### 5. `Resource` Model
```javascript
{
  title: String,
  description: String,
  fileUrl: String (Cloudinary CDN URL),
  publicId: String,
  fileType: String,
  fileSize: Number,
  teacher: ObjectId -> User,
  classLevel: String,
  subject: String,
  assignedScope: Enum ['all', 'specific'],
  assignedStudents: [ObjectId -> StudentProfile]
}
```

### 6. `AnalyticsReport` Model
```javascript
{
  student: ObjectId -> StudentProfile,
  teacher: ObjectId -> User,
  overallAverage: Number,
  attendancePercentage: Number,
  totalTestsTaken: Number,
  strengths: [{ topic: String, proficiency: Number }],
  weaknesses: [{ topic: String, proficiency: Number }],
  trendHistory: [{ testId, title, date, percentage }],
  recommendations: [String],
  lastGeneratedAt: Date
}
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI & Cloudinary credentials
npm run seed  # Pre-populates sample teacher, students, tests & attendance
npm run dev   # Starts backend on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev   # Starts Vite development server on http://localhost:3000
```

---

## 🔑 Demo Logins (After running `npm run seed`)
- **Teacher Account**: `teacher@demo.com` / `password123` (Teacher Code: `TCH-DEMO`)
- **Student Account**: `student@demo.com` / `password123` (Student ID: `STU-1001`)
- **Parent Account**: `parent@demo.com` / `password123` (Pre-linked to 2 students)
