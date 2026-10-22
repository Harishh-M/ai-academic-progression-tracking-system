import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { InternalMarkRecord, Course, Semester } from '../../types/index.js';
import {
  ShieldCheck,
  Award,
  BookOpen,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Printer,
  ChevronRight,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  Lock,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface ProcessedCourseMarks {
  courseId: string;
  course: Course;
  iat1?: InternalMarkRecord;
  iat2?: InternalMarkRecord;
  totalObtained: number;
  totalMax: number;
  totalPct: number;
  status: 'Distinction' | 'First Class' | 'Passing' | 'Need Improvement';
}

export const StudentMarksView: React.FC = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState<InternalMarkRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('5'); // Default to Sem 5 (current studying semester)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.studentId) {
      setLoading(true);
      Promise.all([
        api.getMarks(user.studentId),
        api.getCourses(),
        api.getSemesters(),
      ])
        .then(([marksList, courseList, semList]) => {
          setMarks(marksList);
          setCourses(courseList);
          setSemesters(semList);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.studentId]);

  const courseMap = useMemo(() => new Map<string, Course>(courses.map((c) => [c.id, c])), [courses]);
  const semesterMap = useMemo(() => new Map<number, Semester>(semesters.map((s) => [s.semester_number, s])), [semesters]);

  // Determine current studying semester of the student
  // Defaults to 5 based on institutional enrollment
  const currentStudyingSemester = useMemo(() => {
    let maxSem = 1;
    marks.forEach((m) => {
      const c = courseMap.get(m.course_id);
      if (c?.semester_number && c.semester_number > maxSem) {
        maxSem = c.semester_number;
      }
    });
    return Math.min(8, Math.max(1, maxSem || 5));
  }, [marks, courseMap]);

  // Group marks by course
  const courseMarksMap = useMemo(() => {
    const map = new Map<string, InternalMarkRecord[]>();
    marks.forEach((m) => {
      if (!map.has(m.course_id)) map.set(m.course_id, []);
      map.get(m.course_id)!.push(m);
    });
    return map;
  }, [marks]);

  // Group processed courses by semester_number (1 to 8)
  const semesterCoursesMap = useMemo(() => {
    const map = new Map<number, ProcessedCourseMarks[]>();
    for (let sem = 1; sem <= 8; sem++) {
      map.set(sem, []);
    }

    courseMarksMap.forEach((courseMarks, courseId) => {
      const c = courseMap.get(courseId);
      if (!c) return;

      const semNum = c.semester_number || 1;
      const iat1 = courseMarks.find(
        (m) =>
          (m.assessment_type as any) === 'IAT1' ||
          m.assessment_name?.toLowerCase().includes('test 1') ||
          m.assessment_name?.toLowerCase().includes('iat 1') ||
          m.assessment_name?.toLowerCase().includes('iat1')
      );
      const iat2 = courseMarks.find(
        (m) =>
          (m.assessment_type as any) === 'IAT2' ||
          m.assessment_name?.toLowerCase().includes('test 2') ||
          m.assessment_name?.toLowerCase().includes('iat 2') ||
          m.assessment_name?.toLowerCase().includes('iat2')
      );

      const totalObtained = courseMarks.reduce((acc, m) => acc + m.marks_obtained, 0);
      const totalMax = courseMarks.reduce((acc, m) => acc + m.maximum_marks, 0);
      const totalPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;

      let status: 'Distinction' | 'First Class' | 'Passing' | 'Need Improvement' = 'Passing';
      if (totalPct >= 75) status = 'Distinction';
      else if (totalPct >= 60) status = 'First Class';
      else if (totalPct >= 50) status = 'Passing';
      else status = 'Need Improvement';

      const processed: ProcessedCourseMarks = {
        courseId,
        course: c,
        iat1,
        iat2,
        totalObtained,
        totalMax,
        totalPct,
        status,
      };

      if (!map.has(semNum)) map.set(semNum, []);
      map.get(semNum)!.push(processed);
    });

    // Sort courses in each semester by course code
    map.forEach((list) => {
      list.sort((a, b) => a.course.course_code.localeCompare(b.course.course_code));
    });

    return map;
  }, [courseMarksMap, courseMap]);

  // Semesters list 1 to 8 with stats and freeze flag
  const semesterOverview = useMemo(() => {
    return Array.from({ length: 8 }, (_, idx) => {
      const semNum = idx + 1;
      const semObj = semesterMap.get(semNum);
      const isCurrent = semNum === currentStudyingSemester;
      const isCompleted = semNum < currentStudyingSemester;
      const isFreezed = semNum > currentStudyingSemester;

      const coursesList = isFreezed ? [] : semesterCoursesMap.get(semNum) || [];
      const totalObtained = coursesList.reduce((acc, c) => acc + c.totalObtained, 0);
      const totalMax = coursesList.reduce((acc, c) => acc + c.totalMax, 0);
      const avgPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;

      return {
        semesterNumber: semNum,
        semesterId: semObj?.id || `sem_${semNum}`,
        academicYear: semObj?.academic_year || (semNum <= 2 ? '2024-25' : semNum <= 4 ? '2025-26' : semNum <= 6 ? '2026-27' : '2027-28'),
        semesterType: semObj?.semester_type || (semNum % 2 !== 0 ? 'Odd' : 'Even'),
        courseCount: coursesList.length,
        avgPct,
        totalObtained,
        totalMax,
        isCurrent,
        isCompleted,
        isFreezed,
      };
    });
  }, [semesterMap, semesterCoursesMap, currentStudyingSemester]);

  // Check if currently selected single semester is freezed
  const isSelectedSemesterFreezed = useMemo(() => {
    if (selectedSemester === 'all') return false;
    const semNum = parseInt(selectedSemester, 10);
    return !isNaN(semNum) && semNum > currentStudyingSemester;
  }, [selectedSemester, currentStudyingSemester]);

  // Filtered displayed semesters (In "All Sem", only include up to current semester!)
  const activeSemestersList = useMemo(() => {
    if (selectedSemester === 'all') {
      // Only show up to current studying semester, rest are freezed!
      return Array.from({ length: currentStudyingSemester }, (_, i) => i + 1);
    }
    const num = parseInt(selectedSemester, 10);
    return isNaN(num) ? [currentStudyingSemester] : [num];
  }, [selectedSemester, currentStudyingSemester]);

  // Overall statistics for active selection (only non-freezed courses)
  const activeStats = useMemo(() => {
    const targetCourses = activeSemestersList
      .filter((sem) => sem <= currentStudyingSemester)
      .flatMap((sem) => semesterCoursesMap.get(sem) || []);

    const filtered = targetCourses.filter(
      (item) =>
        item.course.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.course.course_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalObtained = filtered.reduce((acc, c) => acc + c.totalObtained, 0);
    const totalMax = filtered.reduce((acc, c) => acc + c.totalMax, 0);
    const avgPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
    const distinctionCount = filtered.filter((c) => c.status === 'Distinction').length;
    const totalAssessments = filtered.reduce((acc, c) => acc + (c.iat1 ? 1 : 0) + (c.iat2 ? 1 : 0), 0);

    return {
      filteredCoursesCount: filtered.length,
      totalObtained,
      totalMax,
      avgPct,
      distinctionCount,
      totalAssessments,
    };
  }, [activeSemestersList, currentStudyingSemester, semesterCoursesMap, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-9 h-9 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
        <span className="mt-3 text-xs font-semibold text-slate-500">Loading continuous assessment ledger...</span>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#1E3A5F] text-white uppercase tracking-wider">
              CIA Portal
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Currently Studying in Semester {currentStudyingSemester}
            </span>
            <span className="text-xs font-medium text-slate-500 hidden md:inline">
              • Semesters {currentStudyingSemester + 1} to 8 Freezed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Continuous Internal Assessment (CIA) Marks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Internal test assessments, lab evaluations, and continuous performance scores (Sem 1 to {currentStudyingSemester})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer"
            title="Print or save PDF mark sheet"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Print Mark Sheet</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#3F7D58]" />
            <span>Faculty Certified CIA Scores</span>
          </div>
        </div>
      </div>

      {/* 2. Semester Selection Tabs (1 to 8 with Freezed States) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1E3A5F]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Semester Section (1 to 8)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-500 font-medium hidden sm:inline">
              Active: <strong className="text-slate-800">Sem {currentStudyingSemester}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Sem {currentStudyingSemester + 1}–8 Freezed</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
          {/* All Accessible Semesters (1 to current) */}
          <button
            type="button"
            onClick={() => setSelectedSemester('all')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition cursor-pointer ${
              selectedSemester === 'all'
                ? 'bg-[#1E3A5F] text-white shadow-sm ring-2 ring-[#1E3A5F]/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <span className="text-xs font-bold">Sem 1–{currentStudyingSemester}</span>
            <span className={`text-[10px] font-mono mt-0.5 ${selectedSemester === 'all' ? 'text-blue-100' : 'text-slate-500'}`}>
              Active ({currentStudyingSemester})
            </span>
          </button>

          {/* 8 Semester Tabs */}
          {semesterOverview.map((sem) => {
            const isSelected = selectedSemester === String(sem.semesterNumber);
            const isFreezed = sem.isFreezed;

            return (
              <button
                key={sem.semesterNumber}
                type="button"
                onClick={() => setSelectedSemester(String(sem.semesterNumber))}
                className={`relative flex flex-col items-center justify-center p-2 rounded-xl text-center transition cursor-pointer ${
                  isFreezed
                    ? isSelected
                      ? 'bg-slate-200 border border-slate-400 text-slate-700 shadow-2xs'
                      : 'bg-slate-100/60 text-slate-400 hover:bg-slate-100 border border-dashed border-slate-300'
                    : isSelected
                    ? 'bg-[#1E3A5F] text-white shadow-sm ring-2 ring-[#1E3A5F]/20'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                }`}
                title={isFreezed ? `Semester ${sem.semesterNumber} is Freezed (Student is studying in Semester ${currentStudyingSemester})` : undefined}
              >
                {sem.isCurrent && (
                  <span
                    className={`absolute -top-1.5 px-1 py-0.2 text-[8px] font-extrabold uppercase rounded shadow-2xs ${
                      isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    Studying
                  </span>
                )}

                <div className="flex items-center gap-1">
                  {isFreezed && <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />}
                  <span className={`text-xs font-bold ${isFreezed && !isSelected ? 'text-slate-400' : ''}`}>
                    Sem {sem.semesterNumber}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-mono mt-0.5 ${
                    isFreezed
                      ? 'text-slate-400 italic'
                      : isSelected
                      ? 'text-blue-100 font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  {isFreezed ? 'Freezed' : sem.avgPct > 0 ? `${sem.avgPct}%` : '5 Crs'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Performance Summary Overview Banner (Only shown when viewing active/unfreezed content) */}
      {!isSelectedSemesterFreezed && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E3A5F] shrink-0 font-bold">
              <Award className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Average CIA Score</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{activeStats.avgPct}%</span>
                <span className="text-[10px] text-emerald-600 font-bold">Evaluated</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#3F7D58] shrink-0 font-bold">
              <CheckCircle2 className="w-5 h-5 text-[#3F7D58]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Marks Scored</span>
              <div className="text-xl font-black text-slate-900">
                {activeStats.totalObtained}{' '}
                <span className="text-xs text-slate-400 font-normal">/ {activeStats.totalMax}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 font-bold">
              <BookOpen className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Courses Evaluated</span>
              <div className="text-2xl font-black text-slate-900">{activeStats.filteredCoursesCount}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 font-bold">
              <FileSpreadsheet className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Internal Assessments</span>
              <div className="text-2xl font-black text-slate-900">
                {activeStats.totalAssessments}{' '}
                <span className="text-xs text-slate-400 font-normal">Tests (IAT 1 & 2)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter, Search & View Controls Bar (Only shown when not on a freezed single semester) */}
      {!isSelectedSemesterFreezed && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active courses by code (e.g. S1BM01, S5BM01) or name..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition"
            />
          </div>

          <div className="flex items-center gap-2 justify-end">
            <span className="text-xs text-slate-500 font-medium mr-1">Display:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#1E3A5F] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Assessment Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#1E3A5F] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Mark Sheet Ledger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Main Mark Sections */}
      {isSelectedSemesterFreezed ? (
        /* FREEZED SCREEN for Semesters > 5 */
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 sm:p-14 text-center shadow-2xs space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500 shadow-2xs">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Future Academic Term • Freezed</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Semester {selectedSemester} is Currently Freezed
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              This student is actively studying in <strong className="text-slate-800 font-bold">Semester {currentStudyingSemester}</strong>.
              Continuous internal assessments and evaluations for <strong className="text-slate-800 font-bold">Semester {selectedSemester}</strong> have not commenced and are frozen by institutional academic progression policy.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedSemester(String(currentStudyingSemester))}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A5F] text-white text-xs font-bold hover:bg-[#16304F] transition shadow-xs cursor-pointer"
            >
              <span>View Current Semester (Sem {currentStudyingSemester})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester('all')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition border border-slate-200 cursor-pointer"
            >
              <span>View Completed Semesters (1–{currentStudyingSemester})</span>
            </button>
          </div>
        </div>
      ) : (
        /* UNFREEZED ACTIVE SEMESTERS (Semesters 1 to currentStudyingSemester) */
        <div className="space-y-8">
          {activeSemestersList.map((semNum) => {
            const semMeta = semesterOverview.find((s) => s.semesterNumber === semNum);
            const allCoursesInSem = semesterCoursesMap.get(semNum) || [];
            const filteredCourses = allCoursesInSem.filter(
              (item) =>
                item.course.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.course.course_code.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredCourses.length === 0 && searchQuery) {
              return null;
            }

            return (
              <div key={semNum} className="space-y-4">
                {/* Semester Section Heading Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b-2 border-slate-200 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] text-white flex items-center justify-center text-xs font-black">
                      S{semNum}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-extrabold text-slate-900">
                          Semester {semNum} Continuous Assessment
                        </h2>
                        {semMeta?.isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                            Current Academic Session
                          </span>
                        )}
                        {semMeta?.isCompleted && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            Completed Term
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {semMeta?.academicYear} Academic Year • {semMeta?.semesterType} Semester • 2 Internal Tests (IAT 1 & IAT 2)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Semester Average</span>
                      <span className="text-sm font-black text-[#1E3A5F]">{semMeta?.avgPct || 0}%</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Courses</span>
                      <span className="text-sm font-black text-slate-900">{filteredCourses.length} Courses</span>
                    </div>
                  </div>
                </div>

                {/* View Mode: CARDS (2 per row like the UI screenshot) */}
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredCourses.map((item) => {
                      const { course, iat1, iat2, totalObtained, totalMax, totalPct, status } = item;
                      const iat1Pct = iat1 ? Math.round((iat1.marks_obtained / iat1.maximum_marks) * 100) : 0;
                      const iat2Pct = iat2 ? Math.round((iat2.marks_obtained / iat2.maximum_marks) * 100) : 0;

                      return (
                        <div
                          key={course.id}
                          className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow p-5 space-y-4"
                        >
                          {/* Course Title & Aggregate CIA Header */}
                          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                            <div className="pr-3">
                              <span className="font-mono text-xs font-extrabold text-[#1E3A5F] uppercase tracking-wider block">
                                {course.course_code}
                              </span>
                              <h3 className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-1">
                                {course.course_name}
                              </h3>
                              <span className="text-[11px] text-slate-500">
                                {course.department} • {course.credits} Credits
                              </span>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-xl font-black text-[#1E3A5F] tracking-tight">{totalPct}%</div>
                              <div className="text-[10px] text-slate-500 font-bold font-mono">
                                {totalObtained} / {totalMax} Total
                              </div>
                            </div>
                          </div>

                          {/* Both 2 Internal Assessment Tests (IAT 1 & IAT 2) */}
                          <div className="space-y-2.5">
                            {/* 1. Internal Assessment Test 1 */}
                            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between hover:bg-slate-100/50 transition">
                              <div className="space-y-0.5">
                                <div className="font-bold text-xs text-slate-900">
                                  {iat1?.assessment_name || 'Internal Assessment Test 1'}
                                </div>
                                <div className="text-[10px] font-mono font-semibold text-slate-500">
                                  IAT1 • Maximum Marks: 50
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="font-mono font-black text-slate-900 text-sm">
                                    {iat1 ? iat1.marks_obtained : '—'}
                                  </span>
                                  <span className="text-slate-400 font-mono text-xs font-semibold"> / 50</span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                                    iat1Pct >= 75
                                      ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                                      : iat1Pct >= 60
                                      ? 'bg-blue-50 text-[#3B6EA5] border-blue-200'
                                      : 'bg-red-50 text-[#B94A48] border-red-200'
                                  }`}
                                >
                                  {iat1Pct}%
                                </span>
                              </div>
                            </div>

                            {/* 2. Internal Assessment Test 2 */}
                            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between hover:bg-slate-100/50 transition">
                              <div className="space-y-0.5">
                                <div className="font-bold text-xs text-slate-900">
                                  {iat2?.assessment_name || 'Internal Assessment Test 2'}
                                </div>
                                <div className="text-[10px] font-mono font-semibold text-slate-500">
                                  IAT2 • Maximum Marks: 50
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="font-mono font-black text-slate-900 text-sm">
                                    {iat2 ? iat2.marks_obtained : '—'}
                                  </span>
                                  <span className="text-slate-400 font-mono text-xs font-semibold"> / 50</span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                                    iat2Pct >= 75
                                      ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                                      : iat2Pct >= 60
                                      ? 'bg-blue-50 text-[#3B6EA5] border-blue-200'
                                      : 'bg-red-50 text-[#B94A48] border-red-200'
                                  }`}
                                >
                                  {iat2Pct}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar & Performance Badge */}
                          <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2 flex-1 mr-4">
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    totalPct >= 75
                                      ? 'bg-emerald-500'
                                      : totalPct >= 60
                                      ? 'bg-blue-600'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, totalPct)}%` }}
                                />
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                status === 'Distinction'
                                  ? 'bg-emerald-100/70 text-emerald-800'
                                  : status === 'First Class'
                                  ? 'bg-blue-100/70 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* View Mode: TABLE (Mark Sheet Ledger) */}
                {viewMode === 'table' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-4">S.No</th>
                            <th className="py-3 px-4">Course Code</th>
                            <th className="py-3 px-4">Course Name</th>
                            <th className="py-3 px-3 text-center">Credits</th>
                            <th className="py-3 px-4 text-center">IAT 1 (/50)</th>
                            <th className="py-3 px-4 text-center">IAT 2 (/50)</th>
                            <th className="py-3 px-4 text-center">Total CIA (/100)</th>
                            <th className="py-3 px-4 text-center">Percentage</th>
                            <th className="py-3 px-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCourses.map((item, idx) => {
                            const { course, iat1, iat2, totalObtained, totalPct, status } = item;
                            return (
                              <tr key={course.id} className="hover:bg-slate-50/70 transition">
                                <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                                <td className="py-3 px-4 font-mono font-bold text-[#1E3A5F]">
                                  {course.course_code}
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                                  <div>{course.course_name}</div>
                                  <div className="text-[10px] text-slate-400 font-normal">{course.department}</div>
                                </td>
                                <td className="py-3 px-3 text-center font-bold text-slate-700">
                                  {course.credits}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="font-mono font-bold text-slate-900">
                                    {iat1 ? iat1.marks_obtained : '—'}
                                  </span>
                                  <span className="text-slate-400 text-[10px]"> / 50</span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="font-mono font-bold text-slate-900">
                                    {iat2 ? iat2.marks_obtained : '—'}
                                  </span>
                                  <span className="text-slate-400 text-[10px]"> / 50</span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="font-mono font-black text-[#1E3A5F]">
                                    {totalObtained}
                                  </span>
                                  <span className="text-slate-400 text-[10px]"> / 100</span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                                      totalPct >= 75
                                        ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                                        : totalPct >= 60
                                        ? 'bg-blue-50 text-[#3B6EA5] border-blue-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}
                                  >
                                    {totalPct}%
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      status === 'Distinction'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : status === 'First Class'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {status}
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
          })}

          {/* Institutional Freezed Notice at the end of All Semesters */}
          {selectedSemester === 'all' && currentStudyingSemester < 8 && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Future Semesters Freezed (Semesters {currentStudyingSemester + 1}–8)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Student is actively studying in Semester {currentStudyingSemester}. Course registrations and CIA test evaluations for future semesters are locked until academic term progression.
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-slate-200/80 text-slate-600 text-[11px] font-bold border border-slate-300 shrink-0">
                🔒 Freezed Term
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

