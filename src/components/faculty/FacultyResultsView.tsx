import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api.js';
import { Course, Semester, SemesterResultRecord, GradeType } from '../../types/index.js';
import { GradeChip } from '../common/GradeChip.js';
import {
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  Lock,
  Layers,
  Users,
} from 'lucide-react';

export const FacultyResultsView: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<SemesterResultRecord[]>([]);
  const [selectedSemId, setSelectedSemId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'course' | 'cohort'>('course');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getSemesters(), api.getCourses(), api.getStudents()])
      .then(([semList, courseList, stuList]) => {
        setSemesters(semList);
        setCourses(courseList);
        setStudents(stuList);
        if (semList.length > 0) setSelectedSemId(semList[0].id);
        if (courseList.length > 0) setSelectedCourseId(courseList[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedSem = semesters.find((s) => s.id === selectedSemId);

  // Filter courses for the selected semester
  const semCourses = useMemo(() => {
    if (!selectedSem) return courses;
    const match = courses.filter((c) => c.semester_number === selectedSem.semester_number);
    return match.length > 0 ? match : courses;
  }, [courses, selectedSem]);

  // Sync selectedCourseId when semester changes
  useEffect(() => {
    if (semCourses.length > 0) {
      if (!semCourses.some((c) => c.id === selectedCourseId)) {
        setSelectedCourseId(semCourses[0].id);
      }
    }
  }, [selectedSemId, semCourses, selectedCourseId]);

  // Fetch results when semester changes
  useEffect(() => {
    if (selectedSemId) {
      api
        .getResults({ semesterId: selectedSemId })
        .then((resList) => {
          setResults(resList);
        })
        .catch(console.error);
    }
  }, [selectedSemId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Filter results for selected semester & course
  const currentCourseResults = results.filter(
    (r) => r.semester_id === selectedSemId && r.course_id === selectedCourseId
  );

  const resultMap = new Map<string, SemesterResultRecord>(
    currentCourseResults.map((r) => [r.student_id, r])
  );

  // Grade Counts for the distribution bar
  const gradeCounts: Record<string, number> = { O: 0, 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, U: 0 };
  let gradedCount = 0;
  let passCount = 0;

  currentCourseResults.forEach((r) => {
    if (r.grade && gradeCounts[r.grade] !== undefined) {
      gradeCounts[r.grade]++;
      gradedCount++;
      if (r.result_status === 'Pass' || r.grade_point > 0) {
        passCount++;
      }
    }
  });

  const passRate = gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#1E3A5F]" />
            Official Semester Examination Results Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Read-only verified semester grade sheets, SGPA/CGPA evaluation outcomes, and published academic records
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 self-start sm:self-auto">
          <Lock className="w-4 h-4 text-amber-600" />
          <span>Staff View (Read-Only)</span>
        </div>
      </div>

      {/* Statutory Governance Alert */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-bold block text-amber-900">
              Statutory Governance: Semester End Marks Governed by Controller of Examinations (COE)
            </span>
            <span className="text-amber-800">
              Teaching staff and faculty are not permitted to alter semester end marks or publish semester results. Only the Controller of Examinations (COE) has authority to alter or approve semester end marks. Teaching staff can enter and manage continuous assessments in the <strong className="text-amber-950 font-semibold">Internal Marks</strong> module.
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100/70 border border-amber-300 text-amber-800 font-bold text-[11px] shrink-0 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          <span>COE Exclusive Authority</span>
        </div>
      </div>

      {/* View Mode Tabs & Selectors */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Display Mode:</span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
              <button
                onClick={() => setViewMode('course')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'course'
                    ? 'bg-[#1E3A5F] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Course Grade Ledger</span>
              </button>
              <button
                onClick={() => setViewMode('cohort')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'cohort'
                    ? 'bg-[#1E3A5F] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Cohort Semester SGPA Summary</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] font-semibold text-slate-500">
            {semCourses.length} Courses available in Semester {selectedSem?.semester_number || 1}
          </div>
        </div>

        <div className={`grid grid-cols-1 ${viewMode === 'course' ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4`}>
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#1E3A5F]" />
              <span>Select Semester Examination</span>
            </label>
            <select
              id="select-results-semester"
              value={selectedSemId}
              onChange={(e) => setSelectedSemId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:bg-white transition"
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  Semester {s.semester_number} ({s.academic_year} - {s.semester_type})
                </option>
              ))}
            </select>
          </div>

          {viewMode === 'course' && (
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#1E3A5F]" />
                <span>Select Course (Semester {selectedSem?.semester_number || 1})</span>
              </label>
              <select
                id="select-results-course"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:bg-white transition"
              >
                {semCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_code} - {c.course_name} ({c.credits} Credits)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'course' ? (
        <>
          {/* Grade Distribution Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Course Grade Distribution • Official Pass Rate: <strong className="text-[#3F7D58]">{passRate}%</strong>
              </span>
              <span className="text-xs text-slate-400">
                Evaluated by COE: {gradedCount} / {students.length} Enrolled
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {(['O', 'A+', 'A', 'B+', 'B', 'C', 'U'] as GradeType[]).map((g) => (
                <div
                  key={g}
                  className={`p-2.5 rounded-xl border ${
                    g === 'U'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-extrabold text-sm">{g}</div>
                  <div className="text-[11px] font-bold mt-0.5">{gradeCounts[g] || 0}</div>
                  <div className="text-[10px] text-slate-400 uppercase">
                    {g === 'O'
                      ? 'Outstanding'
                      : g === 'U'
                      ? 'Reappear'
                      : g === 'A+' || g === 'A'
                      ? 'Honors'
                      : 'Pass'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Course Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {selectedCourse?.course_code} — {selectedCourse?.course_name}
                </span>
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  {students.length} Registered Students
                </span>
              </div>

              <span className="text-xs text-slate-400">
                Course Credits: {selectedCourse?.credits || 3}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Register Number</th>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3 text-center">Letter Grade</th>
                    <th className="px-5 py-3 text-center">Earned Grade Point</th>
                    <th className="px-5 py-3 text-center">Credit Points (GP × Credits)</th>
                    <th className="px-5 py-3 text-center">Examination Result</th>
                    <th className="px-5 py-3 text-center">Publication Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((s) => {
                    const res = resultMap.get(s.id);
                    const credits = selectedCourse?.credits || 3;
                    const hasResult = !!res;
                    const grade = res ? res.grade : null;
                    const gp = res ? res.grade_point : 0;
                    const creditPoints = gp * credits;
                    const isPass = res ? (res.result_status === 'Pass' || gp > 0) : false;
                    const isPublished = res && !!res.published_date;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 font-mono font-bold text-[#1E3A5F]">{s.register_number}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-900">{s.student_name}</td>
                        <td className="px-5 py-3.5 text-center">
                          {grade ? (
                            <GradeChip grade={grade} />
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Pending COE</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-900">
                          {hasResult ? gp.toFixed(1) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono font-bold text-[#1E3A5F]">
                          {hasResult ? creditPoints.toFixed(1) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {hasResult ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                                isPass
                                  ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                                  : 'bg-red-50 text-[#B94A48] border-red-200'
                              }`}
                            >
                              {isPass ? 'Pass' : 'Reappear (Arrear)'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Under Review</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Published</span>
                            </span>
                          ) : hasResult ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Awaiting Publication</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Draft</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Cohort Semester Summary Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Semester {selectedSem?.semester_number} Cohort SGPA & Academic Performance Summary
              </span>
              <span className="text-[11px] text-slate-500">
                Official verified semester end grade rolls • {students.length} Students Listed
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold">
              {selectedSem?.academic_year} ({selectedSem?.semester_type})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Register Number</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3 text-center">Registered Credits</th>
                  <th className="px-5 py-3 text-center">Earned Credits</th>
                  <th className="px-5 py-3 text-center">Semester SGPA</th>
                  <th className="px-5 py-3 text-center">Course Clearances</th>
                  <th className="px-5 py-3 text-center">Overall Standing</th>
                  <th className="px-5 py-3 text-center">COE Certification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((s) => {
                  const studentResults = results.filter((r) => r.student_id === s.id && r.semester_id === selectedSemId);
                  let totalCr = 0;
                  let earnedCr = 0;
                  let totalPts = 0;
                  let arrears = 0;

                  studentResults.forEach((r) => {
                    const cr = Number(r.credits) || 0;
                    const gp = Number(r.grade_point) || 0;
                    totalCr += cr;
                    totalPts += cr * gp;
                    if (r.result_status === 'Pass' && gp > 0) {
                      earnedCr += cr;
                    } else {
                      arrears++;
                    }
                  });

                  const sgpa = totalCr > 0 ? parseFloat((totalPts / totalCr).toFixed(2)) : 0;
                  const hasData = studentResults.length > 0;
                  const isCleared = hasData && arrears === 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#1E3A5F]">{s.register_number}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{s.student_name}</td>
                      <td className="px-5 py-3.5 text-center font-mono font-semibold">{hasData ? totalCr : '—'}</td>
                      <td className="px-5 py-3.5 text-center font-mono font-semibold text-emerald-700">
                        {hasData ? earnedCr : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-sm text-[#1E3A5F]">
                        {hasData ? `${sgpa.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {hasData ? (
                          <span className="text-[11px] text-slate-600">
                            {studentResults.length - arrears} / {studentResults.length} Passed
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No records</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {hasData ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                              isCleared
                                ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                                : 'bg-red-50 text-[#B94A48] border-red-200'
                            }`}
                          >
                            {isCleared ? 'All Cleared' : `${arrears} Arrear(s)`}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>COE Certified</span>
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
