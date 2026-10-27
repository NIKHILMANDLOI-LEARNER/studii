import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Award, 
  CalendarCheck, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  BookOpen, 
  Lightbulb, 
  FileSpreadsheet 
} from 'lucide-react';

export default function StudentDashboard() {
  const [reportCard, setReportCard] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [repRes, anaRes, attRes] = await Promise.all([
          api.get('/student/report-card'),
          api.get('/student/analytics'),
          api.get('/student/attendance')
        ]);

        setReportCard(repRes.data.reportCard || []);
        setAnalytics(anaRes.data.analytics || null);
        setAllTopics(anaRes.data.allTopicBreakdown || []);
        setAttendance(attRes.data.summary || null);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getBarColor = (val) => {
    if (val >= 75) return '#10b981';
    if (val < 60) return '#f43f5e';
    return '#f59e0b';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-600 mb-3"></div>
        <p className="text-sm">Retrieving your academic transcript & insights...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Average</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics?.overallAverage || 0}%</h3>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> Exam Grade Avg
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{attendance?.attendancePercentage || 0}%</h3>
            <span className="text-xs text-slate-500 mt-1">{attendance?.present || 0} / {attendance?.totalSessions || 0} Sessions</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mastered Topics</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{analytics?.strengths?.length || 0}</h3>
            <span className="text-xs text-slate-500 mt-1">≥75% Proficiency</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Focus Areas</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{analytics?.weaknesses?.length || 0}</h3>
            <span className="text-xs text-rose-500 mt-1">Needs Revision (&lt;60%)</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* AI Recommendations Card */}
      {analytics?.recommendations?.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/30 text-emerald-300">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Personalized Learning & Revision Recommendations</h3>
          </div>
          <ul className="space-y-2 text-sm text-emerald-100">
            {analytics.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Visual Chart: Strengths & Weaknesses Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Topic Proficiency & Focus Area Analysis</h2>
            <p className="text-xs text-slate-400">Calculated from weighted marks in topic-specific assessment questions</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium mt-2 sm:mt-0">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Strength (≥75%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Moderate (60-74%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Focus Area (&lt;60%)</span>
          </div>
        </div>

        <div className="h-72 w-full">
          {allTopics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allTopics} margin={{ top: 15, right: 30, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="topic" tick={{ fontSize: 12, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Proficiency']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }}
                />
                <Bar dataKey="proficiency" radius={[6, 6, 0, 0]}>
                  {allTopics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.proficiency)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Take more tests to unlock interactive topic proficiency breakdowns.
            </div>
          )}
        </div>
      </div>

      {/* Report Card History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-800">Personal Test & Exam Report Card</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">{reportCard.length} Tests Recorded</span>
        </div>

        {reportCard.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No test records entered yet. When your teacher marks an exam, your score breakdown will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">Test Title</th>
                  <th className="px-6 py-3 font-semibold">Subject</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Score / Max</th>
                  <th className="px-6 py-3 font-semibold">Percentage</th>
                  <th className="px-6 py-3 font-semibold">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reportCard.map((item) => (
                  <tr key={item.testId} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{item.title}</td>
                    <td className="px-6 py-4">{item.subject}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {item.marksObtained} / {item.totalMarks}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.percentage >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.percentage < 60
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 italic">
                      {item.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
