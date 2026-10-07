import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { CalculatedAcademicMetrics, AttendanceRecord, Course } from '../../types/index.js';
import { MetricCard } from '../common/MetricCard.js';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  Filter,
  ShieldCheck,
} from 'lucide-react';

export const StudentAttendanceView: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<CalculatedAcademicMetrics | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.studentId) {
      setLoading(true);
      Promise.all([
        api.getStudentById(user.studentId),
        api.getCourses(),
      ])
        .then(([stuRes, courseList]) => {
          setMetrics(stuRes.metrics);
          setAttendance(stuRes.attendance);
          setCourses(courseList);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.studentId]);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const courseMap = new Map<string, Course>(courses.map((c) => [c.id, c]));

  const filteredLogs = selectedCourse === 'ALL'
    ? attendance
    : attendance.filter((a) => a.course_id === selectedCourse);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Register & Analytics</h1>
          <p className="text-xs text-slate-500">
            Institutional statutory attendance tracking with subject-wise audit logs
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Faculty Biometric & Manual Verified</span>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Overall Attendance"
          value={`${metrics.attendancePercentage}%`}
          subtitle="Mandatory minimum is 75.0%"
          icon={CalendarCheck}
          accentColor={metrics.attendancePercentage >= 75 ? 'emerald' : 'rose'}
          trend={{
            text: metrics.attendancePercentage >= 75 ? 'Exam Eligible' : 'Shortage Critical',
            isPositive: metrics.attendancePercentage >= 75,
          }}
        />
        <MetricCard
          title="Classes Attended"
          value={metrics.presentClasses}
          subtitle={`Out of ${metrics.totalClasses} total lecture hours`}
          icon={CheckCircle}
          accentColor="indigo"
        />
        <MetricCard
          title="Classes Missed"
          value={metrics.absentClasses}
          subtitle="Authorized and unauthorized"
          icon={XCircle}
          accentColor="amber"
        />
      </div>

      {/* Subject-Wise Attendance Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Course-Wise Attendance Compliance</h2>
            <p className="text-xs text-slate-500">Breakdown of lecture sessions conducted and attended per course</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Course Code</th>
                <th className="px-5 py-3">Course Title</th>
                <th className="px-5 py-3 text-center">Conducted</th>
                <th className="px-5 py-3 text-center">Attended</th>
                <th className="px-5 py-3 text-center">Absent</th>
                <th className="px-5 py-3 text-right">Percentage</th>
                <th className="px-5 py-3 text-center">Statutory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {metrics.courseWiseAttendance.map((cw) => {
                const isSafe = cw.percentage >= 85;
                const isWarning = cw.percentage >= 75 && cw.percentage < 85;
                const isCritical = cw.percentage < 75;

                return (
                  <tr key={cw.courseId} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-700">{cw.courseCode}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{cw.courseName}</td>
                    <td className="px-5 py-3.5 text-center font-semibold">{cw.total}</td>
                    <td className="px-5 py-3.5 text-center font-semibold text-emerald-700">{cw.present}</td>
                    <td className="px-5 py-3.5 text-center font-semibold text-rose-600">{cw.absent}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-sm">
                      <span
                        className={
                          isSafe
                            ? 'text-emerald-700'
                            : isWarning
                            ? 'text-amber-700'
                            : 'text-rose-700 font-extrabold'
                        }
                      >
                        {cw.percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          isSafe
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isWarning
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
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

      {/* Daily Attendance Session Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Daily Lecture Log</h3>
            <p className="text-xs text-slate-500">Record of recorded class attendance sessions</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="ALL">All Enrolled Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code} - {c.course_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
          {filteredLogs.slice(0, 50).map((log) => {
            const c = courseMap.get(log.course_id);
            const isPresent = log.status === 'Present';
            return (
              <div key={log.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isPresent
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isPresent ? 'P' : 'A'}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{c?.course_name || log.course_id}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{c?.course_code}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-slate-600 font-medium">{log.date}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      isPresent
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
