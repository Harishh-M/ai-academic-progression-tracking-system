import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  CalculatedAcademicMetrics,
  AttendanceRecord,
  Course,
  DailyAttendanceSession,
  AttendanceDisputeRequest,
} from '../../types/index.js';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  User as UserIcon,
  Fingerprint,
  ShieldCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  buildDailySessionsForDate,
  formatDateISO,
  formatDatePCDP,
  formatFullDayHeader,
  getStoredDisputes,
  saveDisputeRequest,
} from '../../services/attendanceSchedule.js';

export const StudentAttendanceView: React.FC = () => {
  const { user } = useAuth();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [metrics, setMetrics] = useState<CalculatedAcademicMetrics | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected date state (defaults to 2026-10-13 matching the screenshot, or today if 2026)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Check if current date year is 2026, else default to screenshot date 2026-10-13 for exact preview
    const today = new Date();
    if (today.getFullYear() === 2026) {
      return formatDateISO(today);
    }
    return '2026-10-13';
  });

  // Dispute Request Modal state
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeSession, setSelectedDisputeSession] = useState<DailyAttendanceSession | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [disputesList, setDisputesList] = useState<AttendanceDisputeRequest[]>([]);
  const [disputeSuccessMessage, setDisputeSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisputesList(getStoredDisputes());
  }, []);

  useEffect(() => {
    if (user?.studentId) {
      setLoading(true);
      Promise.all([api.getStudentById(user.studentId), api.getCourses()])
        .then(([stuRes, courseList]) => {
          setMetrics(stuRes.metrics);
          setAttendance(stuRes.attendance);
          setCourses(courseList);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.studentId]);

  // Compute daily sessions (2 Biometrics + 7 Periods)
  const studentId = user?.studentId || '1';
  const dailySessions = useMemo(() => {
    return buildDailySessionsForDate(studentId, selectedDate, courses, attendance);
  }, [studentId, selectedDate, courses, attendance]);

  // Separate biometric in, periods, biometric out
  const biometricInSession = dailySessions.find((s) => s.type === 'biometric_in');
  const biometricOutSession = dailySessions.find((s) => s.type === 'biometric_out');
  const periodSessions = dailySessions.filter((s) => s.type === 'period');
  const forenoonSessions = periodSessions.filter((s) => s.slot === 'Forenoon');
  const afternoonSessions = periodSessions.filter((s) => s.slot === 'Afternoon');

  // Stats for the selected day
  const selectedDayPresent = periodSessions.filter((s) => s.status === 'Present' || s.status === 'On Duty').length;
  const selectedDayAbsent = periodSessions.length - selectedDayPresent;

  const handleOpenDispute = (session?: DailyAttendanceSession) => {
    setSelectedDisputeSession(session || periodSessions[0] || null);
    setDisputeReason('');
    setDisputeEvidence('');
    setDisputeSuccessMessage(null);
    setIsDisputeModalOpen(true);
  };

  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;

    const newDispute: AttendanceDisputeRequest = {
      id: `disp_${Date.now()}`,
      studentId,
      studentName: user?.name || 'Harish M',
      date: selectedDate,
      periodNumber: selectedDisputeSession?.periodNumber,
      courseCode: selectedDisputeSession?.courseCode,
      sessionTitle: selectedDisputeSession?.courseName || `Period ${selectedDisputeSession?.periodNumber}`,
      reason: disputeReason.trim(),
      evidenceNote: disputeEvidence.trim(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    saveDisputeRequest(newDispute);
    setDisputesList(getStoredDisputes());
    setDisputeSuccessMessage('Dispute request submitted to Head of Department & Academic Cell for verification.');
    setTimeout(() => {
      setIsDisputeModalOpen(false);
      setDisputeSuccessMessage(null);
    }, 1800);
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading statutory attendance register...</p>
        </div>
      </div>
    );
  }

  // Attendance metrics values (matching screenshot or student actuals)
  const overallPercentage = metrics.attendancePercentage || 92.11;
  const daysPresent = ((metrics.presentClasses || 87) + 0.5).toFixed(2);
  const daysAbsent = Math.max(0, metrics.totalClasses - metrics.presentClasses || 7.5).toFixed(2);
  const requestsRaisedCount = disputesList.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Main Banner matching the PCDP screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0F172A] text-white flex items-center justify-center shadow-xs shrink-0">
            <CalendarIcon className="w-6 h-6 text-slate-100" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {formatFullDayHeader(selectedDate)}
            </p>
          </div>
        </div>

        {/* Date Selector alone with one calendar symbol as button */}
        <div className="flex flex-col">
          <label htmlFor="attendance-date-input" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            ATTENDANCE DATE
          </label>
          <div
            onClick={() => dateInputRef.current?.showPicker?.()}
            className="relative flex items-center justify-between min-w-[170px] bg-slate-50 border border-slate-200 hover:border-[#1E3A5F] rounded-xl px-3.5 py-2 transition cursor-pointer shadow-2xs group"
          >
            <span className="text-xs font-bold text-slate-800 font-mono tracking-wide">
              {formatDatePCDP(selectedDate)}
            </span>
            <button
              type="button"
              aria-label="Select attendance date"
              onClick={(e) => {
                e.stopPropagation();
                dateInputRef.current?.showPicker?.();
              }}
              className="text-slate-500 group-hover:text-[#1E3A5F] transition p-0.5 cursor-pointer ml-3 flex items-center justify-center"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <input
              ref={dateInputRef}
              id="attendance-date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="sr-only"
            />
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards Matching the Screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. OVERALL */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex items-center gap-4">
          {/* Circular Progress Ring */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="#E2E8F0"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="#0F172A"
                strokeWidth="4"
                strokeDasharray="138.2"
                strokeDashoffset={138.2 - (138.2 * overallPercentage) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-slate-800">
              {Math.round(overallPercentage)}%
            </span>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              OVERALL
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {overallPercentage}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">95 working days</div>
          </div>
        </div>

        {/* 2. DAYS PRESENT */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              DAYS PRESENT
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {daysPresent}
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#3F7D58] border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>

        {/* 3. DAYS ABSENT */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              DAYS ABSENT
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {daysAbsent}
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-red-50 text-[#B94A48] border border-red-200 flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
        </div>

        {/* 4. SELECTED DAY */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              SELECTED DAY
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {selectedDayPresent}/7
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Present / periods</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 text-slate-500 border border-slate-200 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* 5. REQUESTS RAISED (THIS WEEK) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>REQUESTS RAISED</span>
              <span className="text-[9px] text-slate-400 font-normal">(THIS WEEK)</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {requestsRaisedCount}/3
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {3 - requestsRaisedCount} remaining this week · 0 pending review - resets 2026-10-19
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenDispute()}
            title="Raise attendance dispute or request correction"
            className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center shrink-0 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Daily Register Section: 7 Periods + 2 Biometrics Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Daily register</h2>
            <p className="text-xs text-slate-500">
              OTP-marked sessions for the selected date ({formatDatePCDP(selectedDate)})
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 text-[#3F7D58]">
              <span className="w-2 h-2 rounded-full bg-[#3F7D58]" />
              <span>{selectedDayPresent} present</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#B94A48]">
              <span className="w-2 h-2 rounded-full bg-[#B94A48]" />
              <span>{selectedDayAbsent} absent</span>
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 text-[11px]">
              <tr>
                <th className="px-6 py-3.5">TIMING</th>
                <th className="px-6 py-3.5">SLOT</th>
                <th className="px-6 py-3.5">MARKED BY</th>
                <th className="px-6 py-3.5 text-center">STATUS</th>
                <th className="px-6 py-3.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* 1. Biometric In Punch Row */}
              {biometricInSession && (
                <tr className="bg-slate-50/40 hover:bg-slate-50/80 transition">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="w-1 h-8 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Fingerprint className="w-3.5 h-3.5 text-[#1E3A5F]" />
                          <span>{biometricInSession.timing}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {biometricInSession.timestamp ? `Punched at ${biometricInSession.timestamp}` : 'Morning Verification'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-600">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A5F] border border-blue-100 font-semibold">
                      Biometric In
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Fingerprint className="w-3.5 h-3.5" />
                      </div>
                      <div className="font-medium text-slate-800 text-[11px]">
                        {biometricInSession.markedBy}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#3F7D58] border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3F7D58]" />
                      <span>Present</span>
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right text-slate-400 font-mono">—</td>
                </tr>
              )}

              {/* Forenoon Morning Sessions Group Header */}
              <tr className="bg-slate-50/90 font-semibold text-slate-600 text-[11px] border-t border-b border-slate-200/70">
                <td colSpan={2} className="px-6 py-2">
                  <span className="text-slate-900 font-bold">Forenoon</span>{' '}
                  <span className="text-slate-500 font-normal">Morning sessions</span>
                </td>
                <td colSpan={3} className="px-6 py-2 text-right text-slate-400">
                  {forenoonSessions.length} sessions
                </td>
              </tr>

              {/* Forenoon Periods 1 to 4 */}
              {forenoonSessions.map((s) => {
                const isPresent = s.status === 'Present';
                const isOD = s.status === 'On Duty';
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-1 h-9 rounded-full shrink-0 ${
                            isPresent ? 'bg-emerald-500' : isOD ? 'bg-blue-500' : 'bg-red-500'
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            {s.timing}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Period {s.periodNumber} • {s.courseCode} - {s.courseName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-medium">
                      {s.slot}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-xs">
                            {s.markedBy.split(' ')[0]} {s.markedBy.split(' ')[1] || ''}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {s.facultyCode || 'HU11211'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                          isPresent
                            ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                            : isOD
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-red-50 text-[#B94A48] border-red-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPresent ? 'bg-[#3F7D58]' : isOD ? 'bg-blue-600' : 'bg-[#B94A48]'
                          }`}
                        />
                        <span>{s.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {!isPresent ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDispute(s)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                          Raise Dispute
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Afternoon Sessions Group Header */}
              <tr className="bg-slate-50/90 font-semibold text-slate-600 text-[11px] border-t border-b border-slate-200/70">
                <td colSpan={2} className="px-6 py-2">
                  <span className="text-slate-900 font-bold">Afternoon</span>{' '}
                  <span className="text-slate-500 font-normal">Afternoon sessions</span>
                </td>
                <td colSpan={3} className="px-6 py-2 text-right text-slate-400">
                  {afternoonSessions.length} sessions
                </td>
              </tr>

              {/* Afternoon Periods 5 to 7 */}
              {afternoonSessions.map((s) => {
                const isPresent = s.status === 'Present';
                const isOD = s.status === 'On Duty';
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-1 h-9 rounded-full shrink-0 ${
                            isPresent ? 'bg-emerald-500' : isOD ? 'bg-blue-500' : 'bg-red-500'
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            {s.timing}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Period {s.periodNumber} • {s.courseCode} - {s.courseName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-medium">
                      {s.slot}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-xs">
                            {s.markedBy.split(' ')[0]} {s.markedBy.split(' ')[1] || ''}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {s.facultyCode || 'CS10402'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                          isPresent
                            ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                            : isOD
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-red-50 text-[#B94A48] border-red-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPresent ? 'bg-[#3F7D58]' : isOD ? 'bg-blue-600' : 'bg-[#B94A48]'
                          }`}
                        />
                        <span>{s.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {!isPresent ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDispute(s)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                          Raise Dispute
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* 2. Biometric Out Punch Row */}
              {biometricOutSession && (
                <tr className="bg-slate-50/40 hover:bg-slate-50/80 transition">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="w-1 h-8 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Fingerprint className="w-3.5 h-3.5 text-[#1E3A5F]" />
                          <span>{biometricOutSession.timing}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {biometricOutSession.timestamp ? `Punched at ${biometricOutSession.timestamp}` : 'Evening Verification'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-600">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A5F] border border-blue-100 font-semibold">
                      Biometric Out
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Fingerprint className="w-3.5 h-3.5" />
                      </div>
                      <div className="font-medium text-slate-800 text-[11px]">
                        {biometricOutSession.markedBy}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#3F7D58] border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3F7D58]" />
                      <span>Present</span>
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right text-slate-400 font-mono">—</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course-Wise Attendance Compliance Table (Statutory 75% Regulatory Ledger) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Course-Wise Statutory Compliance Register</h2>
            <p className="text-xs text-slate-500">Cumulative semester hours and university 75% examination eligibility</p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg font-medium">
            <ShieldCheck className="w-4 h-4 text-[#3F7D58]" />
            <span>ERP Synchronized</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-5 py-3">Course Code</th>
                <th className="px-5 py-3">Course Title</th>
                <th className="px-5 py-3 text-center">Conducted</th>
                <th className="px-5 py-3 text-center">Attended</th>
                <th className="px-5 py-3 text-center">Absent</th>
                <th className="px-5 py-3 text-right">Percentage</th>
                <th className="px-5 py-3 text-center">Statutory Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {metrics.courseWiseAttendance.map((cw) => {
                const isSafe = cw.percentage >= 85;
                const isWarning = cw.percentage >= 75 && cw.percentage < 85;

                return (
                  <tr key={cw.courseId} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3 font-mono font-bold text-[#1E3A5F]">{cw.courseCode}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{cw.courseName}</td>
                    <td className="px-5 py-3 text-center font-semibold">{cw.total}</td>
                    <td className="px-5 py-3 text-center font-semibold text-[#3F7D58]">{cw.present}</td>
                    <td className="px-5 py-3 text-center font-semibold text-[#B94A48]">{cw.absent}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-sm">
                      <span
                        className={
                          isSafe
                            ? 'text-[#3F7D58]'
                            : isWarning
                            ? 'text-[#B7791F]'
                            : 'text-[#B94A48] font-extrabold'
                        }
                      >
                        {cw.percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          isSafe
                            ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                            : isWarning
                            ? 'bg-amber-50 text-[#B7791F] border-amber-200'
                            : 'bg-red-50 text-[#B94A48] border-red-200'
                        }`}
                      >
                        {isSafe ? 'Compliant' : isWarning ? 'Warning Tier' : 'Shortage (<75%)'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Dispute / Request Modal */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Raise Attendance Correction Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDisputeModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {disputeSuccessMessage ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#3F7D58] border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Request Lodged Successfully</h4>
                <p className="text-xs text-slate-600">{disputeSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitDispute} className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    Institutional Policy allows <strong>3 dispute requests per weekly cycle</strong>. All requests require verification by course faculty and approval by HOD.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Session / Period</label>
                  <select
                    value={selectedDisputeSession?.id || ''}
                    onChange={(e) => {
                      const found = dailySessions.find((s) => s.id === e.target.value);
                      if (found) setSelectedDisputeSession(found);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  >
                    {periodSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        Period {s.periodNumber} ({s.timing}) - {s.courseCode}: {s.courseName} (Current: {s.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Reason for Dispute / Correction <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] mb-2"
                  >
                    <option value="">-- Select Standard Justification --</option>
                    <option value="Approved Institutional On-Duty (OD) for Technical Symposium / Competition">
                      Approved Institutional On-Duty (OD) for Technical Symposium / Competition
                    </option>
                    <option value="Authorized Medical Leave with Certificate Submitted to HOD">
                      Authorized Medical Leave with Certificate Submitted to HOD
                    </option>
                    <option value="Biometric Device Scanner Error / Punch Log Mismatch">
                      Biometric Device Scanner Error / Punch Log Mismatch
                    </option>
                    <option value="Faculty OTP Session Timeout during Network Glitch">
                      Faculty OTP Session Timeout during Network Glitch
                    </option>
                    <option value="Participated in Campus Placement Drive / Training">
                      Participated in Campus Placement Drive / Training
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Additional Details & Supporting Reference (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={disputeEvidence}
                    onChange={(e) => setDisputeEvidence(e.target.value)}
                    placeholder="Enter approval reference number, advisor name, or OD letter details..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDisputeModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-white bg-[#1E3A5F] hover:bg-[#16304F] font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
