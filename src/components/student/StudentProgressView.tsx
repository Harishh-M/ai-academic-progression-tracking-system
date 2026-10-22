import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { CalculatedAcademicMetrics, Student } from '../../types/index.js';
import { RiskBadge, PerformanceBadge } from '../common/RiskBadge.js';
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
  BookOpen,
  Printer,
  FileCheck,
  Activity,
  Check,
  Clock,
  Sparkles,
  ChevronRight,
  Info,
  Compass,
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
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Computing Academic Progression Analytics...
        </p>
      </div>
    );
  }

  const { student, metrics } = data;

  const totalEarnedCredits =
    metrics.totalEarnedCredits ??
    metrics.semesterSGPA?.reduce((acc, s) => acc + s.earnedCredits, 0) ??
    0;
  const degreeRequiredCredits = metrics.degreeRequiredCredits ?? 165;
  const degreeProgressPercentage =
    metrics.degreeProgressPercentage ??
    Math.min(100, Math.round((totalEarnedCredits / degreeRequiredCredits) * 100));

  const totalRegisteredCredits =
    metrics.totalRegisteredCredits ??
    metrics.semesterSGPA?.reduce((acc, s) => acc + s.totalCredits, 0) ??
    0;

  const remainingCredits = Math.max(0, degreeRequiredCredits - totalEarnedCredits);

  // Projected classification calculation
  const projectedClassification =
    metrics.projectedClassification ??
    (metrics.cgpa >= 8.5 && metrics.currentArrears === 0
      ? 'First Class with Distinction (Honours)'
      : metrics.cgpa >= 6.5
      ? 'First Class'
      : 'Second Class');

  // Completed semesters count
  const completedSemestersCount = metrics.semesterSGPA?.length || 0;

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold uppercase tracking-wider">
              Degree Audit & Progression Tracker
            </span>
            <span className="text-xs text-slate-400 font-mono">Anna Univ. Reg 2021/2023</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Academic Progression & Degree Audit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Student: <strong className="text-slate-800">{student.student_name}</strong> (
            <span className="font-mono text-slate-700 font-semibold">{student.register_number}</span>) •{' '}
            {student.programme} ({student.batch})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <RiskBadge level={metrics.riskLevel} />
          <PerformanceBadge status={metrics.performanceStatus} />
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer print:hidden"
            title="Print Official Degree Progression Audit"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Audit</span>
          </button>
        </div>
      </div>

      {/* 2. Key Degree Progress Highlights (Glance Bar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Degree Credits Earned */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Degree Credits</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#1E3A5F]">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1E3A5F]">
              {totalEarnedCredits}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ {degreeRequiredCredits} required</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-[#1E3A5F] h-2 rounded-full transition-all duration-500"
              style={{ width: `${degreeProgressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
            <span>{degreeProgressPercentage}% Completed</span>
            <span className="text-slate-700 font-semibold">{remainingCredits} credits left</span>
          </div>
        </div>

        {/* Metric 2: Cumulative CGPA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cumulative CGPA</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">
              {metrics.cgpa ? metrics.cgpa.toFixed(2) : '0.00'}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 10.0 scale</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (metrics.cgpa / 10) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-medium truncate">
            Latest SGPA: <strong className="text-slate-900">{metrics.currentSGPA.toFixed(2)}</strong> (Sem {completedSemestersCount})
          </p>
        </div>

        {/* Metric 3: Projected Degree Classification */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Classification</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-extrabold text-purple-900 leading-snug">
            {projectedClassification}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                metrics.currentArrears === 0 && metrics.clearedArrears === 0 && metrics.cgpa >= 8.5
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {metrics.currentArrears === 0 && metrics.clearedArrears === 0 && metrics.cgpa >= 8.5
                ? '★ Honours Eligible'
                : 'Standard Stream'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Based on current CGPA and arrear standing
          </p>
        </div>

        {/* Metric 4: Academic Clearance Standing */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Arrear Backlogs</span>
            <div
              className={`p-2 rounded-xl ${
                metrics.currentArrears === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {metrics.currentArrears === 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${
                metrics.currentArrears === 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {metrics.currentArrears === 0 ? 'All Clear' : `${metrics.currentArrears} Backlog`}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                metrics.currentArrears === 0 ? 'bg-emerald-600 w-full' : 'bg-rose-500 w-1/2'
              }`}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            {metrics.clearedArrears > 0
              ? `${metrics.clearedArrears} cleared in past revaluations`
              : 'Zero historical backlog courses'}
          </p>
        </div>
      </div>

      {/* 3. Semester-by-Semester Progression Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Semester-by-Semester Academic Progression & Credit Audit</h2>
            <p className="text-xs text-slate-500">
              Official record of registered credits, earned credits, semester SGPA, and cumulative CGPA
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {completedSemestersCount} Semesters Evaluated
          </span>
        </div>

        {metrics.semesterSGPA && metrics.semesterSGPA.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4 text-center">Registered Credits</th>
                  <th className="py-3 px-4 text-center">Earned Credits</th>
                  <th className="py-3 px-4 text-center">Courses Passed</th>
                  <th className="py-3 px-4 text-center">Semester SGPA</th>
                  <th className="py-3 px-4 text-center">Cumulative CGPA</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {metrics.semesterSGPA.map((sem, idx) => {
                  const trendPoint = metrics.cgpaTrend.find((t) => t.semester === `Sem ${sem.semesterNumber}`);
                  const isAllPassed = sem.failedCourses === 0;

                  return (
                    <tr key={sem.semesterId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        Semester {sem.semesterNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {sem.academicYear}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                        {sem.totalCredits.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                        {sem.earnedCredits.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-emerald-700 font-bold">{sem.passedCourses}</span>
                        {sem.failedCourses > 0 && (
                          <span className="text-rose-600 font-bold ml-1">({sem.failedCourses} fail)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-extrabold text-[#1E3A5F] text-sm">
                        {sem.sgpa.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {trendPoint ? trendPoint.cgpa.toFixed(2) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isAllPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isAllPassed ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Clear
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              {sem.failedCourses} Arrear
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 font-bold text-xs text-slate-800">
                <tr>
                  <td className="py-3 px-4" colSpan={2}>
                    Total Cumulative Degree Audit
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{totalRegisteredCredits.toFixed(1)}</td>
                  <td className="py-3 px-4 text-center font-mono text-emerald-700">{totalEarnedCredits.toFixed(1)}</td>
                  <td className="py-3 px-4 text-center">—</td>
                  <td className="py-3 px-4 text-center">—</td>
                  <td className="py-3 px-4 text-center font-mono text-[#1E3A5F] text-sm font-extrabold">
                    {metrics.cgpa.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      {remainingCredits === 0 ? 'Degree Completed' : `${remainingCredits} credits pending`}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            No published semester result sheets available for this student yet.
          </div>
        )}
      </div>

      {/* 4. Active Arrear Backlog Standing & Remedial Roadmap */}
      {metrics.currentArrears > 0 ? (
        <div className="bg-rose-50/40 rounded-2xl border border-rose-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">Active Arrear Backlogs & Remedial Exam Schedule</h3>
                <p className="text-xs text-rose-700">Course remediation required prior to final degree award</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-200/80 text-rose-900">
              {metrics.currentArrears} Course Backlogs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {metrics.arrearCourses.map((ac) => (
              <div
                key={ac.courseId}
                className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{ac.courseName}</div>
                  <div className="text-slate-500 font-mono mt-0.5">
                    Course Code: <strong className="text-slate-800">{ac.courseCode}</strong> • Semester {ac.semesterNumber}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-2">
                    Credits: <strong className="text-slate-900">{ac.credits}</strong> • Re-exam Attempt: <span className="text-amber-700 font-semibold">Eligible in Upcoming Exam Session</span>
                  </div>
                </div>
                <span className="px-2 py-1 bg-rose-100 text-rose-800 font-extrabold rounded text-xs shrink-0">
                  Grade: {ac.grade}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/40 rounded-2xl border border-emerald-200 p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Clean Academic Transcript (Zero Active Arrears)</h4>
              <p className="text-xs text-emerald-800">
                All registered curriculum courses cleared successfully. Eligible for regular promotion and placement drives.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-800">
            100% Clearance Rate
          </span>
        </div>
      )}

      {/* 5. Trajectory Charts & Credit Acquisition Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trajectory Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Longitudinal CGPA & SGPA Trajectory</h3>
              <p className="text-xs text-slate-500">Historical performance curve across all semesters</p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600">Benchmark: 7.50</span>
          </div>

          <div className="h-64 w-full">
            {metrics.cgpaTrend && metrics.cgpaTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.cgpaTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="semester" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      color: '#fff',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="cgpa" name="Cumulative CGPA" stroke="#1E3A5F" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="sgpa" name="Semester SGPA" stroke="#3B6EA5" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No past semester trends logged yet
              </div>
            )}
          </div>
        </div>

        {/* Credit Acquisition Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Credits Registered vs Earned</h3>
              <p className="text-xs text-slate-500">Curriculum credit load clearance distribution</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700">Total: {totalEarnedCredits} cr</span>
          </div>

          <div className="h-64 w-full">
            {metrics.semesterSGPA && metrics.semesterSGPA.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.semesterSGPA.map((s) => ({
                    semester: `Sem ${s.semesterNumber}`,
                    registered: s.totalCredits,
                    earned: s.earnedCredits,
                  }))}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="semester" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[0, 30]} stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      color: '#fff',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="registered" name="Registered Credits" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="earned" name="Earned Credits" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No credit records available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Transparent Rule-Based Evaluation Engine */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Transparent Rule-Based Evaluation Engine</h2>
            <p className="text-xs text-slate-500">Deterministic criteria evaluating risk standing & academic tier</p>
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
                : 'bg-red-50/60 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>1. CGPA Metric Benchmark</span>
              <span>{metrics.cgpa ? metrics.cgpa.toFixed(2) : '0.00'} / 10.0</span>
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
                : 'bg-red-50/60 border-red-200 text-red-900'
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
                : 'bg-red-50/60 border-red-200 text-red-900'
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

        {/* Diagnostic Rationale */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
          <span className="font-bold text-slate-900 block">System Diagnostic Rationale:</span>
          {metrics.riskReasons.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A5F] mt-1.5 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Degree Progression Pathway & Milestones */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Degree Progression Pathway & Milestones</h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200/60">
            <CheckCircle2 className="w-5 h-5 text-[#3F7D58] shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-slate-900">Foundational Year (Semesters 1 & 2)</div>
              <div className="text-slate-500">
                Mathematics, computational thinking, basic sciences, and engineering laboratories
              </div>
            </div>
            <span className="text-[#3F7D58] font-bold px-2 py-0.5 bg-emerald-100 rounded">
              Completed
            </span>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50/40 border border-blue-200/60">
            <Layers className="w-5 h-5 text-[#1E3A5F] shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-slate-900">Core Discipline & Minors (Semesters 3 & 4)</div>
              <div className="text-slate-500">
                Departmental core theory, advanced data structures, and continuous internal evaluations
              </div>
            </div>
            <span className="text-[#1E3A5F] font-bold px-2 py-0.5 bg-blue-100 rounded">
              Active Phase
            </span>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 opacity-80">
            <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-slate-700">Professional Electives & Industrial Internship (Semesters 5 & 6)</div>
              <div className="text-slate-400">
                Specialization tracks, industrial immersion, and open electives (Scheduled 2025-2026)
              </div>
            </div>
            <span className="text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded">
              Upcoming
            </span>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 opacity-70">
            <GraduationCap className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-slate-700">Capstone Innovation Project & Convocation (Semesters 7 & 8)</div>
              <div className="text-slate-400">
                Final degree project, credit reconciliation, and graduation ceremony (Expected May 2028)
              </div>
            </div>
            <span className="text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded">
              Pending Final Audit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
