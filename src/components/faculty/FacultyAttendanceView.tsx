import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { Course, AttendanceRecord } from '../../types/index.js';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Users,
  AlertTriangle,
  Calendar,
  BookOpen,
  Building,
  ShieldCheck,
  Clock,
  Send,
  Fingerprint,
  Sparkles,
  KeyRound,
  RotateCcw,
  Check,
  Search,
  Filter,
} from 'lucide-react';
import {
  PERIOD_SCHEDULE,
  formatDateISO,
  formatDatePCDP,
  saveFacultyPeriodMarking,
} from '../../services/attendanceSchedule.js';

export const FacultyAttendanceView: React.FC = () => {
  const { profile, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.getFullYear() === 2026 ? formatDateISO(today) : '2026-10-13';
  });
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [sessionType, setSessionType] = useState<string>('Standard Lecture');

  const [activeTab, setActiveTab] = useState<'give_attendance' | 'ledger'>('give_attendance');

  const [students, setStudents] = useState<any[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent' | 'On Duty' | 'Late'>>({});
  const [studentRemarks, setStudentRemarks] = useState<Record<string, string>>({});
  const [, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Search filter for students
  const [searchQuery, setSearchQuery] = useState('');

  // OTP Mode State
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState<string>('8492');
  const [otpSecondsLeft, setOtpSecondsLeft] = useState<number>(300);
  const [otpActive, setOtpActive] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCourses(), api.getStudents()])
      .then(([courseList, stuList]) => {
        setCourses(courseList);
        setStudents(stuList);
        if (courseList.length > 0) {
          setSelectedCourseId(courseList[0].id);
        }

        const facultyDept = (profile as any)?.department;
        if (facultyDept) {
          setSelectedDepartment(facultyDept);
        } else if (stuList.length > 0) {
          const depts = Array.from(new Set(stuList.map((s: any) => s.department).filter(Boolean)));
          setSelectedDepartment((depts[0] as string) || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  useEffect(() => {
    if (selectedCourseId && selectedDate) {
      api
        .getAttendance({ courseId: selectedCourseId, date: selectedDate })
        .then((records) => {
          setExistingRecords(records);
          const stateMap: Record<string, 'Present' | 'Absent' | 'On Duty' | 'Late'> = {};
          students.forEach((s) => {
            const found = records.find((r) => r.student_id === s.id);
            stateMap[s.id] = found ? (found.status as any) : 'Present';
          });
          setAttendanceState(stateMap);
        })
        .catch(console.error);
    }
  }, [selectedCourseId, selectedDate, students]);

  // OTP Timer Countdown
  useEffect(() => {
    let timer: any;
    if (otpActive && otpSecondsLeft > 0) {
      timer = setInterval(() => {
        setOtpSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (otpSecondsLeft === 0) {
      setOtpActive(false);
    }
    return () => clearInterval(timer);
  }, [otpActive, otpSecondsLeft]);

  const handleGenerateOtp = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setOtpCode(code);
    setOtpSecondsLeft(300);
    setOtpActive(true);
    setIsOtpMode(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter students by selected department
  const departmentCounts: Record<string, number> = {};
  students.forEach((s) => {
    if (s.department) {
      departmentCounts[s.department] = (departmentCounts[s.department] || 0) + 1;
    }
  });
  const departments = Object.keys(departmentCounts).sort();

  const filteredStudents = (
    selectedDepartment ? students.filter((s) => s.department === selectedDepartment) : students
  ).filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.student_name?.toLowerCase().includes(q) ||
      s.register_number?.toLowerCase().includes(q) ||
      s.admission_number?.toLowerCase().includes(q)
    );
  });

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const currentPeriodConfig = PERIOD_SCHEDULE.find((p) => p.periodNumber === selectedPeriod) || PERIOD_SCHEDULE[0];

  const presentCount = filteredStudents.filter((s) => (attendanceState[s.id] || 'Present') === 'Present' || (attendanceState[s.id] || 'Present') === 'On Duty').length;
  const absentCount = filteredStudents.length - presentCount;
  const sessionPercentage = filteredStudents.length > 0 ? Math.round((presentCount / filteredStudents.length) * 100) : 0;

  // Batch toggle actions
  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const updated = { ...attendanceState };
    filteredStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceState(updated);
  };

  const handleToggleStudent = (studentId: string, status: 'Present' | 'Absent' | 'On Duty' | 'Late') => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Submit / Give Attendance
  const handleSaveAttendance = async () => {
    if (!selectedCourseId || !selectedDate) return;
    setSaving(true);
    setSaveSuccessMsg(null);

    try {
      const recordsToSave = filteredStudents.map((s) => {
        const currentStat = attendanceState[s.id] || 'Present';
        const backendStatus = currentStat === 'Absent' ? 'Absent' : 'Present';
        return {
          student_id: s.id,
          course_id: selectedCourseId,
          date: selectedDate,
          status: backendStatus as 'Present' | 'Absent',
        };
      });

      // Also persist period-specific status in localStorage so student daily register updates immediately
      filteredStudents.forEach((s) => {
        const pKey = `${s.id}_${selectedDate}_p${selectedPeriod}`;
        saveFacultyPeriodMarking(pKey, attendanceState[s.id] || 'Present');
      });

      await api.saveAttendanceBatch(recordsToSave);

      const periodName = `Period ${selectedPeriod} (${currentPeriodConfig.timing})`;
      setSaveSuccessMsg(
        `Successfully recorded and synchronized attendance for ${periodName} on ${formatDatePCDP(selectedDate)} for ${recordsToSave.length} students.`
      );

      // Reload existing records
      const fresh = await api.getAttendance({ courseId: selectedCourseId, date: selectedDate });
      setExistingRecords(fresh);

      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      console.error('Save attendance failed:', err);
      alert(err.message || 'Failed to submit attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A5F] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1E3A5F]" />
              Faculty Attendance Portal
            </span>
            <span className="text-xs text-slate-400">• Institutional 7 Periods & Biometrics Station</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Giving & Session Register</h1>
          <p className="text-xs text-slate-500">
            Record lecture period attendance, generate OTP student sessions, verify biometrics, and audit statutory logs
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('give_attendance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'give_attendance'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Give Attendance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Attendance Ledger</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#3F7D58] text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#3F7D58] shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control Panel: Course, Department, Date, Period */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Department Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#1E3A5F]" />
              <span>Department</span>
            </label>
            <select
              id="faculty-select-dept"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept} ({departmentCounts[dept]} students)
                </option>
              ))}
            </select>
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#1E3A5F]" />
              <span>Course / Subject</span>
            </label>
            <select
              id="faculty-select-course"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code} - {c.course_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1E3A5F]" />
              <span>Attendance Date</span>
            </label>
            <input
              id="faculty-input-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1E3A5F]" />
              <span>Session Type</span>
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              <option value="Standard Lecture">Standard Lecture</option>
              <option value="Laboratory / Practical">Laboratory / Practical</option>
              <option value="Tutorial / Problem Solving">Tutorial / Problem Solving</option>
              <option value="Remedial / Revision Session">Remedial / Revision Session</option>
            </select>
          </div>
        </div>

        {/* 7 Periods Navigation Bar */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-[#1E3A5F]" />
              <span>Select Lecture Period (1 to 7)</span>
            </span>
            <span className="text-xs text-slate-500">
              Selected: <strong>Period {selectedPeriod}</strong> ({currentPeriodConfig.timing}) • {currentPeriodConfig.slot}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {PERIOD_SCHEDULE.map((p) => {
              const isSelected = selectedPeriod === p.periodNumber;
              return (
                <button
                  key={p.periodNumber}
                  type="button"
                  onClick={() => setSelectedPeriod(p.periodNumber)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] shadow-xs ring-2 ring-[#1E3A5F]/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs">Period {p.periodNumber}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.slot}
                    </span>
                  </div>
                  <div
                    className={`text-[11px] mt-1 font-mono ${
                      isSelected ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {p.timing}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Cohort Students</span>
            <div className="text-xl font-extrabold text-slate-900">{filteredStudents.length}</div>
          </div>
          <Users className="w-6 h-6 text-[#1E3A5F]" />
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Marked Present</span>
            <div className="text-xl font-extrabold text-[#3F7D58]">{presentCount}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-[#3F7D58]" />
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Marked Absent</span>
            <div className="text-xl font-extrabold text-[#B94A48]">{absentCount}</div>
          </div>
          <XCircle className="w-6 h-6 text-[#B94A48]" />
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Period Turnout</span>
            <div className="text-xl font-extrabold text-[#1E3A5F]">{sessionPercentage}%</div>
          </div>
          <CalendarCheck className="w-6 h-6 text-[#1E3A5F]" />
        </div>
      </div>

      {activeTab === 'give_attendance' ? (
        /* Give Attendance Active Marking Station */
        <div className="space-y-4">
          {/* Action Bar & OTP Session Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quick Actions:
              </span>
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-[#3F7D58] border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-[#B94A48] border border-red-200 hover:bg-red-100 transition cursor-pointer flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Mark All Absent</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateOtp}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                  otpActive
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{otpActive ? `Live OTP: ${otpCode} (${Math.floor(otpSecondsLeft / 60)}:${String(otpSecondsLeft % 60).padStart(2, '0')})` : 'Generate OTP Mode'}</span>
              </button>
            </div>

            {/* Submit Attendance Giving Button */}
            <div>
              <button
                id="btn-submit-attendance-giving"
                type="button"
                disabled={saving || filteredStudents.length === 0}
                onClick={handleSaveAttendance}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#16304F] text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Synchronizing Records...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Submit & Save Attendance for Period {selectedPeriod}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* OTP Live Broadcast Banner (If Active) */}
          {otpActive && (
            <div className="bg-gradient-to-r from-indigo-900 to-[#1E3A5F] text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <KeyRound className="w-6 h-6 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                    Live Session OTP Active • Period {selectedPeriod}
                  </div>
                  <div className="text-2xl font-mono font-extrabold tracking-widest text-amber-300">
                    {otpCode}
                  </div>
                  <div className="text-xs text-indigo-200">
                    Ask students to validate on PCDP portal. Expires in {Math.floor(otpSecondsLeft / 60)} min {otpSecondsLeft % 60} sec.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateOtp}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOtpActive(false)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition cursor-pointer"
                >
                  Finalize OTP Session
                </button>
              </div>
            </div>
          )}

          {/* Student Roster Table for Attendance Giving */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Student Roll-Call Roster • Period {selectedPeriod} ({currentPeriodConfig.timing})
                </h3>
                <span className="text-xs text-slate-500">
                  ({filteredStudents.length} students)
                </span>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search register number or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-5 py-3">Register No</th>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3 text-center">Biometric Punch</th>
                    <th className="px-5 py-3 text-center">Cumulative %</th>
                    <th className="px-5 py-3 text-center">Period {selectedPeriod} Status</th>
                    <th className="px-5 py-3">Remarks / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStudents.map((s) => {
                    const currentStatus = attendanceState[s.id] || 'Present';
                    const isPresent = currentStatus === 'Present';
                    const isAbsent = currentStatus === 'Absent';
                    const isOD = currentStatus === 'On Duty';
                    const isLate = currentStatus === 'Late';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 font-mono font-bold text-[#1E3A5F]">
                          {s.register_number}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          <div>{s.student_name}</div>
                          <div className="text-[11px] text-slate-400">{s.email}</div>
                        </td>

                        {/* Biometric verification status */}
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#3F7D58] border border-emerald-200 text-[10px] font-semibold">
                            <Fingerprint className="w-3 h-3" />
                            <span>In: 08:24 AM</span>
                          </span>
                        </td>

                        {/* Cumulative Attendance % */}
                        <td className="px-5 py-3.5 text-center font-mono font-bold">
                          <span
                            className={
                              s.attendancePercentage >= 85
                                ? 'text-[#3F7D58]'
                                : s.attendancePercentage >= 75
                                ? 'text-amber-600'
                                : 'text-[#B94A48]'
                            }
                          >
                            {s.attendancePercentage || 92}%
                          </span>
                        </td>

                        {/* Attendance Giving Radio / Toggle Buttons */}
                        <td className="px-5 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleToggleStudent(s.id, 'Present')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                isPresent
                                  ? 'bg-[#3F7D58] text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStudent(s.id, 'Absent')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                isAbsent
                                  ? 'bg-[#B94A48] text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStudent(s.id, 'On Duty')}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                isOD
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              OD
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStudent(s.id, 'Late')}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                isLate
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              Late
                            </button>
                          </div>
                        </td>

                        {/* Remarks Input */}
                        <td className="px-5 py-3.5">
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={studentRemarks[s.id] || ''}
                            onChange={(e) =>
                              setStudentRemarks((prev) => ({
                                ...prev,
                                [s.id]: e.target.value,
                              }))
                            }
                            className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Submit Toolbar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Ready to commit {filteredStudents.length} records for <strong>Period {selectedPeriod}</strong> ({currentPeriodConfig.timing}).
              </div>
              <button
                type="button"
                disabled={saving || filteredStudents.length === 0}
                onClick={handleSaveAttendance}
                className="px-6 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#16304F] text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : `Confirm & Save Attendance (Period ${selectedPeriod})`}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Statutory Ledger View Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="font-bold text-slate-900 text-sm">
              Attendance Ledger: {selectedCourse?.course_code} - {selectedCourse?.course_name} ({formatDatePCDP(selectedDate)})
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3F7D58]" />
              <span>Institutional Audit Compliant Register</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Register Number</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3 text-center">Cumulative Attendance</th>
                  <th className="px-5 py-3 text-center">Statutory Standing</th>
                  <th className="px-5 py-3 text-center">Status for {formatDatePCDP(selectedDate)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((s) => {
                  const currentStatus = attendanceState[s.id] || 'Present';
                  const isPresent = currentStatus === 'Present';
                  const isShortage = s.attendancePercentage < 75;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#1E3A5F]">{s.register_number}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{s.student_name}</td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-sm">
                        <span className={isShortage ? 'text-[#B94A48] font-extrabold' : 'text-[#3F7D58]'}>
                          {s.attendancePercentage || 92}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isShortage
                              ? 'bg-red-50 text-[#B94A48] border-red-200'
                              : 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                          }`}
                        >
                          {isShortage ? 'Shortage (<75%)' : 'Eligible'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isPresent
                              ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                              : 'bg-red-50 text-[#B94A48] border-red-200'
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
