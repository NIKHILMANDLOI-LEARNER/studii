import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Check, 
  Clock, 
  X, 
  Save, 
  BookOpen, 
  Plus, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('attendance'); // 'attendance' | 'students' | 'add-test'
  
  // Attendance state
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [sessionTitle, setSessionTitle] = useState('Regular Lecture');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  // New Student modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    classLevel: 'Grade 10',
    subjects: 'Mathematics',
    parentName: '',
    parentPhone: ''
  });

  // New Test state
  const [testForm, setTestForm] = useState({
    title: '',
    subject: 'Mathematics',
    classLevel: 'Grade 10',
    totalMarks: 50,
    topicsCovered: '',
    scores: {}
  });
  const [testSuccess, setTestSuccess] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/students');
      setStudents(res.data.students || []);

      // Initialize attendance records default to 'present'
      const initialAtt = {};
      (res.data.students || []).forEach((s) => {
        initialAtt[s._id] = 'present';
      });
      setAttendanceRecords(initialAtt);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    try {
      const records = Object.keys(attendanceRecords).map((studentId) => ({
        student: studentId,
        status: attendanceRecords[studentId]
      }));

      await api.post('/teacher/attendance', {
        classLevel: selectedClass,
        sessionTitle,
        date: attendanceDate,
        records
      });

      setAttendanceSaved(true);
      setTimeout(() => setAttendanceSaved(false), 3000);
    } catch (err) {
      alert('Failed to save attendance: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teacher/students', {
        ...newStudent,
        subjects: newStudent.subjects.split(',').map((s) => s.trim())
      });
      setShowAddStudentModal(false);
      setNewStudent({
        name: '',
        email: '',
        classLevel: 'Grade 10',
        subjects: 'Mathematics',
        parentName: '',
        parentPhone: ''
      });
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add student');
    }
  };

  const handleTestScoreChange = (studentId, marks) => {
    setTestForm((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [studentId]: marks
      }
    }));
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      const formattedScores = Object.keys(testForm.scores).map((studentId) => {
        const marks = Number(testForm.scores[studentId]) || 0;
        const topics = testForm.topicsCovered.split(',').map((t) => t.trim()).filter(Boolean);
        
        // Distribute score across topics for analytics calculation
        const perTopicMax = topics.length > 0 ? testForm.totalMarks / topics.length : testForm.totalMarks;
        const topicRatio = testForm.totalMarks > 0 ? marks / testForm.totalMarks : 0;

        const topicScores = topics.map((t) => ({
          topic: t,
          score: Math.round(perTopicMax * topicRatio * 10) / 10,
          maxScore: perTopicMax
        }));

        return {
          student: studentId,
          marksObtained: marks,
          topicScores,
          remarks: marks >= (testForm.totalMarks * 0.75) ? 'Excellent performance' : 'Requires targeted practice'
        };
      });

      await api.post('/teacher/tests', {
        title: testForm.title,
        subject: testForm.subject,
        classLevel: testForm.classLevel,
        totalMarks: Number(testForm.totalMarks),
        topicsCovered: testForm.topicsCovered.split(',').map((t) => t.trim()),
        scores: formattedScores
      });

      setTestSuccess('Test scores recorded and analytics refreshed!');
      setTimeout(() => setTestSuccess(''), 4000);
      setTestForm({
        title: '',
        subject: 'Mathematics',
        classLevel: 'Grade 10',
        totalMarks: 50,
        topicsCovered: '',
        scores: {}
      });
    } catch (err) {
      alert('Failed to record test scores: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Mark Daily Attendance
          </button>
          <button
            onClick={() => setActiveSubTab('add-test')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'add-test'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Enter Test & Topic Scores
          </button>
          <button
            onClick={() => setActiveSubTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'students'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Enrolled Students ({students.length})
          </button>
        </div>

        <button
          onClick={() => setShowAddStudentModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          Enroll Student Directly
        </button>
      </div>

      {/* Attendance Tracker View */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Attendance Tracker
              </h2>
              <p className="text-xs text-slate-400">Mark session presence to maintain accurate attendance percentages.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none"
              />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none font-medium"
              >
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
              <input
                type="text"
                placeholder="Session (e.g. Calculus Pt. 2)"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none w-44"
              />
            </div>
          </div>

          {attendanceSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Attendance records successfully saved and synced to student transcripts!
            </div>
          )}

          {students.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">No students found. Enroll students to start tracking attendance.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Student Name</th>
                    <th className="px-5 py-3 font-semibold">Student ID</th>
                    <th className="px-5 py-3 font-semibold">Batch</th>
                    <th className="px-5 py-3 font-semibold text-center">Status (Present / Late / Absent)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((st) => {
                    const status = attendanceRecords[st._id] || 'present';
                    return (
                      <tr key={st._id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{st.user?.name}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-500">{st.studentId}</td>
                        <td className="px-5 py-3.5">{st.classLevel}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAttendanceChange(st._id, 'present')}
                              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                                status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" /> Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAttendanceChange(st._id, 'late')}
                              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                                status === 'late'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" /> Late
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAttendanceChange(st._id, 'absent')}
                              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                                status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" /> Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={submitAttendance}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              Save Attendance Record
            </button>
          </div>
        </div>
      )}

      {/* Enter Test & Topic Scores View */}
      {activeSubTab === 'add-test' && (
        <form onSubmit={handleCreateTest} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Record Test & Topic-Wise Scores
            </h2>
            <p className="text-xs text-slate-400">
              Entering topic scores automatically powers the Strength & Weakness calculation engine for students and parents.
            </p>
          </div>

          {testSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
              {testSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Test Title</label>
              <input
                type="text"
                required
                value={testForm.title}
                onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                placeholder="e.g. Midterm 1: Algebra & Calculus"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={testForm.subject}
                onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })}
                placeholder="Mathematics"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Level</label>
              <select
                value={testForm.classLevel}
                onChange={(e) => setTestForm({ ...testForm, classLevel: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none font-medium"
              >
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Total Marks</label>
              <input
                type="number"
                required
                min="1"
                value={testForm.totalMarks}
                onChange={(e) => setTestForm({ ...testForm, totalMarks: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Topics Covered (Comma separated for Strength/Weakness analytics)
            </label>
            <input
              type="text"
              required
              value={testForm.topicsCovered}
              onChange={(e) => setTestForm({ ...testForm, topicsCovered: e.target.value })}
              placeholder="e.g. Quadratic Equations, Trigonometry, Limits"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Student Score Matrix */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Enter Marks for Students (Out of {testForm.totalMarks})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {students.map((st) => (
                <div key={st._id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{st.user?.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{st.studentId}</div>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="0"
                      max={testForm.totalMarks}
                      placeholder="Marks"
                      value={testForm.scores[st._id] || ''}
                      onChange={(e) => handleTestScoreChange(st._id, e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-mono text-center bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Submit Test & Trigger Analytics Engine
            </button>
          </div>
        </form>
      )}

      {/* Enrolled Students Directory */}
      {activeSubTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Student Directory</h3>
            <span className="text-xs text-slate-400 font-mono">{students.length} Total Enrolled</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((st) => (
              <div key={st._id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-200 transition">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-sm">
                    {st.user?.name?.charAt(0)}
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-600">
                    {st.studentId}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2">{st.user?.name}</h4>
                <p className="text-xs text-slate-400 truncate">{st.user?.email}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex justify-between text-slate-500">
                  <span>Class: {st.classLevel}</span>
                  <span className="capitalize">{st.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Direct Student Enrollment</h3>
            <p className="text-xs text-slate-400 mt-0.5">A unique Student ID will be generated automatically.</p>

            <form onSubmit={handleAddStudentSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="e.g. Alex Johnson"
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Student Email</label>
                <input
                  type="email"
                  required
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="alex@example.com"
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Class/Batch</label>
                  <input
                    type="text"
                    value={newStudent.classLevel}
                    onChange={(e) => setNewStudent({ ...newStudent, classLevel: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Subjects</label>
                  <input
                    type="text"
                    value={newStudent.subjects}
                    onChange={(e) => setNewStudent({ ...newStudent, subjects: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Parent Name (Optional)</label>
                  <input
                    type="text"
                    value={newStudent.parentName}
                    onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Parent Phone</label>
                  <input
                    type="text"
                    value={newStudent.parentPhone}
                    onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
