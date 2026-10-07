import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { CalculatedAcademicMetrics, Student } from '../../types/index.js';
import { RiskBadge, PerformanceBadge } from '../common/RiskBadge.js';
import { MetricCard } from '../common/MetricCard.js';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  GraduationCap,
  Award,
  Layers,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const StudentProgressView: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{ student: Student; metrics: CalculatedAcademicMetrics } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.studentId) {
      setLoading(true);
      api
        .getAcademicProgress(user.studentId)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.studentId]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { student, metrics } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Progress & Risk Analytics</h1>
          <p className="text-xs text-slate-500">
            Institutional progression tracker with deterministic rule-based standing breakdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RiskBadge level={metrics.riskLevel} />
          <PerformanceBadge status={metrics.performanceStatus} />
        </div>
      </div>

      {/* Transparent Rule-Based Risk Engine Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Transparent Rule-Based Evaluation Engine</h2>
            <p className="text-xs text-slate-500">Deterministic criteria evaluating risk standing</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 font-mono">Algorithm v2.4 (Verified)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* CGPA Criterion */}
          <div
            className={`p-4 rounded-xl border ${
              metrics.cgpa >= 7.5
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : metrics.cgpa >= 6.0
                ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                : 'bg-rose-50/60 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>1. CGPA Metric Benchmark</span>
              <span>{metrics.cgpa.toFixed(2)} / 10.0</span>
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              {metrics.cgpa >= 7.5
                ? 'Passes top academic tier (≥ 7.50). Low risk status.'
                : metrics.cgpa >= 6.0
                ? 'Moderate performance tier (6.00 – 7.49).'
                : 'Critically below benchmark (< 6.00). High risk triggered.'}
            </p>
          </div>

          {/* Attendance Criterion */}
          <div
            className={`p-4 rounded-xl border ${
              metrics.attendancePercentage >= 85
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : metrics.attendancePercentage >= 75
                ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                : 'bg-rose-50/60 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>2. Attendance Compliance</span>
              <span>{metrics.attendancePercentage}%</span>
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              {metrics.attendancePercentage >= 85
                ? 'Exemplary attendance compliance (≥ 85%).'
                : metrics.attendancePercentage >= 75
                ? 'Meets minimum exam threshold (75% - 84%).'
                : 'Below mandatory 75% limit. High risk shortage triggered.'}
            </p>
          </div>

          {/* Arrear Criterion */}
          <div
            className={`p-4 rounded-xl border ${
              metrics.currentArrears === 0
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : metrics.currentArrears === 1
                ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                : 'bg-rose-50/60 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>3. Arrear Backlog Standing</span>
              <span>{metrics.currentArrears} active</span>
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              {metrics.currentArrears === 0
                ? 'All registered semester courses passed with clean sheet.'
                : metrics.currentArrears === 1
                ? 'Single active arrear subject requires remedial clearing.'
                : 'Multiple active arrears (≥ 2). High risk triggered.'}
            </p>
          </div>
        </div>

        {/* Risk Trigger Breakdown */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
          <span className="font-bold text-slate-900 block">System Diagnostic Rationale:</span>
          {metrics.riskReasons.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trajectory Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base mb-1">Cumulative Progression Trajectory</h3>
        <p className="text-xs text-slate-500 mb-4">Longitudinal evolution of CGPA and semester SGPA</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.cgpaTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semester" stroke="#94a3b8" fontSize={12} />
              <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="cgpa" name="CGPA" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="sgpa" name="Semester SGPA" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Academic Milestone Progress Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Degree Progression Milestones</h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-slate-900">Enrolled & Institutional Onboarding Completed</div>
              <div className="text-slate-500">{student.programme} ({student.batch}) - Regular Admission</div>
            </div>
            <span className="text-emerald-700 font-bold">Completed</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-slate-900">Semester 1 Foundations</div>
              <div className="text-slate-500">All registered credits evaluated and grade points logged</div>
            </div>
            <span className="text-emerald-700 font-bold">Completed</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-slate-900">Semester 2 Core Engineering</div>
              <div className="text-slate-500">Core discipline courses and practical assessments</div>
            </div>
            <span className="text-emerald-700 font-bold">Completed</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <Layers className="w-5 h-5 text-indigo-600 shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-slate-900">Semester 3 In-Progress</div>
              <div className="text-slate-500">Ongoing Continuous Internal Assessments (CIA) and attendance</div>
            </div>
            <span className="text-indigo-700 font-bold">Active Term</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 opacity-60">
            <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-slate-700">Industrial Internship & Capstone Project</div>
              <div className="text-slate-400">Scheduled for Semester 6 & 7</div>
            </div>
            <span className="text-slate-400 font-medium">Upcoming</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 opacity-60">
            <GraduationCap className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-slate-700">Final Degree Award & Convocation</div>
              <div className="text-slate-400">Expected May 2027</div>
            </div>
            <span className="text-slate-400 font-medium">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
};
