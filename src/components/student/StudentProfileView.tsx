import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Student, CalculatedAcademicMetrics } from '../../types/index.js';
import { RiskBadge, PerformanceBadge } from '../common/RiskBadge.js';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Award,
  Building,
  GraduationCap,
  MapPin,
  FileCheck,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Printer,
  Sparkles,
  CreditCard,
  Hash,
  Activity,
  Layers,
  Clock,
  AlertTriangle,
  Info,
  ExternalLink,
  School,
  Share2,
} from 'lucide-react';

export const StudentProfileView: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{ student: Student; metrics: CalculatedAcademicMetrics } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'academic' | 'identifiers' | 'personal' | 'compliance'>('all');

  useEffect(() => {
    if (user?.studentId) {
      setLoading(true);
      api
        .getStudentById(user.studentId)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.studentId]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!data) return;
    const { student, metrics } = data;
    const summary = [
      '====================================================',
      'ACADEMIC PROFILE RECORD • INSTITUTIONAL VERIFIED',
      '====================================================',
      `Student Name    : ${student.student_name}`,
      `Register Number : ${student.register_number}`,
      `Admission Number: ${student.admission_number}`,
      `Programme       : ${student.programme}`,
      `Discipline/Dept : ${student.department}`,
      `Batch           : ${student.batch} (Admitted ${student.year_of_admission})`,
      `ABC ID (DigiLocker): ${student.abc_id || 'N/A'}`,
      `UMIS Identifier : ${student.umis_number || 'N/A'}`,
      `Cumulative CGPA : ${metrics.cgpa ? metrics.cgpa.toFixed(2) : 'N/A'} / 10.0`,
      `Attendance      : ${metrics.attendancePercentage}%`,
      `Current Status  : ${student.current_status}`,
      `Fees Status     : ${student.student_fees_status}`,
      `University Email: ${student.email}`,
      `Mobile Number   : ${student.mobile_number}`,
      '====================================================',
    ].join('\n');
    handleCopy(summary, 'summary');
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Official Student Profile...
        </p>
      </div>
    );
  }

  const { student, metrics } = data;

  const getAttendanceStatus = () => {
    if (metrics.attendancePercentage >= 80) {
      return {
        label: 'Optimal Compliance (≥ 80%)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        badge: 'Eligible for Regular Examinations',
      };
    }
    if (metrics.attendancePercentage >= 75) {
      return {
        label: 'Sufficient Compliance (75% - 79%)',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        badge: 'Eligible for Regular Examinations',
      };
    }
    if (metrics.attendancePercentage >= 65) {
      return {
        label: 'Condonation Zone (65% - 74%)',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        badge: 'Condonation Approval Required',
      };
    }
    return {
      label: 'Critical Shortage (< 65%)',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      badge: 'Detained / Redo Course Required',
    };
  };

  const attStatus = getAttendanceStatus();

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      {/* 1. Official Digital Identity Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A5F] via-[#244774] to-[#162D4A] text-white shadow-md border border-slate-700/30 p-6 md:p-8">
        {/* Subtle background ornamentation */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 w-80 h-32 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Avatar and Primary Identity */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/30 text-white flex items-center justify-center text-3xl font-extrabold shadow-inner">
                {student.student_name ? student.student_name.charAt(0) : 'S'}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#1E3A5F] flex items-center justify-center ${
                  student.current_status === 'Continuing' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                title={`Status: ${student.current_status}`}
              >
                <span className="w-2 h-2 rounded-full bg-white" />
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {student.student_name}
                </h1>
                <RiskBadge level={metrics.riskLevel} />
                <PerformanceBadge status={metrics.performanceStatus} />
              </div>

              {/* Monospace Register Number with Instant Copy */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/25 border border-white/20 font-mono text-xs font-bold text-sky-200">
                  <Hash className="w-3.5 h-3.5 text-sky-300" />
                  <span>{student.register_number}</span>
                  <button
                    onClick={() => handleCopy(student.register_number, 'reg')}
                    className="ml-1 p-0.5 hover:text-white transition cursor-pointer"
                    title="Copy Register Number"
                  >
                    {copiedKey === 'reg' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
                    )}
                  </button>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-semibold text-slate-200">
                  Batch {student.batch}
                </span>

                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-medium text-slate-300">
                  {student.admission_type || 'Regular'} Entry
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 font-medium pt-1">
                {student.programme} • <span className="text-sky-200">{student.department}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons & Verification Seal */}
          <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2.5 shrink-0 pt-2 lg:pt-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition cursor-pointer backdrop-blur-xs shadow-xs"
                title="Copy formatted profile summary to clipboard"
              >
                {copiedKey === 'summary' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Summary Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Profile</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition cursor-pointer backdrop-blur-xs shadow-xs print:hidden"
                title="Print or Save official profile as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Profile</span>
              </button>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-semibold text-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official ERP Verified (Read-Only)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Glanceable Key Performance Indicators (Glance Bar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: CGPA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cumulative CGPA</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#1E3A5F]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1E3A5F]">
              {metrics.cgpa ? metrics.cgpa.toFixed(2) : 'N/A'}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 10.0</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-[#1E3A5F] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (metrics.cgpa / 10) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            {metrics.cgpa >= 8.5
              ? 'First Class with Distinction'
              : metrics.cgpa >= 7.0
              ? 'First Class Standing'
              : 'Second Class Standing'}
          </p>
        </div>

        {/* Metric 2: Current SGPA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current SGPA</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-700">
              {metrics.currentSGPA ? metrics.currentSGPA.toFixed(2) : 'N/A'}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 10.0</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (metrics.currentSGPA / 10) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Semester {metrics.semesterSGPA?.length || 1} Assessment
          </p>
        </div>

        {/* Metric 3: Attendance Compliance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendance</span>
            <div className={`p-2 rounded-xl ${metrics.attendancePercentage >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${
                metrics.attendancePercentage >= 75 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {metrics.attendancePercentage}%
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({metrics.presentClasses}/{metrics.totalClasses})
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                metrics.attendancePercentage >= 75 ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, metrics.attendancePercentage)}%` }}
            />
          </div>
          <p className="text-[11px] font-medium text-slate-600 mt-2 truncate">
            {attStatus.badge}
          </p>
        </div>

        {/* Metric 4: Academic Clearance & Arrears */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Arrear Standing</span>
            <div className={`p-2 rounded-xl ${metrics.currentArrears === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {metrics.currentArrears === 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${
                metrics.currentArrears === 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {metrics.currentArrears === 0 ? 'All Clear' : `${metrics.currentArrears} Arrear`}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${metrics.currentArrears === 0 ? 'bg-emerald-600 w-full' : 'bg-rose-500 w-1/2'}`}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            {metrics.clearedArrears > 0 ? `${metrics.clearedArrears} cleared historically` : 'Zero backlog courses'}
          </p>
        </div>
      </div>

      {/* 3. Section Selector Bar (Easy to navigate & filter view) */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-1.5 print:hidden">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#1E3A5F] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Full Structured Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('academic')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'academic'
              ? 'bg-[#1E3A5F] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Academic & Programme</span>
        </button>

        <button
          onClick={() => setActiveTab('identifiers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'identifiers'
              ? 'bg-[#1E3A5F] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Institutional Identifiers</span>
        </button>

        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'personal'
              ? 'bg-[#1E3A5F] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal & Contact</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'compliance'
              ? 'bg-[#1E3A5F] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Status & Compliance</span>
        </button>
      </div>

      {/* 4. Structured Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section A: Academic & Programme Enrollment */}
        {(activeTab === 'all' || activeTab === 'academic') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-[#1E3A5F]">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Academic & Programme Details</h3>
                  <p className="text-[11px] text-slate-500">Degree, discipline, and admission records</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                {student.branch_code || 'DEPT'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Degree Programme
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {student.programme}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {student.programme_short_name || student.programme}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Branch / Discipline
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {student.branch}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Code: {student.branch_code}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Academic Department
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {student.department}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Academic Batch & Year
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {student.batch}
                </span>
                <span className="text-[11px] text-slate-500">
                  Admitted in {student.year_of_admission}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Admission Category
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {student.admission_type || 'Regular Entry'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Expected Degree Completion
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {student.degree_awarded_month_year || 'In Progress (May 2028)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section B: Official Institutional Identifiers */}
        {(activeTab === 'all' || activeTab === 'identifiers') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Official Institutional Identifiers</h3>
                  <p className="text-[11px] text-slate-500">Government, university, and state portal numbers</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                UID Identifiers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Register Number */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Register Number (University)
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {student.register_number}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(student.register_number, 'reg_box')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  title="Copy Register Number"
                >
                  {copiedKey === 'reg_box' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Admission Number */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Admission Number (College)
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {student.admission_number}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(student.admission_number, 'adm_box')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  title="Copy Admission Number"
                >
                  {copiedKey === 'adm_box' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Academic Bank of Credits (ABC ID) */}
              <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                      ABC ID (DigiLocker / NAD)
                    </span>
                  </div>
                  <span className="font-mono text-sm font-extrabold text-[#1E3A5F]">
                    {student.abc_id || 'Not Linked'}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(student.abc_id, 'abc_box')}
                  className="p-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 transition cursor-pointer"
                  title="Copy ABC ID"
                >
                  {copiedKey === 'abc_box' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* UMIS Identifier */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    UMIS Number (State Portal)
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {student.umis_number || 'N/A'}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(student.umis_number, 'umis_box')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  title="Copy UMIS Number"
                >
                  {copiedKey === 'umis_box' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* System User ID */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 sm:col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    ERP Institutional User ID
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {student.user_id} • Internal DB Index: {student.id}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Single Sign-On Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Section C: Personal & Communication Details */}
        {(activeTab === 'all' || activeTab === 'personal') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Personal & Contact Information</h3>
                  <p className="text-[11px] text-slate-500">Confidential student demographic & residential records</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                Verified Contact
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Date of Birth</span>
                </div>
                <span className="text-sm font-bold text-slate-900 block">
                  {student.date_of_birth}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Gender</span>
                </div>
                <span className="text-sm font-bold text-slate-900 block">
                  {student.gender}
                </span>
              </div>

              {/* Email with mailto and copy */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 sm:col-span-2 flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Official University Email</span>
                  </div>
                  <a
                    href={`mailto:${student.email}`}
                    className="font-mono text-xs sm:text-sm font-bold text-[#1E3A5F] hover:underline truncate block"
                  >
                    {student.email}
                  </a>
                </div>
                <button
                  onClick={() => handleCopy(student.email, 'email_box')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer shrink-0"
                  title="Copy Email Address"
                >
                  {copiedKey === 'email_box' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Mobile with tel and copy */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 sm:col-span-2 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Registered Mobile Number</span>
                  </div>
                  <a
                    href={`tel:${student.mobile_number}`}
                    className="font-mono text-sm font-bold text-slate-900 hover:text-blue-700 transition"
                  >
                    +91 {student.mobile_number}
                  </a>
                </div>
                <button
                  onClick={() => handleCopy(student.mobile_number, 'phone_box')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  title="Copy Mobile Number"
                >
                  {copiedKey === 'phone_box' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Residential Campus Address */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 sm:col-span-2">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Permanent / Campus Address</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                  {student.address || 'Address on file with Registrar Office'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section D: Academic Standing & Institutional Compliance */}
        {(activeTab === 'all' || activeTab === 'compliance') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Standing & Regulatory Compliance</h3>
                  <p className="text-[11px] text-slate-500">Fees clearance, promotion rules, and enrollment standing</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                Institutional Standing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current Status */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Enrollment Status
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {student.current_status}
                </span>
              </div>

              {/* Programme Status */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Programme Standing
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {student.programme_status || 'Active Degree Pursuance'}
                </span>
              </div>

              {/* Fees Compliance */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Tuition & Examination Fees
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs ${
                    student.student_fees_status === 'Paid'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {student.student_fees_status === 'Paid' ? 'Fees Fully Paid (Clear)' : 'Fees Payment Pending'}
                </span>
              </div>

              {/* Attendance Eligibility */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Semester Exam Eligibility
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${attStatus.color}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {metrics.attendancePercentage >= 75 ? 'Qualified (≥ 75%)' : 'Shortage Alert (< 75%)'}
                </span>
              </div>

              {/* Readmission Details */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 sm:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Readmission & Regulatory Audit
                </span>
                <p className="text-xs text-slate-600">
                  Readmission Category: <strong className="text-slate-900">{student.readmitted_category || 'None (Continuous Enrollment)'}</strong> •
                  Record Synced with Office of the Controller of Examinations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Institutional Support & Advisory Assistance Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600 print:hidden">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-white border border-slate-200 text-[#1E3A5F] shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Need to update your official profile information?</h4>
            <p className="text-slate-500 mt-0.5">
              Personal contact details (mobile, email, residential address) can be revised through your Department Academic Advisor or the Registrar Academic Section.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            Record ID: {student.id} • Synced
          </span>
        </div>
      </div>
    </div>
  );
};
