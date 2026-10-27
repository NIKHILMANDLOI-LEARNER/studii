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
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Award, 
  BookOpen, 
  Filter 
} from 'lucide-react';

export default function TeacherAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClassAnalytics = async (classLevel) => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics/class?classLevel=${classLevel}`);
      setAnalytics(res.data.analytics);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load class analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassAnalytics(selectedClass);
  }, [selectedClass]);

  // Dynamic bar colors based on proficiency
  const getBarColor = (proficiency) => {
    if (proficiency >= 75) return '#10b981'; // Green for strong
    if (proficiency < 60) return '#f43f5e';  // Red for weak
    return '#f59e0b';                       // Amber for moderate
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Title and Class Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-600" />
            Class Performance & Topic Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated cohort proficiency tracking, weak points diagnosis, and mastery metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Batches / Classes</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 font-medium text-sm">Synthesizing topic analytics...</span>
        </div>
      ) : error ? (
        <div className="mt-6 p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
          {error}
        </div>
      ) : (
        <div className="space-y-8 mt-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Class Average</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics?.classAverage || 0}%</h3>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                  Overall Score Index
                </span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Enrolled</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics?.totalStudents || 0}</h3>
                <span className="text-xs text-slate-500 mt-1">Active Students</span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weak Topics</p>
                <h3 className="text-2xl font-bold text-rose-600 mt-1">{analytics?.classWeakTopics?.length || 0}</h3>
                <span className="text-xs font-medium text-rose-500 mt-1">Requires Revision (&lt;65%)</span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mastered Topics</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{analytics?.classStrongTopics?.length || 0}</h3>
                <span className="text-xs font-medium text-emerald-600 mt-1">High Proficiency (&gt;=75%)</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Visual Chart: Topic-Wise Proficiency Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Topic-by-Topic Mastery Index</h2>
                <p className="text-xs text-slate-400">Class aggregate percentage scored across administered tests</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium mt-2 sm:mt-0">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Strong (≥75%)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Moderate (60-74%)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Critical (&lt;60%)</span>
              </div>
            </div>

            <div className="h-80 w-full">
              {analytics?.allTopicProficiencies?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.allTopicProficiencies} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="topic" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Proficiency']}
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none' }}
                    />
                    <Bar dataKey="proficiency" radius={[6, 6, 0, 0]}>
                      {analytics.allTopicProficiencies.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.proficiency)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No topic score data recorded yet. Create a test with topic scores to see charts.
                </div>
              )}
            </div>
          </div>

          {/* Critical Weak Points & Remedial Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weak Areas */}
            <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Attention Required: Identified Topic Weaknesses
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Students struggled most on these concepts. Recommended for revision sessions or focused worksheets.
              </p>
              <div className="space-y-3">
                {analytics?.classWeakTopics?.length > 0 ? (
                  analytics.classWeakTopics.map((topic, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                      <span className="font-medium text-sm text-slate-800">{topic.topic}</span>
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700">
                        {topic.proficiency}% Avg
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">No critical weak points detected! Class is performing above threshold.</p>
                )}
              </div>
            </div>

            {/* Strengths */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Mastery Highlights: Strongest Topics
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Topics where students demonstrated highest command and solid retention.
              </p>
              <div className="space-y-3">
                {analytics?.classStrongTopics?.length > 0 ? (
                  analytics.classStrongTopics.map((topic, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <span className="font-medium text-sm text-slate-800">{topic.topic}</span>
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">
                        {topic.proficiency}% Avg
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">No topics have reached ≥75% mastery benchmark yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
