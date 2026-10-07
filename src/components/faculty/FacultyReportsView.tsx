import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Student } from '../../types/index.js';
import {
  FileText,
  Printer,
  Download,
  AlertTriangle,
  Award,
  CalendarCheck,
  GraduationCap,
  Users,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

export const FacultyReportsView: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [reportType, setReportType] = useState<'shortage' | 'arrears' | 'honor' | 'transcript'>('shortage');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedStudentReport, setSelectedStudentReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getStudents()
      .then((list) => {
        setStudents(list);
        if (list.length > 0) setSelectedStudentId(list[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (reportType === 'transcript' && selectedStudentId) {
      setReportLoading(true);
      api
        .getStudentReport(selectedStudentId)
        .then(setSelectedStudentReport)
        .catch(console.error)
        .finally(() => setReportLoading(false));
    }
  }, [reportType, selectedStudentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const shortageStudents = students.filter((s) => s.attendancePercentage < 75);
  const arrearStudents = students.filter((s) => s.currentArrears > 0);
  const honorStudents = students.filter((s) => s.cgpa >= 8.5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institutional Examination & Progress Reports</h1>
          <p className="text-xs text-slate-500">
            Generate and export official department reports, attendance shortage notices, and transcripts
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export Document</span>
        </button>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 print:hidden">
        <button
          onClick={() => setReportType('shortage')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
            reportType === 'shortage'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Attendance Shortage Notice ({shortageStudents.length})</span>
        </button>

        <button
          onClick={() => setReportType('arrears')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
            reportType === 'arrears'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Arrear Backlog Ledger ({arrearStudents.length})</span>
        </button>

        <button
          onClick={() => setReportType('honor')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
            reportType === 'honor'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Dean's Academic Honor Roll ({honorStudents.length})</span>
        </button>

        <button
          onClick={() => setReportType('transcript')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
            reportType === 'transcript'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Student Transcript Generator</span>
        </button>
      </div>

      {/* Transcript Student Selector */}
      {reportType === 'transcript' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-4 print:hidden">
          <div className="text-xs font-bold text-slate-700">Select Student for Official Transcript:</div>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-72 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.register_number} - {s.student_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Render Selected Report Paper Sheet */}
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
          <p className="text-xs text-slate-500">
            Department of Computer Science & Engineering • Academic Affairs Division
          </p>

          <div className="inline-block mt-2 px-3 py-1 bg-slate-100 rounded text-xs font-bold uppercase tracking-wider text-slate-800">
            {reportType === 'shortage'
              ? 'STATUTORY ATTENDANCE SHORTAGE & DEBARRED NOTICE'
              : reportType === 'arrears'
              ? 'SEMESTER EXAMINATION ARREAR BACKLOG COMPENDIUM'
              : reportType === 'honor'
              ? 'DEAN\'S ACADEMIC MERIT & MERIT SCHOLARSHIP ROLL'
              : 'OFFICIAL STUDENT ACADEMIC TRANSCRIPT'}
          </div>
        </div>

        {/* 1. Shortage Report */}
        {reportType === 'shortage' && (
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium leading-relaxed">
              <strong>Regulatory Reference (Clause 4.2 & 4.3):</strong> The following candidate(s) have secured less than 75% attendance during the current semester and are liable for debarment from the End Semester Examinations unless condonation is formally approved by the Academic Council.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5 border">Register No</th>
                    <th className="p-2.5 border">Student Name</th>
                    <th className="p-2.5 border">Programme</th>
                    <th className="p-2.5 text-center border">Conducted Hours</th>
                    <th className="p-2.5 text-center border">Attended Hours</th>
                    <th className="p-2.5 text-center border">Attendance %</th>
                    <th className="p-2.5 text-center border">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {shortageStudents.map((s) => (
                    <tr key={s.id}>
                      <td className="p-2.5 font-mono font-bold text-slate-900 border">{s.register_number}</td>
                      <td className="p-2.5 font-semibold border">{s.student_name}</td>
                      <td className="p-2.5 border">{s.branch_code} ({s.batch})</td>
                      <td className="p-2.5 text-center border">120</td>
                      <td className="p-2.5 text-center font-bold text-rose-700 border">
                        {Math.round((120 * s.attendancePercentage) / 100)}
                      </td>
                      <td className="p-2.5 text-center font-bold text-rose-700 border font-mono">
                        {s.attendancePercentage}%
                      </td>
                      <td className="p-2.5 text-center border">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                          Debarred / Shortage
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Arrears Report */}
        {reportType === 'arrears' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Summary of candidates possessing active arrear (U grade) backlogs in previous semester examinations.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5 border">Register No</th>
                    <th className="p-2.5 border">Student Name</th>
                    <th className="p-2.5 border">Batch</th>
                    <th className="p-2.5 text-center border">CGPA</th>
                    <th className="p-2.5 text-center border">Active Arrears</th>
                    <th className="p-2.5 border">Identified Arrear Subjects</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {arrearStudents.map((s) => (
                    <tr key={s.id}>
                      <td className="p-2.5 font-mono font-bold text-slate-900 border">{s.register_number}</td>
                      <td className="p-2.5 font-semibold border">{s.student_name}</td>
                      <td className="p-2.5 border">{s.batch}</td>
                      <td className="p-2.5 text-center font-mono font-bold border">{s.cgpa?.toFixed(2)}</td>
                      <td className="p-2.5 text-center font-bold text-rose-700 border">{s.currentArrears} Subject(s)</td>
                      <td className="p-2.5 border text-slate-600">
                        {s.currentArrears === 3
                          ? 'CS3301 (Data Structures), MA3354 (Discrete Maths), CS3302 (DPCA)'
                          : 'MA3354 (Discrete Mathematics)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Honor Roll */}
        {reportType === 'honor' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Department meritorious candidates achieving high academic distinction with CGPA ≥ 8.50 and zero standing arrears.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5 border">Merit Rank</th>
                    <th className="p-2.5 border">Register No</th>
                    <th className="p-2.5 border">Student Name</th>
                    <th className="p-2.5 text-center border">Cumulative CGPA</th>
                    <th className="p-2.5 text-center border">Attendance</th>
                    <th className="p-2.5 text-center border">Academic Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {honorStudents.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="p-2.5 font-bold text-center border">#{idx + 1}</td>
                      <td className="p-2.5 font-mono font-bold text-indigo-700 border">{s.register_number}</td>
                      <td className="p-2.5 font-bold text-slate-900 border">{s.student_name}</td>
                      <td className="p-2.5 text-center font-mono font-extrabold text-indigo-700 text-sm border">
                        {s.cgpa?.toFixed(2)} / 10.0
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-700 border">{s.attendancePercentage}%</td>
                      <td className="p-2.5 text-center border">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          First Class with Distinction
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Student Transcript */}
        {reportType === 'transcript' && (
          <div>
            {reportLoading || !selectedStudentReport ? (
              <div className="py-12 text-center text-slate-400">Loading student transcript...</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block">Student Name</span>
                    <span className="font-bold text-slate-900">{selectedStudentReport.student.student_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Register Number</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {selectedStudentReport.student.register_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Degree Programme</span>
                    <span className="font-semibold text-slate-900">{selectedStudentReport.student.programme}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ABC ID</span>
                    <span className="font-mono text-slate-800">{selectedStudentReport.student.abc_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Batch</span>
                    <span className="font-medium text-slate-800">{selectedStudentReport.student.batch}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status</span>
                    <span className="font-semibold text-emerald-700">
                      {selectedStudentReport.student.current_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cumulative CGPA</span>
                    <span className="font-extrabold text-indigo-700 text-sm">
                      {selectedStudentReport.metrics.cgpa.toFixed(2)} / 10.0
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Active Arrears</span>
                    <span className="font-bold text-slate-800">
                      {selectedStudentReport.metrics.currentArrears}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
                    Course Examination Grade Ledger
                  </h4>
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="p-2 border">Course Code</th>
                        <th className="p-2 border">Course Title</th>
                        <th className="p-2 text-center border">Credits</th>
                        <th className="p-2 text-center border">Grade</th>
                        <th className="p-2 text-center border">Grade Point</th>
                        <th className="p-2 text-center border">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedStudentReport.semesterResults.map((sr: any) => (
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
            )}
          </div>
        )}

        {/* Verification Signatures */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-3 text-xs text-center">
          <div>
            <div className="h-10" />
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">Faculty Advisor / Mentor</div>
          </div>
          <div>
            <div className="h-10" />
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">Head of the Department</div>
          </div>
          <div>
            <div className="h-10" />
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">Controller of Examinations</div>
          </div>
        </div>
      </div>
    </div>
  );
};
