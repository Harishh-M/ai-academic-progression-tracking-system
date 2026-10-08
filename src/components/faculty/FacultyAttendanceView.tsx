import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Course, Student, AttendanceRecord } from '../../types/index.js';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Users,
  AlertTriangle,
  Save,
  Check,
  Calendar,
  BookOpen,
  Filter,
} from 'lucide-react';

export const FacultyAttendanceView: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent'>>({});
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCourses(), api.getStudents()])
      .then(([courseList, stuList]) => {
        setCourses(courseList);
        setStudents(stuList);
        if (courseList.length > 0) {
          setSelectedCourseId(courseList[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCourseId && selectedDate) {
      api
        .getAttendance({ courseId: selectedCourseId, date: selectedDate })
        .then((records) => {
          setExistingRecords(records);
          const stateMap: Record<string, 'Present' | 'Absent'> = {};
          // Default all to Present unless existing record says otherwise
          students.forEach((s) => {
            const found = records.find((r) => r.student_id === s.id);
            stateMap[s.id] = found ? found.status : 'Present';
          });
          setAttendanceState(stateMap);
        })
        .catch(console.error);
    }
  }, [selectedCourseId, selectedDate, students]);

  const handleToggle = (studentId: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present',
    }));
  };

  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const updated: Record<string, 'Present' | 'Absent'> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceState(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourseId || !selectedDate) return;
    setSaving(true);
    try {
      const recordsToSave = students.map((s) => ({
        student_id: s.id,
        course_id: selectedCourseId,
        date: selectedDate,
        status: attendanceState[s.id] || 'Present',
      }));

      await api.saveAttendanceBatch(recordsToSave);
      setFeedback(`Attendance successfully saved for ${students.length} students on ${selectedDate}.`);
      // Refresh students metrics
      const freshStudents = await api.getStudents();
      setStudents(freshStudents);
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const presentCount = Object.values(attendanceState).filter((st) => st === 'Present').length;
  const absentCount = students.length - presentCount;
  const sessionPercentage = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Statutory Course Attendance Entry</h1>
          <p className="text-xs text-slate-500">
            Record daily hour-wise attendance, monitor 75% regulatory compliance, and log audit history
          </p>
        </div>

        <button
          id="btn-save-attendance"
          onClick={handleSaveAttendance}
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-[#1E3A5F] hover:bg-[#16304F] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving to ERP...' : 'Save & Publish Attendance'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3F7D58]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Control Panel: Course & Date Pickers */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#1E3A5F]" />
            <span>Select Course / Subject</span>
          </label>
          <select
            id="select-attendance-course"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_code} - {c.course_name} (Sem {c.semester_number})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#1E3A5F]" />
            <span>Attendance Date</span>
          </label>
          <input
            id="input-attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          />
        </div>

        <div className="flex flex-col justify-end">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAll('Present')}
              className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#3F7D58] text-xs font-semibold transition"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('Absent')}
              className="flex-1 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-[#B94A48] text-xs font-semibold transition"
            >
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Session Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Total Students</span>
            <div className="text-xl font-extrabold text-slate-900">{students.length}</div>
          </div>
          <Users className="w-6 h-6 text-[#1E3A5F]" />
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Present Today</span>
            <div className="text-xl font-extrabold text-[#3F7D58]">{presentCount}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-[#3F7D58]" />
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Absent Today</span>
            <div className="text-xl font-extrabold text-[#B94A48]">{absentCount}</div>
          </div>
          <XCircle className="w-6 h-6 text-[#B94A48]" />
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Session Turnout</span>
            <div className="text-xl font-extrabold text-[#1E3A5F]">{sessionPercentage}%</div>
          </div>
          <CalendarCheck className="w-6 h-6 text-[#1E3A5F]" />
        </div>
      </div>

      {/* Student Attendance Marking Roster */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-900 text-sm">
            Attendance Ledger: {selectedCourse?.course_code} - {selectedCourse?.course_name} ({selectedDate})
          </div>
          <span className="text-xs text-slate-400">Click button or status tag to toggle</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Register Number</th>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3 text-center">Cumulative Attendance</th>
                <th className="px-5 py-3 text-center">Statutory Standing</th>
                <th className="px-5 py-3 text-center">Status for {selectedDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {students.map((s) => {
                const currentStatus = attendanceState[s.id] || 'Present';
                const isPresent = currentStatus === 'Present';
                const isShortage = s.attendancePercentage < 75;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#1E3A5F]">{s.register_number}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{s.student_name}</div>
                      <div className="text-[11px] text-slate-400">{s.branch_code} • {s.batch}</div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`font-bold font-mono ${
                          s.attendancePercentage >= 85
                            ? 'text-[#3F7D58]'
                            : s.attendancePercentage >= 75
                            ? 'text-[#B7791F]'
                            : 'text-[#B94A48]'
                        }`}
                      >
                        {s.attendancePercentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {isShortage ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-[#B94A48] border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-[#B94A48]" />
                          <span>Shortage Alert (&lt;75%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-[#3F7D58] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-[#3F7D58]" />
                          <span>Compliant</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(s.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs shadow-xs transition ${
                          isPresent
                            ? 'bg-[#3F7D58] hover:bg-[#346748] text-white'
                            : 'bg-[#B94A48] hover:bg-[#9c3e3c] text-white'
                        }`}
                      >
                        {isPresent ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{isPresent ? 'Present' : 'Absent'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
