import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Printer, Download, GraduationCap, ShieldCheck, FileText } from 'lucide-react';

export const StudentReportsView: React.FC = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.studentId) {
      setLoading(true);
      api
        .getStudentReport(user.studentId)
        .then(setReport)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.studentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { student, metrics, semesterResults, courseWiseAttendance, aiAnalysis } = report;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Official Academic Progress Transcript</h1>
          <p className="text-xs text-slate-500">
            Certified institutional grade sheet and cumulative progress report
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Transcript</span>
          </button>
        </div>
      </div>

      {/* Printable Official Document Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 space-y-6 text-slate-800">
        {/* University Header */}
        <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-2 print:border">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight uppercase text-slate-900">
            State Technological University
          </h2>
          <h3 className="text-sm font-bold text-slate-700">UNIVERSITY COLLEGE OF ENGINEERING</h3>
          <p className="text-xs text-slate-500">Department of Academic Affairs & Student Progress Records</p>
          <div className="inline-block mt-2 px-3 py-1 bg-slate-100 rounded text-xs font-bold uppercase tracking-wider text-slate-800">
            OFFICIAL STUDENT ACADEMIC PROGRESS TRANSCRIPT
          </div>
        </div>

        {/* Student Demographic Dossier Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block">Student Name</span>
            <span className="font-bold text-slate-900">{student.student_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Register Number</span>
            <span className="font-mono font-bold text-indigo-700">{student.register_number}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Degree Programme</span>
            <span className="font-semibold text-slate-900">{student.programme}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Branch & Code</span>
            <span className="font-semibold text-slate-900">{student.branch_code}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Batch</span>
            <span className="font-medium text-slate-800">{student.batch}</span>
          </div>
          <div>
            <span className="text-slate-400 block">ABC ID</span>
            <span className="font-mono text-slate-800">{student.abc_id}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Current Status</span>
            <span className="font-semibold text-emerald-700">{student.current_status}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Cumulative CGPA</span>
            <span className="font-extrabold text-indigo-700 text-sm">{metrics.cgpa.toFixed(2)} / 10.0</span>
          </div>
        </div>

        {/* Examination Results Ledger */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
            I. Semester Examination Grade Ledger
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="p-2 border">Course Code</th>
                  <th className="p-2 border">Course Title</th>
                  <th className="p-2 text-center border">Credits</th>
                  <th className="p-2 text-center border">Grade</th>
                  <th className="p-2 text-center border">Grade Point</th>
                  <th className="p-2 text-center border">Result Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {semesterResults.map((sr: any) => (
                  <tr key={sr.id}>
                    <td className="p-2 font-mono font-bold text-slate-900 border">{sr.courseCode}</td>
                    <td className="p-2 border">{sr.courseName}</td>
                    <td className="p-2 text-center font-medium border">{sr.credits}</td>
                    <td className="p-2 text-center font-bold border">{sr.grade}</td>
                    <td className="p-2 text-center font-mono border">{sr.grade_point}</td>
                    <td className="p-2 text-center font-bold border">
                      <span className={sr.result_status === 'Pass' ? 'text-emerald-700' : 'text-rose-700'}>
                        {sr.result_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
            II. Statutory Attendance Summary
          </h4>
          <div className="grid grid-cols-3 gap-4 text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div>
              <span className="text-slate-500 block">Total Conducted Hours</span>
              <span className="font-bold text-slate-900">{metrics.totalClasses}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Attended Hours</span>
              <span className="font-bold text-emerald-700">{metrics.presentClasses}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Overall Percentage</span>
              <span className="font-extrabold text-indigo-700">{metrics.attendancePercentage}%</span>
            </div>
          </div>
        </div>

        {/* Official Endorsement & Verification Footer */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 text-xs">
          <div>
            <p className="text-slate-400">Date of Generation: {new Date().toLocaleDateString()}</p>
            <p className="text-slate-400">System Verification Hash: STU-ERP-{student.id.toUpperCase()}</p>
          </div>
          <div className="text-right space-y-4">
            <div className="h-8" />
            <div className="border-t border-slate-400 inline-block pt-1 w-48 text-center font-bold text-slate-800">
              Controller of Examinations
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
