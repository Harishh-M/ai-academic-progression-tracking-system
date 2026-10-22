import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  SemesterResultRecord,
  Course,
  Semester,
  GradeType,
  Faculty,
  Student,
  InternalMarkRecord,
} from '../../types/index.js';
import { RiskBadge } from '../common/RiskBadge.js';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Search,
  Filter,
  BarChart3,
  Award,
  RefreshCw,
  Sparkles,
  Edit3,
  X,
  Save,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building,
  Users,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  Layers,
  UserCheck,
  TrendingUp,
  BookOpen,
  SlidersHorizontal,
  LayoutGrid,
  Table,
  PlusCircle,
  History,
  ClipboardList,
  Check,
  Calculator,
} from 'lucide-react';

const GRADE_POINTS: Record<string, number> = {
  O: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  U: 0,
};

type EnrichedStudent = Student & {
  cgpa: number;
  currentSGPA: number;
  attendancePercentage: number;
  currentArrears: number;
  riskLevel: string;
  performanceStatus: string;
};

export const COEDashboard: React.FC = () => {
  // Primary Deck Switcher
  const [activeDeckTab, setActiveDeckTab] = useState<'results' | 'departments'>('results');

  // Examination Results state
  const [results, setResults] = useState<SemesterResultRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resultsDeptFilter, setResultsDeptFilter] = useState<string>('all');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Student Inspection (Previous Years Marks Ledger) state
  const [inspectingStudent, setInspectingStudent] = useState<EnrichedStudent | null>(null);
  const [inspectingStudentResults, setInspectingStudentResults] = useState<SemesterResultRecord[]>([]);
  const [inspectingStudentMarks, setInspectingStudentMarks] = useState<InternalMarkRecord[]>([]);
  const [loadingStudentHistory, setLoadingStudentHistory] = useState<boolean>(false);
  const [inspectingActiveTab, setInspectingActiveTab] = useState<'semesters' | 'internals'>('semesters');

  // Mark alteration modal state (COE Exclusive Authority)
  const [editingResult, setEditingResult] = useState<SemesterResultRecord | null>(null);
  const [editGrade, setEditGrade] = useState<GradeType>('A');
  const [editRemarks, setEditRemarks] = useState<string>('Revaluation / Examination Board Scrutiny');
  const [savingAlteration, setSavingAlteration] = useState(false);

  // Enter Upcoming Marks modal state
  const [showEnterUpcomingModal, setShowEnterUpcomingModal] = useState<boolean>(false);
  const [upcomingStudentId, setUpcomingStudentId] = useState<string>('');
  const [upcomingSemesterId, setUpcomingSemesterId] = useState<string>('');
  const [upcomingCourseId, setUpcomingCourseId] = useState<string>('');
  const [upcomingGrade, setUpcomingGrade] = useState<GradeType>('A');
  const [upcomingRawMarks, setUpcomingRawMarks] = useState<string>('');
  const [upcomingCredits, setUpcomingCredits] = useState<number>(4);
  const [upcomingAcademicYear, setUpcomingAcademicYear] = useState<string>('2024-25');
  const [upcomingPublishNow, setUpcomingPublishNow] = useState<boolean>(true);
  const [savingUpcomingMark, setSavingUpcomingMark] = useState<boolean>(false);

  // Department-Wise Directory state
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [deptDirectoryView, setDeptDirectoryView] = useState<'both' | 'students' | 'faculty'>('both');
  const [deptSearch, setDeptSearch] = useState<string>('');
  const [deptBatchFilter, setDeptBatchFilter] = useState<string>('all');
  const [deptStudentPage, setDeptStudentPage] = useState<number>(1);
  const [deptStudentPageSize, setDeptStudentPageSize] = useState<number>(10);
  const [deptFacultyPage, setDeptFacultyPage] = useState<number>(1);
  const [deptFacultyPageSize, setDeptFacultyPageSize] = useState<number>(10);

  const loadData = async (semId?: string) => {
    setLoading(true);
    try {
      const activeSem = semId !== undefined ? semId : selectedSemester;
      const [resData, courseData, semData, studentsData, facultyData] = await Promise.all([
        api.getResults({ semesterId: activeSem !== 'all' ? activeSem : undefined }).catch((e) => {
          console.warn('Failed to load results:', e);
          return [];
        }),
        api.getCourses().catch((e) => {
          console.warn('Failed to load courses:', e);
          return [];
        }),
        api.getSemesters().catch((e) => {
          console.warn('Failed to load semesters:', e);
          return [];
        }),
        api.getStudents().catch((e) => {
          console.error('Failed to load students:', e);
          setNotification({ type: 'error', message: 'Failed to retrieve student records: ' + (e.message || String(e)) });
          return [];
        }),
        api.getFaculty().catch((e) => {
          console.warn('Could not load faculty:', e);
          return [];
        }),
      ]);
      setResults(resData);
      setCourses(courseData);
      setSemesters(semData);
      setStudents(studentsData as EnrichedStudent[]);
      setFaculty(facultyData);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load academic and department records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedSemester);
  }, [selectedSemester]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSemester, statusFilter, resultsDeptFilter, selectedStudentFilter, search, pageSize]);

  useEffect(() => {
    setDeptStudentPage(1);
    setDeptFacultyPage(1);
  }, [selectedDept, deptBatchFilter, deptSearch]);

  const courseMap = React.useMemo(() => new Map<string, Course>(courses.map((c) => [c.id, c])), [courses]);
  const semesterMap = React.useMemo(() => new Map<string, Semester>(semesters.map((s) => [s.id, s])), [semesters]);
  const studentMap = React.useMemo(() => {
    const map = new Map<string, EnrichedStudent>();
    for (const s of students) {
      map.set(String(s.id), s);
      if (s.register_number) {
        map.set(s.register_number, s);
      }
    }
    return map;
  }, [students]);

  // Department List Discovery
  const departmentList = Array.from(
    new Set([
      ...students.map((s) => s.department).filter(Boolean),
      ...faculty.map((f) => f.department).filter(Boolean),
    ])
  ).sort((a, b) => a.localeCompare(b));

  const batchList = Array.from(
    new Set(students.map((s) => s.batch).filter(Boolean))
  ).sort();

  // Results Filtering
  const filteredResults = results.filter((r) => {
    if (selectedSemester !== 'all' && r.semester_id !== selectedSemester) return false;
    if (statusFilter === 'Pass' && r.result_status !== 'Pass') return false;
    if (statusFilter === 'Fail' && r.result_status !== 'Fail') return false;
    if (statusFilter === 'Pending' && r.published_date) return false;
    if (statusFilter === 'Published' && !r.published_date) return false;

    const stu = studentMap.get(r.student_id);
    if (resultsDeptFilter !== 'all' && stu?.department !== resultsDeptFilter) return false;
    if (selectedStudentFilter !== 'all' && r.student_id !== selectedStudentFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const course = courseMap.get(r.course_id);
      const matchStuId = String(r.student_id || '').toLowerCase().includes(q);
      const matchStuReg = (stu?.register_number || '').toLowerCase().includes(q);
      const matchStuName = (stu?.student_name || '').toLowerCase().includes(q);
      const matchCourse =
        (course?.course_name || '').toLowerCase().includes(q) || (course?.course_code || '').toLowerCase().includes(q);
      if (!matchStuId && !matchStuReg && !matchStuName && !matchCourse) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredResults.length);
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  const totalCount = results.length;
  const passedCount = results.filter((r) => r.result_status === 'Pass' || r.grade_point > 0).length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const publishedCount = results.filter((r) => !!r.published_date).length;
  const pendingCount = totalCount - publishedCount;

  // Filtered Department Students & Faculty (for Tab 2)
  const filteredDeptStudents = students.filter((s) => {
    if (selectedDept !== 'all' && s.department !== selectedDept) return false;
    if (deptBatchFilter !== 'all' && s.batch !== deptBatchFilter) return false;
    if (deptSearch.trim()) {
      const q = deptSearch.toLowerCase();
      const matchName = s.student_name?.toLowerCase().includes(q);
      const matchReg = s.register_number?.toLowerCase().includes(q);
      const matchEmail = s.email?.toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchEmail) return false;
    }
    return true;
  });

  const filteredDeptFaculty = faculty.filter((f) => {
    if (selectedDept !== 'all' && f.department !== selectedDept) return false;
    if (deptSearch.trim()) {
      const q = deptSearch.toLowerCase();
      const fullName = `${f.first_name} ${f.last_name}`.toLowerCase();
      const matchCode = f.faculty_code?.toLowerCase().includes(q);
      const matchDesig = f.designation?.toLowerCase().includes(q);
      const matchEmail = f.email?.toLowerCase().includes(q);
      if (!fullName.includes(q) && !matchCode && !matchDesig && !matchEmail) return false;
    }
    return true;
  });

  // Department Metrics (for Tab 2)
  const deptCohortStudents = selectedDept === 'all' ? students : students.filter((s) => s.department === selectedDept);
  const deptCohortFaculty = selectedDept === 'all' ? faculty : faculty.filter((f) => f.department === selectedDept);

  const totalDeptStudents = deptCohortStudents.length;
  const totalDeptFaculty = deptCohortFaculty.length;
  const deptStudentFacultyRatio = totalDeptFaculty > 0 ? (totalDeptStudents / totalDeptFaculty).toFixed(1) : '0';

  const avgDeptCgpa =
    totalDeptStudents > 0
      ? (deptCohortStudents.reduce((acc, s) => acc + (Number(s.cgpa) || 0), 0) / totalDeptStudents).toFixed(2)
      : '0.00';

  const avgDeptAttendance =
    totalDeptStudents > 0
      ? Math.round(
          deptCohortStudents.reduce((acc, s) => acc + (Number(s.attendancePercentage) || 0), 0) / totalDeptStudents
        )
      : 0;

  const totalDeptArrears = deptCohortStudents.reduce((acc, s) => acc + (Number(s.currentArrears) || 0), 0);
  const highRiskDeptCount = deptCohortStudents.filter((s) => s.riskLevel?.toLowerCase() === 'high').length;

  // Pagination for Department Students & Faculty
  const deptStudentTotalPages = Math.max(1, Math.ceil(filteredDeptStudents.length / deptStudentPageSize));
  const safeDeptStudentPage = Math.min(Math.max(1, deptStudentPage), deptStudentTotalPages);
  const deptStudentStartIndex = (safeDeptStudentPage - 1) * deptStudentPageSize;
  const paginatedDeptStudents = filteredDeptStudents.slice(
    deptStudentStartIndex,
    deptStudentStartIndex + deptStudentPageSize
  );

  const deptFacultyTotalPages = Math.max(1, Math.ceil(filteredDeptFaculty.length / deptFacultyPageSize));
  const safeDeptFacultyPage = Math.min(Math.max(1, deptFacultyPage), deptFacultyTotalPages);
  const deptFacultyStartIndex = (safeDeptFacultyPage - 1) * deptFacultyPageSize;
  const paginatedDeptFaculty = filteredDeptFaculty.slice(
    deptFacultyStartIndex,
    deptFacultyStartIndex + deptFacultyPageSize
  );

  // Load and Inspect student marks history
  const handleInspectStudentMarks = async (studentId: string) => {
    const stu = students.find((s) => s.id === studentId || s.register_number === studentId);
    if (!stu) return;
    setInspectingStudent(stu);
    setLoadingStudentHistory(true);
    try {
      const [pastResults, pastMarks] = await Promise.all([
        api.getResults({ studentId: stu.id }).catch(() => []),
        api.getMarks(stu.id).catch(() => []),
      ]);
      setInspectingStudentResults(pastResults);
      setInspectingStudentMarks(pastMarks);
    } catch (err) {
      console.warn('Failed to load past marks:', err);
    } finally {
      setLoadingStudentHistory(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    if (selectedIds.size === filteredResults.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResults.map((r) => r.id)));
    }
  };

  const handlePublishSelected = async () => {
    if (selectedIds.size === 0) return;
    setPublishing(true);
    setNotification(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.publishResults(Array.from(selectedIds), today);
      setNotification({
        type: 'success',
        message: res.message || `Successfully approved & published ${res.count} semester results.`,
      });
      setSelectedIds(new Set());
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to publish results' });
    } finally {
      setPublishing(false);
    }
  };

  const handleOpenAlterModal = (r: SemesterResultRecord) => {
    setEditingResult(r);
    setEditGrade(r.grade);
    setEditRemarks('Revaluation Scrutiny / COE Board Revision');
  };

  const handleSaveAlteration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResult) return;
    setSavingAlteration(true);
    setNotification(null);
    try {
      const gp = GRADE_POINTS[editGrade] ?? 0;
      const status = editGrade === 'U' ? 'Fail' : 'Pass';

      await api.saveResult({
        id: editingResult.id,
        student_id: editingResult.student_id,
        semester_id: editingResult.semester_id,
        course_id: editingResult.course_id,
        grade: editGrade,
        grade_point: gp,
        credits: editingResult.credits,
        result_status: status,
        academic_year: editingResult.academic_year,
        published_date: editingResult.published_date || new Date().toISOString().split('T')[0],
      });

      setNotification({
        type: 'success',
        message: `Semester end grade for student ${editingResult.student_id} officially updated to ${editGrade} (${gp.toFixed(1)} GP) by Controller of Examinations.`,
      });
      setEditingResult(null);
      await loadData();
      if (inspectingStudent && inspectingStudent.id === editingResult.student_id) {
        await handleInspectStudentMarks(editingResult.student_id);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to alter semester result' });
    } finally {
      setSavingAlteration(false);
    }
  };

  // Open Enter Upcoming Mark Modal
  const handleOpenEnterUpcomingModal = (presetStudentId?: string) => {
    const targetStuId = presetStudentId || inspectingStudent?.id || (students.length > 0 ? students[0].id : '');
    setUpcomingStudentId(targetStuId);

    // Auto-detect next upcoming semester
    const stuResults = results.filter((r) => r.student_id === targetStuId);
    const recordedSemIds = new Set(stuResults.map((r) => r.semester_id));
    const nextUpcomingSem = semesters.find((s) => !recordedSemIds.has(s.id)) || semesters[0];
    const semId = nextUpcomingSem ? nextUpcomingSem.id : (semesters[0]?.id || 'sem_1');
    setUpcomingSemesterId(semId);

    // Pick appropriate course
    const stu = studentMap.get(targetStuId);
    const semNum = nextUpcomingSem?.semester_number || 1;
    const matchingCourse =
      courses.find((c) => c.department === stu?.department && c.semester_number === semNum) ||
      courses.find((c) => c.semester_number === semNum) ||
      courses[0];

    if (matchingCourse) {
      setUpcomingCourseId(matchingCourse.id);
      setUpcomingCredits(matchingCourse.credits || 4);
    } else {
      setUpcomingCourseId('');
      setUpcomingCredits(4);
    }

    setUpcomingGrade('A');
    setUpcomingRawMarks('75');
    setUpcomingAcademicYear(nextUpcomingSem?.academic_year || '2024-25');
    setUpcomingPublishNow(true);
    setShowEnterUpcomingModal(true);
  };

  // Handle Raw Marks change with automated grade suggestion
  const handleRawMarksChange = (val: string) => {
    setUpcomingRawMarks(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (num >= 90) setUpcomingGrade('O');
      else if (num >= 80) setUpcomingGrade('A+');
      else if (num >= 70) setUpcomingGrade('A');
      else if (num >= 60) setUpcomingGrade('B+');
      else if (num >= 55) setUpcomingGrade('B');
      else if (num >= 50) setUpcomingGrade('C');
      else setUpcomingGrade('U');
    }
  };

  // Handle changing student in Enter Upcoming Modal
  const handleUpcomingStudentChange = (stuId: string) => {
    setUpcomingStudentId(stuId);
    const stu = studentMap.get(stuId);
    const stuResults = results.filter((r) => r.student_id === stuId);
    const recordedSemIds = new Set(stuResults.map((r) => r.semester_id));
    const nextUpcomingSem = semesters.find((s) => !recordedSemIds.has(s.id)) || semesters[0];
    const semId = nextUpcomingSem ? nextUpcomingSem.id : (semesters[0]?.id || 'sem_1');
    setUpcomingSemesterId(semId);

    const semNum = nextUpcomingSem?.semester_number || 1;
    const matchingCourse =
      courses.find((c) => c.department === stu?.department && c.semester_number === semNum) ||
      courses.find((c) => c.semester_number === semNum) ||
      courses[0];

    if (matchingCourse) {
      setUpcomingCourseId(matchingCourse.id);
      setUpcomingCredits(matchingCourse.credits || 4);
    }
  };

  // Handle changing semester in Enter Upcoming Modal
  const handleUpcomingSemesterChange = (semId: string) => {
    setUpcomingSemesterId(semId);
    const stu = studentMap.get(upcomingStudentId);
    const sem = semesterMap.get(semId);
    const semNum = sem?.semester_number || 1;
    const matchingCourse =
      courses.find((c) => c.department === stu?.department && c.semester_number === semNum) ||
      courses.find((c) => c.semester_number === semNum) ||
      courses[0];

    if (matchingCourse) {
      setUpcomingCourseId(matchingCourse.id);
      setUpcomingCredits(matchingCourse.credits || 4);
    }
    if (sem?.academic_year) {
      setUpcomingAcademicYear(sem.academic_year);
    }
  };

  // Handle changing course in Enter Upcoming Modal
  const handleUpcomingCourseChange = (crsId: string) => {
    setUpcomingCourseId(crsId);
    const crs = courseMap.get(crsId);
    if (crs?.credits) {
      setUpcomingCredits(crs.credits);
    }
  };

  // Save Upcoming Mark to DB
  const handleSaveUpcomingMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upcomingStudentId || !upcomingSemesterId || !upcomingCourseId) {
      setNotification({ type: 'error', message: 'Please select a student, semester, and course.' });
      return;
    }
    setSavingUpcomingMark(true);
    setNotification(null);
    try {
      const gp = GRADE_POINTS[upcomingGrade] ?? 0;
      const status = upcomingGrade === 'U' ? 'Fail' : 'Pass';
      const publishedDate = upcomingPublishNow ? new Date().toISOString().split('T')[0] : '';

      await api.saveResult({
        student_id: upcomingStudentId,
        semester_id: upcomingSemesterId,
        course_id: upcomingCourseId,
        grade: upcomingGrade,
        grade_point: gp,
        credits: Number(upcomingCredits),
        result_status: status,
        academic_year: upcomingAcademicYear,
        published_date: publishedDate,
      });

      const targetStu = studentMap.get(upcomingStudentId);
      setNotification({
        type: 'success',
        message: `Upcoming semester examination mark successfully recorded for ${targetStu?.student_name || upcomingStudentId}: Grade ${upcomingGrade} (${gp.toFixed(1)} GP, ${upcomingCredits} Credits) — ${upcomingPublishNow ? 'Published' : 'Saved as Draft'}.`,
      });

      setShowEnterUpcomingModal(false);
      await loadData();
      if (inspectingStudent && inspectingStudent.id === upcomingStudentId) {
        await handleInspectStudentMarks(upcomingStudentId);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to save upcoming examination mark' });
    } finally {
      setSavingUpcomingMark(false);
    }
  };

  // Calculate grouped results for inspecting student
  const inspectingSemestersGrouped = React.useMemo(() => {
    if (!inspectingStudent) return [];
    const grouped = new Map<string, SemesterResultRecord[]>();
    for (const r of inspectingStudentResults) {
      const list = grouped.get(r.semester_id) || [];
      list.push(r);
      grouped.set(r.semester_id, list);
    }
    return Array.from(grouped.entries()).sort((a, b) => {
      const semA = semesterMap.get(a[0])?.semester_number || 0;
      const semB = semesterMap.get(b[0])?.semester_number || 0;
      return semA - semB;
    });
  }, [inspectingStudent, inspectingStudentResults, semesterMap]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              Controller of Examinations Portal
            </span>
            <span className="text-xs text-slate-400">• Institutional Governance & Evaluation Division</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Academic Examination Board & Results Publishing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sole Authorized Office: Review previous years marks, enter upcoming examination grades, publish transcripts, and monitor department cohorts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {activeDeckTab === 'results' && (
            <>
              <button
                onClick={() => handleOpenEnterUpcomingModal()}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-700" />
                <span>+ Enter Upcoming Marks</span>
              </button>

              <button
                onClick={handlePublishSelected}
                disabled={publishing || selectedIds.size === 0}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {publishing ? 'Publishing...' : `Approve & Publish Selected (${selectedIds.size})`}
              </button>
            </>
          )}
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700 font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* Primary Deck Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveDeckTab('results')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeDeckTab === 'results'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Review & Publish Results</span>
          <span
            className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              activeDeckTab === 'results' ? 'bg-amber-700/60 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {results.length.toLocaleString()}
          </span>
        </button>

        <button
          onClick={() => setActiveDeckTab('departments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeDeckTab === 'departments'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Department-Wise Faculty & Student Directory</span>
          <span
            className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              activeDeckTab === 'departments' ? 'bg-amber-700/60 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {departmentList.length} Depts
          </span>
        </button>
      </div>

      {/* ==================== TAB 1: REVIEW & PUBLISH RESULTS ==================== */}
      {activeDeckTab === 'results' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-slate-500">Total Evaluations</span>
                <FileCheck className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{totalCount.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-1">Across all registered courses</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-emerald-700">Official Pass Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-700">{passRate}%</div>
              <div className="text-[11px] text-slate-500 mt-1">{passedCount.toLocaleString()} Successful cleared</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-blue-700">Officially Published</span>
                <Award className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-700">{publishedCount.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-1">Released to Student Portals</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-amber-700">Pending Review</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-700">{pendingCount.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-1">Awaiting COE Publication</div>
            </div>
          </div>

          {/* Filter Toolbar with Department Filter & Department-Wise Student Dropdown */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by student name, reg no, or course..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Department Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500 text-[11px] font-semibold shrink-0">Department:</span>
                <select
                  value={resultsDeptFilter}
                  onChange={(e) => {
                    const dept = e.target.value;
                    setResultsDeptFilter(dept);
                    setSelectedStudentFilter('all');
                    setInspectingStudent(null);
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-semibold text-slate-800"
                >
                  <option value="all">All Academic Departments</option>
                  {departmentList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department-Wise Student Selector Dropdown */}
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-slate-500 text-[11px] font-semibold shrink-0">Student:</span>
                <select
                  value={selectedStudentFilter}
                  onChange={(e) => {
                    const stuId = e.target.value;
                    setSelectedStudentFilter(stuId);
                    if (stuId !== 'all') {
                      handleInspectStudentMarks(stuId);
                    } else {
                      setInspectingStudent(null);
                    }
                  }}
                  className="text-xs bg-slate-50 border border-amber-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-semibold text-slate-800 max-w-[270px] truncate"
                >
                  <option value="all">All Students (Department-Wise Grouped)</option>
                  {departmentList.map((dept) => {
                    if (resultsDeptFilter !== 'all' && dept !== resultsDeptFilter) return null;
                    const deptStudents = students.filter((s) => s.department === dept);
                    if (deptStudents.length === 0) return null;
                    return (
                      <optgroup key={dept} label={`📂 ${dept} (${deptStudents.length} students)`}>
                        {deptStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.register_number} — {s.student_name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Sub-row filters */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px] font-semibold">Semester:</span>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none"
                  >
                    <option value="all">All Semesters</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        Semester {s.semester_number} ({s.academic_year})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px] font-semibold">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pass">Pass Only</option>
                    <option value="Fail">Fail (Arrears) Only</option>
                    <option value="Published">Officially Published</option>
                    <option value="Pending">Unpublished / Draft</option>
                  </select>
                </div>

                {(resultsDeptFilter !== 'all' || selectedStudentFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setResultsDeptFilter('all');
                      setSelectedStudentFilter('all');
                      setInspectingStudent(null);
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Clear Student/Dept Filter
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllFiltered}
                  className="text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  {selectedIds.size === filteredResults.length && filteredResults.length > 0
                    ? 'Deselect All'
                    : 'Select All Filtered'}
                </button>
              </div>
            </div>
          </div>

          {/* ==================== PREVIOUS YEARS MARKS LEDGER CARD (When Student Selected) ==================== */}
          {inspectingStudent && (
            <div className="bg-gradient-to-r from-amber-50/90 via-white to-orange-50/40 p-5 rounded-2xl border-2 border-amber-300 shadow-md space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {inspectingStudent.student_name}
                      </h3>
                      <span className="font-mono text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                        {inspectingStudent.register_number}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                        {inspectingStudent.department}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Batch {inspectingStudent.batch} • {inspectingStudent.programme || inspectingStudent.branch} • Adm #{inspectingStudent.admission_number}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleOpenEnterUpcomingModal(inspectingStudent.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Enter Upcoming Marks</span>
                  </button>
                  <button
                    onClick={() => {
                      setInspectingStudent(null);
                      setSelectedStudentFilter('all');
                    }}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    title="Close student history ledger"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Student Telemetry Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cumulative CGPA</span>
                  <span className="text-lg font-extrabold text-amber-700">
                    {(Number(inspectingStudent.cgpa) || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Across completed sems</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Earned Credits</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {inspectingStudentResults
                      .filter((r) => r.result_status === 'Pass')
                      .reduce((acc, r) => acc + (Number(r.credits) || 0), 0)}{' '}
                    Credits
                  </span>
                  <span className="text-[10px] text-slate-400 block">Officially cleared</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Arrears</span>
                  <span
                    className={`text-lg font-extrabold ${
                      (Number(inspectingStudent.currentArrears) || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {inspectingStudent.currentArrears}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Backlog papers</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Attendance</span>
                  <span className="text-lg font-extrabold text-teal-700">
                    {inspectingStudent.attendancePercentage}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Biometric verified</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Academic Standing</span>
                  <div className="mt-1">
                    <RiskBadge level={inspectingStudent.riskLevel} />
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: Previous Semesters vs Internal Marks */}
              <div className="flex items-center gap-2 pt-2 border-t border-amber-200/70">
                <button
                  onClick={() => setInspectingActiveTab('semesters')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    inspectingActiveTab === 'semesters'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Previous Years Semester Results ({inspectingStudentResults.length} records)</span>
                </button>
                <button
                  onClick={() => setInspectingActiveTab('internals')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    inspectingActiveTab === 'internals'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Continuous Internal Assessments ({inspectingStudentMarks.length} records)</span>
                </button>
              </div>

              {/* Previous Semester Examination Results (Grouped by Semester) */}
              {inspectingActiveTab === 'semesters' && (
                <div className="space-y-4">
                  {loadingStudentHistory ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading past semester evaluation records...
                    </div>
                  ) : inspectingSemestersGrouped.length === 0 ? (
                    <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                      No past semester examination records found for this student. Use the "+ Enter Upcoming Marks" button above to record semester end evaluations.
                    </div>
                  ) : (
                    inspectingSemestersGrouped.map(([semId, semResults]) => {
                      const sem = semesterMap.get(semId);
                      const totalCredits = semResults.reduce((acc, r) => acc + (Number(r.credits) || 0), 0);
                      const earnedPoints = semResults.reduce(
                        (acc, r) => acc + (Number(r.grade_point) || 0) * (Number(r.credits) || 0),
                        0
                      );
                      const sgpa = totalCredits > 0 ? (earnedPoints / totalCredits).toFixed(2) : '0.00';
                      const failCount = semResults.filter((r) => r.result_status === 'Fail').length;

                      return (
                        <div key={semId} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">
                                Semester {sem?.semester_number || semId}
                              </span>
                              <span className="text-slate-500 font-mono text-[11px]">
                                ({sem?.academic_year || 'Academic Year'} • {sem?.semester_type || 'Regular'})
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-600">
                                Credits: <strong className="text-slate-900">{totalCredits}</strong>
                              </span>
                              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                SGPA: {sgpa}
                              </span>
                              {failCount > 0 ? (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                  {failCount} Arrear{failCount > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  All Cleared
                                </span>
                              )}
                            </div>
                          </div>

                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                              <tr>
                                <th className="py-2 px-3">Course Code</th>
                                <th className="py-2 px-3">Course Name</th>
                                <th className="py-2 px-3 text-center">Credits</th>
                                <th className="py-2 px-3 text-center">Grade</th>
                                <th className="py-2 px-3 text-center">Grade Point</th>
                                <th className="py-2 px-3 text-center">Outcome</th>
                                <th className="py-2 px-3">Publication Status</th>
                                <th className="py-2 px-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {semResults.map((r) => {
                                const crs = courseMap.get(r.course_id);
                                const isPass = r.result_status === 'Pass';
                                const isPub = !!r.published_date;
                                return (
                                  <tr key={r.id} className="hover:bg-slate-50/70">
                                    <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                      {crs?.course_code || r.course_id}
                                    </td>
                                    <td className="py-2 px-3 font-semibold text-slate-800">
                                      {crs?.course_name || r.course_id}
                                    </td>
                                    <td className="py-2 px-3 text-center font-mono">{r.credits}</td>
                                    <td className="py-2 px-3 text-center font-bold text-slate-900">{r.grade}</td>
                                    <td className="py-2 px-3 text-center font-mono">{r.grade_point.toFixed(1)}</td>
                                    <td className="py-2 px-3 text-center">
                                      <span
                                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                          isPass
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}
                                      >
                                        {isPass ? 'Pass' : 'Arrear'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-[11px]">
                                      {isPub ? (
                                        <span className="text-emerald-700 flex items-center gap-1 font-medium">
                                          <Check className="w-3 h-3 text-emerald-600" />
                                          Published ({r.published_date.split(' ')[0]})
                                        </span>
                                      ) : (
                                        <span className="text-amber-700 flex items-center gap-1 font-medium">
                                          <Clock className="w-3 h-3 text-amber-600" />
                                          Draft / Pending
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <button
                                        onClick={() => handleOpenAlterModal(r)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded cursor-pointer"
                                      >
                                        <Edit3 className="w-3 h-3" /> Alter
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Continuous Internal Assessment Marks */}
              {inspectingActiveTab === 'internals' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Formative Continuous Internal Assessment Records ({inspectingStudentMarks.length})
                    </span>
                    <span className="text-[11px] text-slate-500">Continuous Assessment Evaluations</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-2 px-3">Assessment Name</th>
                          <th className="py-2 px-3">Course</th>
                          <th className="py-2 px-3 text-center">Marks Obtained</th>
                          <th className="py-2 px-3 text-center">Maximum Marks</th>
                          <th className="py-2 px-3 text-center">Percentage</th>
                          <th className="py-2 px-3">Date Recorded</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inspectingStudentMarks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              No internal assessment marks recorded for this student yet.
                            </td>
                          </tr>
                        ) : (
                          inspectingStudentMarks.map((m) => {
                            const crs = courseMap.get(m.course_id);
                            const pct =
                              m.maximum_marks > 0
                                ? Math.round((Number(m.marks_obtained) / Number(m.maximum_marks)) * 100)
                                : 0;
                            return (
                              <tr key={m.id} className="hover:bg-slate-50/70">
                                <td className="py-2 px-3 font-semibold text-slate-900">{m.assessment_name}</td>
                                <td className="py-2 px-3">
                                  <div className="font-semibold text-slate-800">
                                    {crs?.course_name || m.course_id}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-500">{crs?.course_code}</div>
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                                  {m.marks_obtained}
                                </td>
                                <td className="py-2 px-3 text-center font-mono text-slate-600">{m.maximum_marks}</td>
                                <td className="py-2 px-3 text-center">
                                  <span
                                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                      pct >= 75
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : pct >= 50
                                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                                    }`}
                                  >
                                    {pct}%
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-[11px] text-slate-500 font-mono">
                                  {m.created_at?.split('T')[0] || '—'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredResults.length > 0 && selectedIds.size === filteredResults.length}
                        onChange={selectAllFiltered}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                    </th>
                    <th className="py-3 px-4">Student & Department</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4 text-center">Semester</th>
                    <th className="py-3 px-4 text-center">Grade</th>
                    <th className="py-3 px-4 text-center">Grade Point</th>
                    <th className="py-3 px-4 text-center">Credits</th>
                    <th className="py-3 px-4 text-center">Outcome</th>
                    <th className="py-3 px-4">Publication Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading academic records...
                      </td>
                    </tr>
                  ) : filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No semester results found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedResults.map((r) => {
                      const course = courseMap.get(r.course_id);
                      const stu = studentMap.get(r.student_id);
                      const sem = semesterMap.get(r.semester_id);
                      const isSelected = selectedIds.has(r.id);
                      const isPublished = !!r.published_date;
                      const isPass = r.result_status === 'Pass' || r.grade_point > 0;

                      return (
                        <tr
                          key={r.id}
                          className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-amber-50/40' : ''}`}
                        >
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(r.id)}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-slate-900">
                              {stu?.register_number || r.student_id}
                            </div>
                            <div className="font-semibold text-slate-800 text-[11px]">
                              {stu?.student_name || 'Student Record'}
                            </div>
                            <div className="text-[10px] text-amber-800 font-medium">
                              {stu?.department || 'Department N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">
                              {course ? course.course_name : r.course_id}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {course ? course.course_code : r.course_id}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                            Sem {sem?.semester_number || r.semester_id}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">{r.grade}</td>
                          <td className="py-3 px-4 text-center font-mono">{r.grade_point.toFixed(1)}</td>
                          <td className="py-3 px-4 text-center font-mono">{r.credits}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isPass
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {isPass ? 'Pass' : 'Arrear'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isPublished ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Published ({r.published_date?.split('T')[0]?.split(' ')[0]})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Awaiting Publication
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedStudentFilter(r.student_id);
                                  handleInspectStudentMarks(r.student_id);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition shadow-2xs cursor-pointer"
                                title="View Student's Previous Years Marks Ledger"
                              >
                                <History className="w-3.5 h-3.5 text-slate-600" />
                                <span>Past Marks</span>
                              </button>
                              <button
                                onClick={() => handleOpenAlterModal(r)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition shadow-2xs cursor-pointer"
                                title="Alter Semester End Mark (COE Authority)"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                <span>Alter</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Showing</span>
                <span className="font-semibold text-slate-800">
                  {filteredResults.length === 0 ? 0 : startIndex + 1}
                </span>
                <span>to</span>
                <span className="font-semibold text-slate-800">{endIndex}</span>
                <span>of</span>
                <span className="font-semibold text-slate-800">{filteredResults.length.toLocaleString()}</span>
                <span>records</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={safeCurrentPage <= 1}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                  </button>

                  <span className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded">
                    Page {safeCurrentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: DEPARTMENT-WISE FACULTY & STUDENT DIRECTORY ==================== */}
      {activeDeckTab === 'departments' && (
        <div className="space-y-6">
          {/* Department Selection Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Select Academic Department
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full md:max-w-md bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  >
                    <option value="all">
                      All Academic Departments ({departmentList.length} Departments)
                    </option>
                    {departmentList.map((dept) => {
                      const deptStuCount = students.filter((s) => s.department === dept).length;
                      const deptFacCount = faculty.filter((f) => f.department === dept).length;
                      return (
                        <option key={dept} value={dept}>
                          {dept} ({deptFacCount} Faculty • {deptStuCount} Students)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
                <button
                  onClick={() => setDeptDirectoryView('both')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    deptDirectoryView === 'both'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
                  <span>Dual View (Both)</span>
                </button>
                <button
                  onClick={() => setDeptDirectoryView('students')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    deptDirectoryView === 'students'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Students ({filteredDeptStudents.length})</span>
                </button>
                <button
                  onClick={() => setDeptDirectoryView('faculty')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    deptDirectoryView === 'faculty'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Faculty ({filteredDeptFaculty.length})</span>
                </button>
              </div>
            </div>

            {/* Filter Sub-toolbar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search department roster by name, reg no, faculty code, email..."
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px] font-semibold">Batch:</span>
                  <select
                    value={deptBatchFilter}
                    onChange={(e) => setDeptBatchFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="all">All Batches</option>
                    {batchList.map((b) => (
                      <option key={b} value={b}>
                        Batch {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Showing <strong className="text-slate-800">{filteredDeptFaculty.length}</strong> faculty &{' '}
                <strong className="text-slate-800">{filteredDeptStudents.length}</strong> students in{' '}
                <strong className="text-amber-700">
                  {selectedDept === 'all' ? 'All Departments' : selectedDept}
                </strong>
              </div>
            </div>
          </div>

          {/* Department KPI Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Students</span>
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">{totalDeptStudents.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Enrolled cohort</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Faculty</span>
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">{totalDeptFaculty.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Academic staff</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ratio</span>
                <Users className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-xl font-extrabold text-purple-700">{deptStudentFacultyRatio} : 1</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Student : Faculty</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mean CGPA</span>
                <Award className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-xl font-extrabold text-amber-700">{avgDeptCgpa}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Out of 10.0</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Attendance</span>
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <div className="text-xl font-extrabold text-teal-700">{avgDeptAttendance}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Department avg</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Arrears / Risk</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-xl font-extrabold text-rose-700">{totalDeptArrears}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{highRiskDeptCount} High-risk students</div>
            </div>
          </div>

          {/* DUAL VIEW (BOTH SIDE-BY-SIDE) */}
          {deptDirectoryView === 'both' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Panel: Faculty Cohort */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Faculty Cohort ({filteredDeptFaculty.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {selectedDept === 'all' ? 'Across Departments' : 'Department Faculty'}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
                  {filteredDeptFaculty.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-xs">
                      No faculty found for this department criteria.
                    </div>
                  ) : (
                    paginatedDeptFaculty.map((f) => {
                      const initials = `${f.first_name?.[0] || ''}${f.last_name?.[0] || ''}`.toUpperCase();
                      return (
                        <div key={f.id} className="p-3.5 hover:bg-slate-50/90 transition flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-200">
                            {initials || 'FC'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-slate-900 text-xs truncate">
                                {f.first_name} {f.last_name}
                              </h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                                  f.working_status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {f.working_status}
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                              {f.designation} • <span className="font-mono text-slate-500">{f.faculty_code}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                              {f.qualification} • {f.specialization}
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-600">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[160px]">{f.email}</span>
                              </span>
                              {f.mobile_number && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{f.mobile_number}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Faculty Pagination Footer */}
                {deptFacultyTotalPages > 1 && (
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                    <span>
                      Page {safeDeptFacultyPage} of {deptFacultyTotalPages} ({filteredDeptFaculty.length} faculty)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDeptFacultyPage((p) => Math.max(1, p - 1))}
                        disabled={safeDeptFacultyPage <= 1}
                        className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeptFacultyPage((p) => Math.min(deptFacultyTotalPages, p + 1))}
                        disabled={safeDeptFacultyPage >= deptFacultyTotalPages}
                        className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel: Student Cohort */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-700" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Students Directory ({filteredDeptStudents.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {selectedDept === 'all' ? 'All Depts' : selectedDept}
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[680px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px] sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Register No</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Batch</th>
                        <th className="py-2.5 px-3 text-center">CGPA</th>
                        <th className="py-2.5 px-3 text-center">Attd %</th>
                        <th className="py-2.5 px-3 text-center">Arrears</th>
                        <th className="py-2.5 px-3">Risk Level</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDeptStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-400">
                            No students found matching current criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedDeptStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/90 transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {s.register_number}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              <div>{s.student_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{s.email}</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{s.batch}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                                  (Number(s.cgpa) || 0) >= 8.5
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : (Number(s.cgpa) || 0) >= 6.5
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {(Number(s.cgpa) || 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              <span
                                className={`font-semibold ${
                                  (Number(s.attendancePercentage) || 0) < 75
                                    ? 'text-rose-600 font-bold'
                                    : 'text-slate-700'
                                }`}
                              >
                                {s.attendancePercentage}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {(Number(s.currentArrears) || 0) > 0 ? (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  {s.currentArrears}
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <RiskBadge level={s.riskLevel} />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => {
                                  setActiveDeckTab('results');
                                  setSelectedStudentFilter(s.id);
                                  handleInspectStudentMarks(s.id);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded cursor-pointer"
                                title="Inspect Student Marks & Results"
                              >
                                <History className="w-3 h-3 text-amber-700" />
                                <span>Marks</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Students Pagination Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    Showing {paginatedDeptStudents.length} of {filteredDeptStudents.length} students (Page{' '}
                    {safeDeptStudentPage} of {deptStudentTotalPages})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDeptStudentPage((p) => Math.max(1, p - 1))}
                      disabled={safeDeptStudentPage <= 1}
                      className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setDeptStudentPage((p) => Math.min(deptStudentTotalPages, p + 1))}
                      disabled={safeDeptStudentPage >= deptStudentTotalPages}
                      className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STUDENTS ONLY VIEW */}
          {deptDirectoryView === 'students' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Register No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Programme & Batch</th>
                      <th className="py-3 px-4 text-center">CGPA</th>
                      <th className="py-3 px-4 text-center">Attendance %</th>
                      <th className="py-3 px-4 text-center">Arrears</th>
                      <th className="py-3 px-4">Risk Level</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Review Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDeptStudents.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          No students found matching current criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedDeptStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.register_number}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div>{s.student_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Adm: {s.admission_number}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{s.department}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{s.branch || s.programme}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Batch {s.batch}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                (Number(s.cgpa) || 0) >= 8.5
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : (Number(s.cgpa) || 0) >= 6.5
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {(Number(s.cgpa) || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-semibold">
                            <span
                              className={`${
                                (Number(s.attendancePercentage) || 0) < 75 ? 'text-rose-600 font-bold' : 'text-slate-800'
                              }`}
                            >
                              {s.attendancePercentage}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            {(Number(s.currentArrears) || 0) > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                {s.currentArrears}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <RiskBadge level={s.riskLevel} />
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {s.current_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setActiveDeckTab('results');
                                setSelectedStudentFilter(s.id);
                                handleInspectStudentMarks(s.id);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer transition shadow-2xs"
                            >
                              <History className="w-3.5 h-3.5 text-amber-700" />
                              <span>View Marks</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  Showing{' '}
                  <span className="font-semibold text-slate-800">
                    {filteredDeptStudents.length === 0 ? 0 : deptStudentStartIndex + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-800">
                    {Math.min(deptStudentStartIndex + deptStudentPageSize, filteredDeptStudents.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-800">{filteredDeptStudents.length.toLocaleString()}</span>{' '}
                  students
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span>Per page:</span>
                    <select
                      value={deptStudentPageSize}
                      onChange={(e) => setDeptStudentPageSize(Number(e.target.value))}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDeptStudentPage(1)}
                      disabled={safeDeptStudentPage <= 1}
                      className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeptStudentPage((p) => Math.max(1, p - 1))}
                      disabled={safeDeptStudentPage <= 1}
                      className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-semibold bg-white border border-slate-200 rounded">
                      Page {safeDeptStudentPage} of {deptStudentTotalPages}
                    </span>
                    <button
                      onClick={() => setDeptStudentPage((p) => Math.min(deptStudentTotalPages, p + 1))}
                      disabled={safeDeptStudentPage >= deptStudentTotalPages}
                      className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeptStudentPage(deptStudentTotalPages)}
                      disabled={safeDeptStudentPage >= deptStudentTotalPages}
                      className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FACULTY ONLY VIEW */}
          {deptDirectoryView === 'faculty' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Faculty Code</th>
                      <th className="py-3 px-4">Faculty Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Qualification</th>
                      <th className="py-3 px-4">Specialization</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDeptFaculty.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No faculty found matching current criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedDeptFaculty.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{f.faculty_code}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {f.first_name} {f.last_name}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{f.department}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                              {f.designation}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700">{f.qualification}</td>
                          <td className="py-3 px-4 text-slate-700">{f.specialization}</td>
                          <td className="py-3 px-4 text-[11px] font-mono text-slate-600">
                            <div>{f.email}</div>
                            <div className="text-slate-400">{f.mobile_number}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                f.working_status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {f.working_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Faculty Pagination Bar */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  Showing{' '}
                  <span className="font-semibold text-slate-800">
                    {filteredDeptFaculty.length === 0 ? 0 : deptFacultyStartIndex + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-800">
                    {Math.min(deptFacultyStartIndex + deptFacultyPageSize, filteredDeptFaculty.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-800">{filteredDeptFaculty.length.toLocaleString()}</span>{' '}
                  faculty members
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span>Per page:</span>
                    <select
                      value={deptFacultyPageSize}
                      onChange={(e) => setDeptFacultyPageSize(Number(e.target.value))}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDeptFacultyPage(1)}
                      disabled={safeDeptFacultyPage <= 1}
                      className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeptFacultyPage((p) => Math.max(1, p - 1))}
                      disabled={safeDeptFacultyPage <= 1}
                      className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-semibold bg-white border border-slate-200 rounded">
                      Page {safeDeptFacultyPage} of {deptFacultyTotalPages}
                    </span>
                    <button
                      onClick={() => setDeptFacultyPage((p) => Math.min(deptFacultyTotalPages, p + 1))}
                      disabled={safeDeptFacultyPage >= deptFacultyTotalPages}
                      className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeptFacultyPage(deptFacultyTotalPages)}
                      disabled={safeDeptFacultyPage >= deptFacultyTotalPages}
                      className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== ENTER UPCOMING MARKS MODAL DIALOG ==================== */}
      {showEnterUpcomingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Enter Upcoming Semester Examination Marks (COE Authority)
                </h3>
              </div>
              <button
                onClick={() => setShowEnterUpcomingModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs">
              <span className="font-bold block">Sole Authorized Examination Jurisdiction:</span>
              <span>
                As Controller of Examinations, grade entries recorded here update the student's official grade transcript and credit accounting in the central ERP.
              </span>
            </div>

            <form onSubmit={handleSaveUpcomingMark} className="space-y-4 text-xs">
              {/* 1. Student Selector (Department-Wise Grouped) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Select Student (Grouped Department-Wise) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={upcomingStudentId}
                  onChange={(e) => handleUpcomingStudentChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Choose Student --</option>
                  {departmentList.map((dept) => {
                    const deptStudents = students.filter((s) => s.department === dept);
                    if (deptStudents.length === 0) return null;
                    return (
                      <optgroup key={dept} label={`🏢 ${dept} (${deptStudents.length} students)`}>
                        {deptStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.register_number} — {s.student_name} ({s.batch})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {/* Student Summary & Past Performance Card */}
              {(() => {
                const stu = studentMap.get(upcomingStudentId);
                if (!stu) return null;
                const stuResults = results.filter((r) => r.student_id === upcomingStudentId);
                const recordedSemNumbers = Array.from(
                  new Set(stuResults.map((r) => semesterMap.get(r.semester_id)?.semester_number || 0))
                )
                  .filter((n) => n > 0)
                  .sort();

                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">
                        {stu.student_name} <span className="font-mono text-slate-500">({stu.register_number})</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {stu.department} • Batch {stu.batch}
                      </div>
                      <div className="text-[10px] text-emerald-800 font-semibold mt-1">
                        Completed Semesters:{' '}
                        {recordedSemNumbers.length > 0
                          ? recordedSemNumbers.map((n) => `Sem ${n}`).join(', ')
                          : 'None yet'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Current CGPA</span>
                      <span className="font-mono font-extrabold text-amber-700 text-sm">
                        {(Number(stu.cgpa) || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Semester & Course Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Select Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={upcomingSemesterId}
                    onChange={(e) => handleUpcomingSemesterChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Choose Semester --</option>
                    {semesters.map((s) => {
                      const isRecorded = results.some(
                        (r) => r.student_id === upcomingStudentId && r.semester_id === s.id
                      );
                      return (
                        <option key={s.id} value={s.id}>
                          Semester {s.semester_number} ({s.academic_year}) {isRecorded ? '• [Recorded]' : '★ [Upcoming]'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={upcomingAcademicYear}
                    onChange={(e) => setUpcomingAcademicYear(e.target.value)}
                    placeholder="e.g. 2024-25"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* 3. Course Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. Select Course <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={upcomingCourseId}
                  onChange={(e) => handleUpcomingCourseChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Choose Course --</option>
                  {(() => {
                    const stu = studentMap.get(upcomingStudentId);
                    const sem = semesterMap.get(upcomingSemesterId);
                    const semNum = sem?.semester_number || 0;

                    const relevantCourses = courses.filter(
                      (c) =>
                        (!stu || !c.department || c.department === stu.department) &&
                        (!semNum || !c.semester_number || c.semester_number === semNum)
                    );

                    const listToRender = relevantCourses.length > 0 ? relevantCourses : courses;

                    return listToRender.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_code} — {c.course_name} ({c.credits} Credits • Sem {c.semester_number || 'N/A'})
                      </option>
                    ));
                  })()}
                </select>
              </div>

              {/* 4. Marks & Grade Entry */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Numerical Mark (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={upcomingRawMarks}
                    onChange={(e) => handleRawMarksChange(e.target.value)}
                    placeholder="e.g. 85"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-selects letter grade</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Letter Grade <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={upcomingGrade}
                    onChange={(e) => setUpcomingGrade(e.target.value as GradeType)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="O">O (Outstanding - 10.0 GP)</option>
                    <option value="A+">A+ (Excellent - 9.0 GP)</option>
                    <option value="A">A (Very Good - 8.0 GP)</option>
                    <option value="B+">B+ (Good - 7.0 GP)</option>
                    <option value="B">B (Above Average - 6.0 GP)</option>
                    <option value="C">C (Pass - 5.0 GP)</option>
                    <option value="U">U (Arrear / Reappear - 0.0 GP)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    GP: {(GRADE_POINTS[upcomingGrade] ?? 0).toFixed(1)}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Credits <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={upcomingCredits}
                    onChange={(e) => setUpcomingCredits(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Outcome: {upcomingGrade === 'U' ? 'Fail (Arrear)' : 'Pass'}
                  </span>
                </div>
              </div>

              {/* 5. Publication Options */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Publication Mode:</span>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="publishMode"
                      checked={upcomingPublishNow}
                      onChange={() => setUpcomingPublishNow(true)}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Publish Immediately to Student Transcript</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="publishMode"
                      checked={!upcomingPublishNow}
                      onChange={() => setUpcomingPublishNow(false)}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Save as Pending Board Verification (Draft)</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEnterUpcomingModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUpcomingMark}
                  className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingUpcomingMark ? 'Recording Mark...' : 'Record Examination Mark'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== COE MARK ALTERATION MODAL DIALOG ==================== */}
      {editingResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Alter Semester Examination Grade (COE Authority)
                </h3>
              </div>
              <button
                onClick={() => setEditingResult(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs">
              <span className="font-bold block">Sole Authorized Jurisdiction:</span>
              <span>
                As Controller of Examinations, any alteration committed here will update the student's official grade point average (SGPA/CGPA) and be permanently recorded in the institutional governance audit trail.
              </span>
            </div>

            <form onSubmit={handleSaveAlteration} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Record</span>
                  <span className="font-mono font-bold text-slate-900">
                    {studentMap.get(editingResult.student_id)?.register_number || editingResult.student_id}
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    {studentMap.get(editingResult.student_id)?.student_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Course</span>
                  <span className="font-semibold text-slate-900">
                    {courseMap.get(editingResult.course_id)?.course_name || editingResult.course_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Grade</span>
                  <span className="font-bold text-slate-800">
                    {editingResult.grade} ({editingResult.grade_point.toFixed(1)} GP)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Course Credits</span>
                  <span className="font-bold text-slate-800">{editingResult.credits} Credits</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Select New Letter Grade
                  </label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value as GradeType)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="O">O (Outstanding - 10.0 GP)</option>
                    <option value="A+">A+ (Excellent - 9.0 GP)</option>
                    <option value="A">A (Very Good - 8.0 GP)</option>
                    <option value="B+">B+ (Good - 7.0 GP)</option>
                    <option value="B">B (Above Average - 6.0 GP)</option>
                    <option value="C">C (Pass - 5.0 GP)</option>
                    <option value="U">U (Reappear / Arrear - 0.0 GP)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Calculated Grade Point</span>
                    <span className="font-mono font-extrabold text-base text-slate-900">
                      {(GRADE_POINTS[editGrade] ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Outcome</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 mt-0.5 rounded text-[11px] font-bold ${
                        editGrade === 'U'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {editGrade === 'U' ? 'Fail (Arrear)' : 'Pass'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Statutory Reason / Scrutiny Remarks
                  </label>
                  <input
                    type="text"
                    required
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="e.g. Scrutiny Revaluation / Board Moderation"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingResult(null)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAlteration}
                  className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingAlteration ? 'Committing...' : 'Commit Alteration to ERP'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
