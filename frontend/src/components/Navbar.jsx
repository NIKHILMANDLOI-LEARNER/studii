import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  LogOut, 
  BookOpen, 
  BarChart3, 
  Users, 
  FolderDown, 
  CheckSquare 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-800 bg-clip-text text-transparent">
                TuitionNexus
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {user.role} Portal
              </span>
            </div>
          </div>

          {/* Navigation items based on Role */}
          <nav className="hidden md:flex items-center space-x-1">
            {user.role === 'teacher' && (
              <>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeTab === 'analytics'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Class Analytics</span>
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeTab === 'students'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Students & Attendance</span>
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeTab === 'resources'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FolderDown className="w-4 h-4" />
                  <span>Study Resources</span>
                </button>
              </>
            )}

            {user.role === 'student' && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>My Report & Strengths</span>
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeTab === 'resources'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Resource Library</span>
                </button>
              </>
            )}

            {user.role === 'parent' && (
              <>
                <button
                  onClick={() => setActiveTab('parent-view')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeTab === 'parent-view'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Children Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeTab === 'resources'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FolderDown className="w-4 h-4" />
                  <span>Shared Materials</span>
                </button>
              </>
            )}
          </nav>

          {/* User profile & Sign out */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800">{user.name}</div>
              <div className="text-xs text-slate-500 font-mono">
                {user.role === 'teacher' && `Code: ${user.teacherCode || 'N/A'}`}
                {user.role === 'student' && `ID: ${user.studentId || 'N/A'}`}
                {user.role === 'parent' && 'Parent Account'}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
