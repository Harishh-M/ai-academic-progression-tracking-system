import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  Printer,
  GraduationCap,
  ShieldCheck,
  Award,
  CalendarCheck,
  BookOpen,
  Info,
  CheckCircle2,
  Filter,
  Layers,
  ChevronRight,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const StudentReportsView: React.FC = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

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
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Compiling Institutional Grade Report & Transcripts...
        </p>
      </div>
    );
  }

  const { student, metrics, semesterResults = [], semesters = [], currentSemesterNumber = 4 } = report;

  // Build map of semesters
  const semesterMap = new Map<string, any>(semesters.map((s: any) => [s.id, s]));

  // Group all results by semester number
  const groupedBySemester: Record<
    number,
    {
      semMeta: any;
      courses: any[];
      sgpa: number;
      totalCredits: number;
      earnedCredits: number;
      passedCount: number;
      failedCount: number;
      cumulativePointsSoFar: number;
      cumulativeCreditsSoFar: number;
      cumulativeCgpaSoFar: number;
    }
  > = {};

  semesterResults.forEach((sr: any) => {
    const sem = semesterMap.get(sr.semester_id);
    const semNum = sem ? sem.semester_number : parseInt(sr.semester_id?.replace(/\D/g, '') || '0', 10);

    if (semNum > 0) {
      if (!groupedBySemester[semNum]) {
        groupedBySemester[semNum] = {
          semMeta: sem || {
            semester_number: semNum,
            academic_year: sr.academic_year || '2024-25',
            semester_type: semNum % 2 === 1 ? 'Odd' : 'Even',
          },
          courses: [],
          sgpa: 0,
          totalCredits: 0,
          earnedCredits: 0,
          passedCount: 0,
          failedCount: 0,
          cumulativePointsSoFar: 0,
          cumulativeCreditsSoFar: 0,
          cumulativeCgpaSoFar: 0,
        };
      }
      groupedBySemester[semNum].courses.push(sr);
    }
  });

  const sortedSemNumbers = Object.keys(groupedBySemester)
    .map(Number)
    .sort((a, b) => a - b);

  // Compute SGPA and running cumulative CGPA for each semester
  let cumulativePoints = 0;
  let cumulativeCredits = 0;

  sortedSemNumbers.forEach((semNum) => {
    const semGroup = groupedBySemester[semNum];
    let semPoints = 0;
    let semCredits = 0;
    let semEarned = 0;
    let passed = 0;
    let failed = 0;

    semGroup.courses.forEach((c: any) => {
      const cr = Number(c.credits) || 0;
      const gp = Number(c.grade_point) || 0;
      semCredits += cr;
      semPoints += cr * gp;
      if (c.result_status === 'Pass' && gp > 0) {
        semEarned += cr;
        passed++;
      } else {
        failed++;
      }
    });

    semGroup.totalCredits = semCredits;
    semGroup.earnedCredits = semEarned;
    semGroup.passedCount = passed;
    semGroup.failedCount = failed;
    semGroup.sgpa = semCredits > 0 ? parseFloat((semPoints / semCredits).toFixed(2)) : 0;

    cumulativePoints += semPoints;
    cumulativeCredits += semCredits;

    semGroup.cumulativePointsSoFar = cumulativePoints;
    semGroup.cumulativeCreditsSoFar = cumulativeCredits;
    semGroup.cumulativeCgpaSoFar =
      cumulativeCredits > 0 ? parseFloat((cumulativePoints / cumulativeCredits).toFixed(2)) : 0;
  });

  const cumulativeOverallCGPA =
    cumulativeCredits > 0 ? parseFloat((cumulativePoints / cumulativeCredits).toFixed(2)) : metrics?.cgpa || 0;

  const toRoman = (num: number) => {
    const romans = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    return romans[num] || num.toString();
  };

  // Determine which semesters to show based on user's semester selection
  const isSingleSem = selectedSemester !== 'all';
  const selectedSemNum = Number(selectedSemester);
  const displayedSemNumbers = isSingleSem
    ? sortedSemNumbers.filter((n) => n === selectedSemNum)
    : sortedSemNumbers;

  const singleSemGroup = isSingleSem ? groupedBySemester[selectedSemNum] : null;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Official Academic Progress Transcript & Grade Reports</h1>
          <p className="text-xs text-slate-500">
            Certified institutional grade sheet and cumulative progress report for all completed terms
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#16304F] text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              {isSingleSem ? `Print Semester ${toRoman(selectedSemNum)} Report` : 'Print Consolidated Transcript'}
            </span>
          </button>
        </div>
      </div>

      {/* SEMESTER SELECTOR TOOLBAR (Prominently Above the Report) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#1E3A5F]" />
            <span>Select Semester View:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* All Semesters Pill */}
            <button
              onClick={() => setSelectedSemester('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedSemester === 'all'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>All Semesters (Consolidated)</span>
            </button>

            {/* Individual Semester Pills */}
            {sortedSemNumbers.map((semNum) => {
              const isSelected = selectedSemester === semNum.toString();
              const group = groupedBySemester[semNum];
              return (
                <button
                  key={semNum}
                  onClick={() => setSelectedSemester(semNum.toString())}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#1E3A5F] text-white shadow-xs ring-2 ring-blue-400/40'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>Semester {toRoman(semNum)}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    SGPA {group.sgpa.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Filter:</span>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-slate-800"
          >
            <option value="all">Consolidated (All Semesters)</option>
            {sortedSemNumbers.map((s) => (
              <option key={s} value={s.toString()}>
                Semester {s} (Sem {toRoman(s)}) — {groupedBySemester[s]?.courses?.length || 0} Courses
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Printable Official Document Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 space-y-6 text-slate-800 font-sans">
        {/* University Header */}
        <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
          <div className="w-12 h-12 rounded-xl bg-[#1E3A5F] text-white flex items-center justify-center mx-auto mb-2 print:border">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight uppercase text-slate-900">
            State Technological University
          </h2>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Office of the Controller of Examinations
          </h3>
          <p className="text-xs text-slate-500">
            Autonomous Institution Affiliated to State Technological University • NAAC 'A+' Grade
          </p>

          {/* Dynamic Document Title based on Selected Semester */}
          <div className="inline-block mt-2 px-3 py-1 bg-slate-100 rounded text-xs font-bold uppercase tracking-wider text-slate-800 border border-slate-200">
            {isSingleSem && singleSemGroup
              ? `OFFICIAL SEMESTER ${toRoman(selectedSemNum)} GRADE PERFORMANCE REPORT & CARD`
              : 'OFFICIAL CONSOLIDATED SEMESTER-WISE GRADE TRANSCRIPT'}
          </div>

          {isSingleSem && singleSemGroup && (
            <p className="text-[11px] text-slate-500 font-semibold pt-1">
              Academic Year: {singleSemGroup.semMeta.academic_year} • {singleSemGroup.semMeta.semester_type} Session
            </p>
          )}
        </div>

        {/* Student Demographic Dossier Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Student Name</span>
            <span className="font-bold text-slate-900 text-sm">{student.student_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Register Number</span>
            <span className="font-mono font-bold text-[#1E3A5F] text-sm">{student.register_number}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Degree Programme</span>
            <span className="font-semibold text-slate-900">{student.programme}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Branch & Code</span>
            <span className="font-semibold text-slate-900">{student.branch_code} • {student.department}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Batch</span>
            <span className="font-medium text-slate-800">{student.batch}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Academic Bank of Credits</span>
            <span className="font-mono text-slate-800 font-semibold">{student.abc_id || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Report Scope</span>
            <span className="font-bold text-[#1E3A5F]">
              {isSingleSem ? `Semester ${toRoman(selectedSemNum)} Alone` : 'Consolidated (All Semesters)'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
              {isSingleSem ? `Cumulative CGPA (Thru Sem ${toRoman(selectedSemNum)})` : 'Cumulative CGPA'}
            </span>
            <span className="font-extrabold text-[#1E3A5F] text-sm">
              {isSingleSem && singleSemGroup
                ? `${singleSemGroup.cumulativeCgpaSoFar.toFixed(2)} / 10.0`
                : `${cumulativeOverallCGPA.toFixed(2)} / 10.0`}
            </span>
          </div>
        </div>

        {/* Semester-Wise Examination Grade Ledger */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-1 border-b border-slate-300">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {isSingleSem
                ? `I. Semester ${toRoman(selectedSemNum)} Course Grade Performance Ledger`
                : 'I. Semester-Wise Course Grade Performance Ledger'}
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              {isSingleSem
                ? `Showing Semester ${selectedSemNum} Records (${singleSemGroup?.courses?.length || 0} Courses)`
                : `Showing ${displayedSemNumbers.length} Completed Semesters`}
            </span>
          </div>

          {displayedSemNumbers.length > 0 ? (
            displayedSemNumbers.map((semNum) => {
              const group = groupedBySemester[semNum];
              if (!group) return null;
              const meta = group.semMeta;

              return (
                <div key={semNum} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  {/* Semester Header */}
                  <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#1E3A5F] text-white font-extrabold text-[11px]">
                        SEM {toRoman(semNum)}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        Semester {semNum} ({meta.academic_year} • {meta.semester_type} Session)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className="text-slate-600">
                        Credits Earned: <strong className="text-slate-900">{group.earnedCredits} / {group.totalCredits}</strong>
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-[#3F7D58] border border-emerald-200 font-bold">
                        SGPA: {group.sgpa.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Courses Table */}
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-2.5 border-r border-slate-200 w-28">Course Code</th>
                        <th className="p-2.5 border-r border-slate-200">Course Title</th>
                        <th className="p-2.5 text-center border-r border-slate-200 w-20">Credits</th>
                        <th className="p-2.5 text-center border-r border-slate-200 w-20">Letter Grade</th>
                        <th className="p-2.5 text-center border-r border-slate-200 w-24">Grade Point</th>
                        <th className="p-2.5 text-center w-24">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {group.courses.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-mono font-bold text-slate-900 border-r border-slate-200">
                            {c.courseCode}
                          </td>
                          <td className="p-2.5 border-r border-slate-200 font-medium">
                            {c.courseName}
                          </td>
                          <td className="p-2.5 text-center font-medium border-r border-slate-200">
                            {c.credits}
                          </td>
                          <td className="p-2.5 text-center font-bold border-r border-slate-200">
                            <span
                              className={
                                c.grade === 'O' || c.grade === 'A+'
                                  ? 'text-[#3F7D58]'
                                  : c.grade === 'U'
                                  ? 'text-[#B94A48]'
                                  : 'text-slate-900'
                              }
                            >
                              {c.grade}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-mono border-r border-slate-200">
                            {c.grade_point}
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            <span className={c.result_status === 'Pass' ? 'text-[#3F7D58]' : 'text-[#B94A48]'}>
                              {c.result_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              No examination records found for the selected semester.
            </div>
          )}
        </div>

        {/* Academic Summary Section (Adapts to Single Semester vs All Semesters) */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-200">
            {isSingleSem && singleSemGroup
              ? `II. Semester ${toRoman(selectedSemNum)} Term Standing & Performance Summary`
              : 'II. Cumulative Academic Standing Summary'}
          </h4>

          {isSingleSem && singleSemGroup ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div>
                <span className="text-slate-500 block text-[11px]">Semester {selectedSemNum} Registered Credits</span>
                <span className="font-bold text-slate-900 text-sm">{singleSemGroup.totalCredits}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Semester {selectedSemNum} Earned Credits</span>
                <span className="font-bold text-[#3F7D58] text-sm">{singleSemGroup.earnedCredits}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Semester {selectedSemNum} SGPA</span>
                <span className="font-extrabold text-[#1E3A5F] text-base">{singleSemGroup.sgpa.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Semester Clearance Outcome</span>
                <span
                  className={`font-bold text-xs ${
                    singleSemGroup.failedCount === 0 ? 'text-[#3F7D58]' : 'text-rose-600'
                  }`}
                >
                  {singleSemGroup.failedCount === 0
                    ? '100% Cleared (All Pass)'
                    : `${singleSemGroup.failedCount} Arrear Pending`}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div>
                <span className="text-slate-500 block text-[11px]">Total Credits Registered</span>
                <span className="font-bold text-slate-900 text-sm">{cumulativeCredits}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Total Credits Earned</span>
                <span className="font-bold text-[#3F7D58] text-sm">
                  {Object.values(groupedBySemester).reduce((acc, g) => acc + g.earnedCredits, 0)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Cumulative CGPA</span>
                <span className="font-extrabold text-[#1E3A5F] text-base">{cumulativeOverallCGPA.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Institutional Standing</span>
                <span className="font-bold text-[#3F7D58] text-xs">
                  {cumulativeOverallCGPA >= 8.5
                    ? 'First Class with Distinction'
                    : cumulativeOverallCGPA >= 6.5
                    ? 'First Class'
                    : 'Pass Division'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Official Endorsement & Verification Footer */}
        <div className="pt-10 border-t-2 border-slate-300 grid grid-cols-2 text-xs">
          <div className="space-y-1">
            <p className="text-slate-500 font-medium">
              Date of Issue: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-slate-400 font-mono text-[11px]">
              Authentication Code: ERP-TRANSCRIPT-{student.id?.toUpperCase()}-
              {isSingleSem ? `S${selectedSemNum}` : `ALL`}
            </p>
            <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Digitally verified through University Academic ERP</span>
            </div>
          </div>
          <div className="text-right space-y-6">
            <div className="h-6" />
            <div className="border-t border-slate-400 inline-block pt-1.5 w-52 text-center font-bold text-slate-900">
              Controller of Examinations
              <span className="block text-[10px] text-slate-500 font-normal">State Technological University</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
