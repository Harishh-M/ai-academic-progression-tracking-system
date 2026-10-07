import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  Student,
  CalculatedAcademicMetrics,
  AIAnalysisResult,
  AttendanceRecord,
  SemesterResultRecord,
} from '../../types/index.js';
import { MetricCard } from '../common/MetricCard.js';
import { RiskBadge, PerformanceBadge } from '../common/RiskBadge.js';
import {
  GraduationCap,
  CalendarCheck,
  AlertTriangle,
  Award,
  TrendingUp,
  Sparkles,
  BookOpen,
  CheckCircle,
  Lightbulb,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    student: Student;
    metrics: CalculatedAcademicMetrics;
    attendance: AttendanceRecord[];
    semesterResults: SemesterResultRecord[];
  } | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (user?.studentId) {
      setLoading(true);
      api
        .getStudentById(user.studentId)
        .then((res) => {
          setData(res);
          return api.getAIAnalysis(user.studentId!);
        })
        .then((aiRes) => {
          setAiAnalysis(aiRes);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.studentId]);

  const handleRefreshAI = async () => {
    if (!user?.studentId) return;
    setAiLoading(true);
    try {
      const fresh = await api.triggerAIAnalysis(user.studentId);
      setAiAnalysis(fresh);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading your verified academic dashboard...</p>
        </div>
      </div>
    );
  }

  const { student, metrics } = data;

  return (
    <div className="space-y-6">
      {/* Read-Only Notice Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Verified Student Portal:</strong> All marks, attendance, and calculations are computed and cryptographically validated by university faculty.
          </span>
        </div>
        <span className="font-semibold text-emerald-700 uppercase tracking-wider text-[10px]">Read-Only Protected</span>
      </div>

      {/* Student Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-md">
              {student.student_name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{student.student_name}</h1>
                <RiskBadge level={metrics.riskLevel} reasons={metrics.riskReasons} />
                <PerformanceBadge status={metrics.performanceStatus} />
              </div>
              <p className="text-sm text-slate-600 font-medium">
                <span className="font-mono font-bold text-indigo-700">{student.register_number}</span> • {student.programme} ({student.branch_code})
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                <span>Batch: <strong>{student.batch}</strong></span>
                <span>•</span>
                <span>Department: <strong>{student.department}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-slate-800">{student.current_status}</strong></span>
                <span>•</span>
                <span>Fees: <strong className={student.student_fees_status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}>{student.student_fees_status}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={() => onNavigate('my-profile')}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
            >
              View Full Profile
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              Download Transcript
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Academic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          id="card-cgpa"
          title="Cumulative CGPA"
          value={metrics.cgpa.toFixed(2)}
          subtitle="Out of 10.0 scale"
          icon={GraduationCap}
          accentColor="indigo"
          trend={{ text: `Status: ${metrics.performanceStatus}`, isPositive: metrics.cgpa >= 7.5 }}
        />
        <MetricCard
          id="card-sgpa"
          title="Latest SGPA"
          value={metrics.currentSGPA.toFixed(2)}
          subtitle="Recent semester"
          icon={TrendingUp}
          accentColor="purple"
          trend={{ text: `${metrics.semesterSGPA.length} semesters completed` }}
        />
        <MetricCard
          id="card-attendance"
          title="Overall Attendance"
          value={`${metrics.attendancePercentage}%`}
          subtitle={`${metrics.presentClasses}/${metrics.totalClasses} classes attended`}
          icon={CalendarCheck}
          accentColor={metrics.attendancePercentage >= 75 ? 'emerald' : 'rose'}
          trend={{
            text: metrics.attendancePercentage >= 75 ? 'Statutory Minimum Met' : 'Shortage Alert (<75%)',
            isPositive: metrics.attendancePercentage >= 75,
          }}
        />
        <MetricCard
          id="card-arrears"
          title="Active Arrears"
          value={metrics.currentArrears}
          subtitle={`${metrics.clearedArrears} cleared previously`}
          icon={AlertTriangle}
          accentColor={metrics.currentArrears === 0 ? 'emerald' : 'rose'}
          trend={{
            text: metrics.currentArrears === 0 ? 'All subjects clear' : 'Requires exam registration',
            isPositive: metrics.currentArrears === 0,
          }}
        />
      </div>

      {/* Attendance Shortage Warning Banner (If < 75%) */}
      {metrics.attendancePercentage < 75 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Statutory Attendance Deficit Warning (Regulation Clause 4.2)</div>
            <div className="text-xs text-rose-800">
              Your overall attendance is currently <strong>{metrics.attendancePercentage}%</strong>, which is below the mandatory 75% threshold required to appear for end-semester examinations. Please consult your faculty mentor immediately regarding remedial attendance options or medical condonation.
            </div>
          </div>
        </div>
      )}

      {/* Charts Section: CGPA Progression Line Chart & Semester SGPA Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CGPA Progression */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">CGPA & SGPA Progression</h3>
              <p className="text-xs text-slate-500">Historical performance curve across completed semesters</p>
            </div>
            <button
              onClick={() => onNavigate('results')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Details <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            {metrics.cgpaTrend.length > 0 ? (
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
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No past semester records published yet
              </div>
            )}
          </div>
        </div>

        {/* Course-Wise Attendance Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Course-Wise Attendance</h3>
              <p className="text-xs text-slate-500">Subject percentage compliance vs 75% benchmark</p>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Full Log <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            {metrics.courseWiseAttendance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.courseWiseAttendance} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="courseCode" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                    formatter={(value: any) => [`${value}%`, 'Attendance']}
                  />
                  <Bar dataKey="percentage" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Attendance logs being compiled
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generative AI Academic Insights Section */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">AI-Generated Academic Analysis</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Gemini Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Synthesized from verified ERP records • Generated on {new Date(aiAnalysis?.timestamp || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshAI}
              disabled={aiLoading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              {aiLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>Regenerate Analysis</span>
            </button>
            <button
              onClick={() => onNavigate('ai-insights')}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition"
            >
              Deep Diagnostics
            </button>
          </div>
        </div>

        {/* AI Performance Summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm text-slate-800 leading-relaxed">
          {aiAnalysis?.summary || 'Synthesizing academic trajectory...'}
        </div>

        {/* 2-Column AI Grid: Strengths vs Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Strengths */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Identified Academic Strengths</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {aiAnalysis?.strengths.map((st, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{st}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <span>Personalized Recommendations</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {aiAnalysis?.personalizedRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
