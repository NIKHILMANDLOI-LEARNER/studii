import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import TeacherAnalyticsPage from './pages/TeacherAnalyticsPage';
import TeacherStudentsPage from './pages/TeacherStudentsPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentResourceView from './pages/StudentResourceView';
import ParentDashboard from './pages/ParentDashboard';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('');

  // Set default tab when user logs in or role changes
  useEffect(() => {
    if (user) {
      if (user.role === 'teacher') setActiveTab('analytics');
      else if (user.role === 'student') setActiveTab('dashboard');
      else if (user.role === 'parent') setActiveTab('parent-view');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-300">Loading TuitionNexus...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 pb-16">
        {/* Teacher Views */}
        {user.role === 'teacher' && activeTab === 'analytics' && <TeacherAnalyticsPage />}
        {user.role === 'teacher' && activeTab === 'students' && <TeacherStudentsPage />}
        
        {/* Student Views */}
        {user.role === 'student' && activeTab === 'dashboard' && <StudentDashboard />}
        
        {/* Parent Views */}
        {user.role === 'parent' && activeTab === 'parent-view' && <ParentDashboard />}

        {/* Shared Resource Library View */}
        {activeTab === 'resources' && <StudentResourceView />}
      </main>
    </div>
  );
}
