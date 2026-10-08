import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Student } from '../../types/index.js';
import { RiskBadge, PerformanceBadge } from '../common/RiskBadge.js';
import { MetricCard } from '../common/MetricCard.js';
import {
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  Users,
  GraduationCap,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
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
  BarChart,
  Bar,
} from 'recharts';

interface FacultyProgressViewProps {
  initialStudentId?: string;
  onNavigateToAI?: (studentId: string) => void;
}

export const FacultyProgressView: React.FC<FacultyProgressViewProps> = ({
  initialStudentId,
  onNavigateToAI,
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [studentProgress, setStudentProgress] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getStudents()
      .then((list) => {
        setStudents(list);
        if (list.length > 0 && !selectedStudentId) {
          setSelectedStudentId(list[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      setProgressLoading(true);
      api
        .getAcademicProgress(selectedStudentId)
        .then(setStudentProgress)
        .catch(console.error)
        .finally(() => setProgressLoading(false));
    }
  }, [selectedStudentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate high arrears subject breakdown
  const arrearSubjectsCount: Record<string, { count: number; name: string }> = {
    'CS3301': { count: 3, name: 'Data Structures and Algorithms' },
    'MA3354': { count: 2, name: 'Discrete Mathematics' },
    'CS3302': { count: 1, name: 'Digital Principles & Computer Architecture' },
    'CS3401': { count: 1, name: 'Database Management Systems' },
  };

  const arrearData = Object.entries(arrearSubjectsCount).map(([code, item]) => ({
    course: code,
    name: item.name,
    arrears: item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Department Academic Progress & Risk Tracking</h1>
          <p className="text-xs text-slate-500">
            Cohort progression trajectories, transparent risk categorization, and arrear analytics
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-[#1E3A5F]" />
          <span>Rule Engine v2.4 (Statutory Compliant)</span>
        </div>
      </div>

      {/* Cohort Risk Breakdown Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Institutional Risk Evaluation Rules</h2>
            <p className="text-xs text-slate-500">Deterministic criteria applied across the cohort</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 space-y-1">
            <div className="font-bold flex items-center justify-between">
              <span>Low Risk (Safe Standing)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 font-extrabold text-[#3F7D58]">≥ 7.50 CGPA</span>
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              Attendance ≥ 85%, Zero active arrears, consistent internal marks.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-1">
            <div className="font-bold flex items-center justify-between">
              <span>Medium Risk (Monitored)</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 font-extrabold text-[#B7791F]">6.00 – 7.49 CGPA</span>
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              Attendance 75% - 84%, or exactly 1 active arrear requiring remedial tests.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 text-red-900 space-y-1">
            <div className="font-bold flex items-center justify-between">
              <span>High Risk (Intervention)</span>
              <span className="px-2 py-0.5 rounded bg-red-100 font-extrabold text-[#B94A48]">&lt; 6.00 CGPA</span>
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              Attendance &lt; 75% (Shortage alert) or ≥ 2 active arrears.
            </p>
          </div>
        </div>
      </div>

      {/* Cohort Arrear Subject Breakdown Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Course-Wise Arrear Backlog Concentration</h3>
          <p className="text-xs text-slate-500">Subjects with active arrear burdens requiring special remedial lectures</p>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={arrearData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="course" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs">
                        <div className="font-bold">{data.course}: {data.name}</div>
                        <div className="text-red-300 mt-1">{data.arrears} Student(s) with Active Arrear</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="arrears" name="Active Arrears" fill="#B94A48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Student Progress Dossier Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Individual Student Longitudinal Progress Dossier</h3>
            <p className="text-xs text-slate-500">Select any student to inspect progression trajectory & metrics</p>
          </div>

          <div className="w-full sm:w-72">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.register_number} - {s.student_name} ({s.riskLevel} Risk)
                </option>
              ))}
            </select>
          </div>
        </div>

        {progressLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : studentProgress ? (
          <div className="space-y-6">
            {/* Student Snapshot Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-extrabold text-slate-900 text-base">
                  {studentProgress.student.student_name} ({studentProgress.student.register_number})
                </div>
                <div className="text-xs text-slate-500">
                  {studentProgress.student.programme} • Batch {studentProgress.student.batch}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RiskBadge level={studentProgress.metrics.riskLevel} />
                <PerformanceBadge status={studentProgress.metrics.performanceStatus} />
                {onNavigateToAI && (
                  <button
                    onClick={() => onNavigateToAI(selectedStudentId)}
                    className="px-3 py-1.5 rounded-lg bg-[#1E3A5F] hover:bg-[#16304F] text-white text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Analysis</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricCard
                title="Cumulative CGPA"
                value={studentProgress.metrics.cgpa.toFixed(2)}
                subtitle="Out of 10.0 Scale"
                icon={GraduationCap}
                accentColor="primary"
              />
              <MetricCard
                title="Current Semester SGPA"
                value={studentProgress.metrics.currentSGPA.toFixed(2)}
                subtitle="Latest term evaluation"
                icon={TrendingUp}
                accentColor="secondary"
              />
              <MetricCard
                title="Overall Attendance"
                value={`${studentProgress.metrics.attendancePercentage}%`}
                subtitle={`${studentProgress.metrics.presentClasses} / ${studentProgress.metrics.totalClasses} hours`}
                icon={ShieldCheck}
                accentColor={studentProgress.metrics.attendancePercentage >= 75 ? 'emerald' : 'rose'}
              />
              <MetricCard
                title="Active Arrears"
                value={studentProgress.metrics.currentArrears}
                subtitle={studentProgress.metrics.currentArrears === 0 ? 'All cleared' : 'Backlogs pending'}
                icon={AlertTriangle}
                accentColor={studentProgress.metrics.currentArrears === 0 ? 'emerald' : 'rose'}
              />
            </div>

            {/* Student CGPA / SGPA Trajectory Chart */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={studentProgress.metrics.cgpaTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="semester" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="cgpa" name="Cumulative CGPA" stroke="#1E3A5F" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="sgpa" name="Semester SGPA" stroke="#3B6EA5" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
