import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  User, 
  Users, 
  KeyRound, 
  Mail, 
  Lock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('teacher'); // 'teacher' | 'student' | 'parent'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    teacherCode: '',
    classLevel: 'Grade 10',
    subjects: 'Mathematics, Science',
    studentIdToLink: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role,
          teacherCode: role === 'student' ? formData.teacherCode.toUpperCase() : undefined,
          classLevel: role === 'student' ? formData.classLevel : undefined,
          subjects: role === 'student' ? formData.subjects.split(',').map((s) => s.trim()) : undefined,
          studentIdsToLink: role === 'parent' && formData.studentIdToLink ? [formData.studentIdToLink.toUpperCase()] : []
        };
        await register(payload);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 mb-4">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">TuitionNexus</h2>
        <p className="mt-2 text-sm text-slate-300">
          Academic Management, Attendance & Performance Analytics
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {/* Mode Switcher: Login / Register */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                isLogin ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                !isLogin ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Role selector for Registration */}
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border flex flex-col items-center gap-1 transition-all ${
                    role === 'teacher'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border flex flex-col items-center gap-1 transition-all ${
                    role === 'student'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('parent')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border flex flex-col items-center gap-1 transition-all ${
                    role === 'parent'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Parent</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Jane Smith"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="block w-full pl-9 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full pl-9 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Student specific fields */}
            {!isLogin && role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Teacher Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="teacherCode"
                    required
                    value={formData.teacherCode}
                    onChange={handleChange}
                    placeholder="e.g. TCH-8K9L"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 uppercase text-slate-900 focus:border-emerald-500 focus:outline-none text-sm font-mono"
                  />
                  <p className="mt-1 text-xs text-slate-400">Provided by your tuition tutor</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Class/Batch</label>
                    <input
                      type="text"
                      name="classLevel"
                      value={formData.classLevel}
                      onChange={handleChange}
                      placeholder="Grade 10"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Subjects</label>
                    <input
                      type="text"
                      name="subjects"
                      value={formData.subjects}
                      onChange={handleChange}
                      placeholder="Math, Science"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Parent specific fields */}
            {!isLogin && role === 'parent' && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Student ID to Link (Optional)
                </label>
                <input
                  type="text"
                  name="studentIdToLink"
                  value={formData.studentIdToLink}
                  onChange={handleChange}
                  placeholder="e.g. STU-9A2X"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 uppercase font-mono text-slate-900 text-sm"
                />
                <p className="mt-1 text-xs text-slate-400">You can also link more children later in your dashboard</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all"
            >
              <span>{loading ? 'Processing...' : isLogin ? 'Sign In to Dashboard' : `Register as ${role.toUpperCase()}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials for Fast Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-1 font-semibold text-slate-700 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Developer Quick Fill:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setFormData({ ...formData, email: 'teacher@demo.com', password: 'password123' });
                }}
                className="p-1.5 rounded bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border text-center transition"
              >
                Teacher Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setFormData({ ...formData, email: 'student@demo.com', password: 'password123' });
                }}
                className="p-1.5 rounded bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border text-center transition"
              >
                Student Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setFormData({ ...formData, email: 'parent@demo.com', password: 'password123' });
                }}
                className="p-1.5 rounded bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border text-center transition"
              >
                Parent Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
