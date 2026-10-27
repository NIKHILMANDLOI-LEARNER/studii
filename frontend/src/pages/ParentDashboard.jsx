import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  Plus, 
  Award, 
  CalendarCheck, 
  AlertTriangle, 
  CheckCircle, 
  UserCheck, 
  Trash2,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell 
} from 'recharts';

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [childDetails, setChildDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  // Fetch all linked children
  const fetchChildren = async () => {
    try {
      setLoading(true);
      const res = await api.get('/parent/children');
      const kids = res.data.children || [];
      setChildren(kids);
      if (kids.length > 0 && !selectedChildId) {
        setSelectedChildId(kids[0].profile._id);
      }
    } catch (err) {
      console.error('Failed to load children:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  // Fetch selected child details whenever selectedChildId changes
  useEffect(() => {
    if (!selectedChildId) return;

    const fetchChildData = async () => {
      try {
        setDetailsLoading(true);
        const res = await api.get(`/parent/child/${selectedChildId}`);
        setChildDetails(res.data);
      } catch (err) {
        console.error('Failed to load child details:', err);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchChildData();
  }, [selectedChildId]);

  // Link child handler
  const handleLinkChild = async (e) => {
    e.preventDefault();
    if (!newStudentId) return;
    setLinkError('');
    setLinkSuccess('');

    try {
      const res = await api.post('/parent/link-student', { studentId: newStudentId });
      setLinkSuccess(res.data.message);
      setNewStudentId('');
      fetchChildren();
    } catch (err) {
      setLinkError(err.response?.data?.message || 'Failed to link student. Verify the Student ID.');
    }
  };

  const getBarColor = (val) => {
    if (val >= 75) return '#10b981';
    if (val < 60) return '#f43f5e';
    return '#f59e0b';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Link Student Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            Parent Portal: Multi-Student Academic Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor progress, exam records, attendance, and learning curves for all your enrolled children.
          </p>
        </div>

        {/* Link Child Form */}
        <form onSubmit={handleLinkChild} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter Student ID (e.g. STU-1001)"
            value={newStudentId}
            onChange={(e) => setNewStudentId(e.target.value)}
            className="px-3 py-2 text-xs uppercase font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-56"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Link Child
          </button>
        </form>
      </div>

      {linkError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {linkError}
        </div>
      )}
      {linkSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
          {linkSuccess}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 font-medium text-sm">Loading children profiles...</span>
        </div>
      ) : children.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No students linked yet</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Ask your child or their tuition tutor for their unique Student ID (e.g. STU-XXXX) and enter it above to view their academic records.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Child Switcher Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Child to View:
            </label>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {children.map((kid) => {
                const isSelected = selectedChildId === kid.profile._id;
                return (
                  <button
                    key={kid.profile._id}
                    onClick={() => setSelectedChildId(kid.profile._id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left min-w-[200px] ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {kid.profile.user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 leading-tight">
                        {kid.profile.user.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {kid.profile.studentId} • {kid.profile.classLevel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Child Academic Dashboard */}
          {detailsLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3"></div>
              Loading academic analytics...
            </div>
          ) : childDetails ? (
            <div className="space-y-6">
              {/* Child KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exam Average</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{childDetails.analytics?.overallAverage || 0}%</h3>
                    <span className="text-xs text-emerald-600 mt-1 font-medium">Cohort Verified</span>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{childDetails.attendanceStats?.attendancePercentage || 0}%</h3>
                    <span className="text-xs text-slate-500 mt-1">{childDetails.attendanceStats?.presentCount || 0} / {childDetails.attendanceStats?.totalSessions || 0} Sessions</span>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tutor Contact</p>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 truncate max-w-[140px]">
                      {childDetails.studentProfile?.teacher?.name}
                    </h3>
                    <span className="text-xs text-slate-400">{childDetails.studentProfile?.teacher?.email}</span>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <UserCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Focus Needed</p>
                    <h3 className="text-2xl font-bold text-rose-600 mt-1">{childDetails.analytics?.weaknesses?.length || 0}</h3>
                    <span className="text-xs text-rose-500 mt-1">Weak Topics Identified</span>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Topic Mastery Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Topic Mastery Breakdown for {childDetails.studentProfile?.user?.name}
                    </h3>
                    <p className="text-xs text-slate-400">Granular view of which topics your child is excelling at or struggling with</p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  {childDetails.allTopicBreakdown?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={childDetails.allTopicBreakdown} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="topic" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          formatter={(v) => [`${v}%`, 'Proficiency']}
                          contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none' }}
                        />
                        <Bar dataKey="proficiency" radius={[6, 6, 0, 0]}>
                          {childDetails.allTopicBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.proficiency)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      No assessment data available yet for this child.
                    </div>
                  )}
                </div>
              </div>

              {/* Test History Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Exam History & Teacher Feedback</h3>
                  <span className="text-xs text-slate-400 font-mono">{childDetails.tests?.length || 0} Tests</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Test Title</th>
                        <th className="px-5 py-3 font-semibold">Subject</th>
                        <th className="px-5 py-3 font-semibold">Score</th>
                        <th className="px-5 py-3 font-semibold">Percentage</th>
                        <th className="px-5 py-3 font-semibold">Tutor Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {childDetails.tests?.map((t) => (
                        <tr key={t.testId} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-3.5 font-bold text-slate-900">{t.title}</td>
                          <td className="px-5 py-3.5">{t.subject}</td>
                          <td className="px-5 py-3.5 font-mono">{t.marksObtained} / {t.totalMarks}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              t.percentage >= 75 ? 'bg-emerald-100 text-emerald-800' :
                              t.percentage < 60 ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {t.percentage}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 italic text-slate-500">{t.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
