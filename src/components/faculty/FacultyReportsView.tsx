import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api.js';
import { Student } from '../../types/index.js';
import { RiskBadge } from '../common/RiskBadge.js';
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
  Filter,
  Building,
  Search,
  ShieldAlert,
  AlertOctagon,
  Clock,
  Layers,
  Mail,
  Phone,
  LayoutGrid,
  List,
  Check,
  X,
  CreditCard,
  UserX,
} from 'lucide-react';

export type ProblemType =
  | 'all_problems'
  | 'shortage_critical'
  | 'shortage_severe'
  | 'multiple_arrears'
  | 'single_arrear'
  | 'cgpa_critical'
  | 'cgpa_warning'
  | 'risk_high'
  | 'risk_medium'
  | 'fees_pending'
  | 'status_irregular';

interface ProblemMeta {
  id: ProblemType;
  label: string;
  badgeLabel: string;
  description: string;
  severity: 'high' | 'medium';
}

const PROBLEM_CATEGORIES: ProblemMeta[] = [
  {
    id: 'all_problems',
    label: 'All At-Risk / Problematic Students (Composite Issues)',
    badgeLabel: 'Composite Issues',
    description: 'Any candidate possessing attendance deficits, academic arrears, low CGPA, fee dues, or risk flags.',
    severity: 'high',
  },
  {
    id: 'shortage_critical',
    label: 'Statutory Attendance Shortage (< 75% Debarred)',
    badgeLabel: 'Attd < 75%',
    description: 'Candidates with attendance below 75% liable for debarment from End Semester Examinations (Clause 4.2).',
    severity: 'high',
  },
  {
    id: 'shortage_severe',
    label: 'Severe Attendance Deficit (< 65% Condonation Ineligible)',
    badgeLabel: 'Attd < 65%',
    description: 'Candidates below 65% attendance who cannot be granted medical or dean condonation.',
    severity: 'high',
  },
  {
    id: 'multiple_arrears',
    label: 'Critical Multiple Arrears (2 or More Backlogs)',
    badgeLabel: '≥ 2 Backlogs',
    description: 'Students with 2 or more uncleared course backlogs requiring intensive remedial coaching.',
    severity: 'high',
  },
  {
    id: 'single_arrear',
    label: 'Single Course Arrear (1 Backlog)',
    badgeLabel: '1 Backlog',
    description: 'Students with exactly one arrear subject to clear in upcoming supplementary examination.',
    severity: 'medium',
  },
  {
    id: 'cgpa_critical',
    label: 'Critical CGPA Underperformance (< 5.0 Poor Standing)',
    badgeLabel: 'CGPA < 5.0',
    description: 'Students with cumulative GPA below 5.00 in danger of academic discontinuation.',
    severity: 'high',
  },
  {
    id: 'cgpa_warning',
    label: 'Academic Probation Warning (CGPA < 6.5)',
    badgeLabel: 'CGPA < 6.5',
    description: 'Students performing below institutional average (CGPA < 6.50) needing faculty advisory.',
    severity: 'medium',
  },
  {
    id: 'risk_high',
    label: 'High Academic Risk Category (Urgent Faculty Intervention)',
    badgeLabel: 'High Risk Flag',
    description: 'Students flagged by AI/heuristics as High Risk due to combined academic weaknesses.',
    severity: 'high',
  },
  {
    id: 'risk_medium',
    label: 'Medium Academic Risk Category (Needs Monitoring)',
    badgeLabel: 'Medium Risk Flag',
    description: 'Students requiring ongoing progress tracking by faculty advisors.',
    severity: 'medium',
  },
  {
    id: 'fees_pending',
    label: 'Institutional Fee Clearance Pending / Unpaid',
    badgeLabel: 'Fee Dues Pending',
    description: 'Candidates with outstanding tuition, laboratory, or examination fee balances.',
    severity: 'medium',
  },
  {
    id: 'status_irregular',
    label: 'Irregular Enrollment Status (Shortage, Debarred, Long Absent)',
    badgeLabel: 'Irregular Status',
    description: 'Candidates marked with non-continuing institutional status in registrar records.',
    severity: 'high',
  },
];

export const FacultyReportsView: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [reportSection, setReportSection] = useState<'problems' | 'honor' | 'transcript'>('problems');
  const [selectedProblem, setSelectedProblem] = useState<ProblemType>('all_problems');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<'grouped' | 'flat'>('grouped');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Transcript report state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
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
    if (reportSection === 'transcript' && selectedStudentId) {
      setReportLoading(true);
      api
        .getStudentReport(selectedStudentId)
        .then(setSelectedStudentReport)
        .catch(console.error)
        .finally(() => setReportLoading(false));
    }
  }, [reportSection, selectedStudentId]);

  const handlePrint = () => {
    window.print();
  };

  // Extract unique departments
  const departmentList = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.department).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [students]);

  // Evaluate whether a student matches the selected problem
  const matchesProblem = (s: any, prob: ProblemType): boolean => {
    const att = Number(s.attendancePercentage) || 0;
    const arrears = Number(s.currentArrears) || 0;
    const cgpa = Number(s.cgpa) || 0;
    const risk = (s.riskLevel || '').toLowerCase();
    const fee = s.student_fees_status;
    const status = s.current_status;

    switch (prob) {
      case 'shortage_critical':
        return att < 75;
      case 'shortage_severe':
        return att < 65;
      case 'multiple_arrears':
        return arrears >= 2;
      case 'single_arrear':
        return arrears === 1;
      case 'cgpa_critical':
        return cgpa > 0 && cgpa < 5.0;
      case 'cgpa_warning':
        return cgpa > 0 && cgpa < 6.5;
      case 'risk_high':
        return risk === 'high';
      case 'risk_medium':
        return risk === 'medium';
      case 'fees_pending':
        return fee === 'Pending' || fee === 'Not Paid';
      case 'status_irregular':
        return ['Shortage of Attendance', 'Long Absent', 'Debarred', 'Discontinued'].includes(status);
      case 'all_problems':
        return (
          att < 75 ||
          arrears > 0 ||
          (cgpa > 0 && cgpa < 6.5) ||
          risk === 'high' ||
          risk === 'medium' ||
          fee === 'Pending' ||
          fee === 'Not Paid' ||
          ['Shortage of Attendance', 'Long Absent', 'Debarred', 'Discontinued'].includes(status)
        );
      default:
        return false;
    }
  };

  // Get individual student problem diagnostics
  const getStudentDiagnostics = (s: any): Array<{ label: string; severity: 'high' | 'medium' }> => {
    const list: Array<{ label: string; severity: 'high' | 'medium' }> = [];
    const att = Number(s.attendancePercentage) || 0;
    const arrears = Number(s.currentArrears) || 0;
    const cgpa = Number(s.cgpa) || 0;
    const risk = (s.riskLevel || '').toLowerCase();

    if (att < 65) {
      list.push({ label: `Severe Attd ${att}% (<65%)`, severity: 'high' });
    } else if (att < 75) {
      list.push({ label: `Attd Shortage ${att}% (<75%)`, severity: 'high' });
    }

    if (arrears >= 2) {
      list.push({ label: `${arrears} Arrears (Multiple Backlogs)`, severity: 'high' });
    } else if (arrears === 1) {
      list.push({ label: `1 Arrear Backlog`, severity: 'medium' });
    }

    if (cgpa > 0 && cgpa < 5.0) {
      list.push({ label: `Critical CGPA ${cgpa.toFixed(2)} (<5.0)`, severity: 'high' });
    } else if (cgpa > 0 && cgpa < 6.5) {
      list.push({ label: `Academic Warning CGPA ${cgpa.toFixed(2)} (<6.5)`, severity: 'medium' });
    }

    if (risk === 'high') {
      list.push({ label: 'High Academic Risk Flag', severity: 'high' });
    } else if (risk === 'medium') {
      list.push({ label: 'Medium Academic Risk Flag', severity: 'medium' });
    }

    if (s.student_fees_status === 'Pending' || s.student_fees_status === 'Not Paid') {
      list.push({ label: `Fees ${s.student_fees_status}`, severity: 'medium' });
    }

    if (['Shortage of Attendance', 'Long Absent', 'Debarred', 'Discontinued'].includes(s.current_status)) {
      list.push({ label: `Status: ${s.current_status}`, severity: 'high' });
    }

    return list;
  };

  // Department-wise problem statistics for tiles and selection
  const deptProblemStats = useMemo(() => {
    return departmentList.map((dept) => {
      const deptStudents = students.filter((s) => s.department === dept);
      const affected = deptStudents.filter((s) => matchesProblem(s, selectedProblem));
      return {
        department: dept,
        total: deptStudents.length,
        affectedCount: affected.length,
        percentage: deptStudents.length > 0 ? Math.round((affected.length / deptStudents.length) * 100) : 0,
      };
    });
  }, [departmentList, students, selectedProblem]);

  // Filtered problem students based on problem, department, and search
  const filteredProblemStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedDepartment !== 'all' && s.department !== selectedDepartment) return false;
      if (!matchesProblem(s, selectedProblem)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.student_name?.toLowerCase().includes(q);
        const matchReg = s.register_number?.toLowerCase().includes(q);
        const matchDept = s.department?.toLowerCase().includes(q);
        if (!matchName && !matchReg && !matchDept) return false;
      }
      return true;
    });
  }, [students, selectedDepartment, selectedProblem, searchQuery]);

  // Group filtered problem students by department
  const studentsGroupedByDepartment = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const s of filteredProblemStudents) {
      const dept = s.department || 'Unassigned Department';
      const list = map.get(dept) || [];
      list.push(s);
      map.set(dept, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredProblemStudents]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Register No',
      'Student Name',
      'Department',
      'Programme',
      'Batch',
      'CGPA',
      'Attendance %',
      'Arrears',
      'Risk Level',
      'Fee Status',
      'Current Status',
      'Identified Issues',
    ];

    const rows = filteredProblemStudents.map((s) => {
      const issues = getStudentDiagnostics(s)
        .map((d) => d.label)
        .join('; ');
      return [
        `"${s.register_number || ''}"`,
        `"${s.student_name || ''}"`,
        `"${s.department || ''}"`,
        `"${s.programme || s.branch || ''}"`,
        `"${s.batch || ''}"`,
        (s.cgpa || 0).toFixed(2),
        s.attendancePercentage || 0,
        s.currentArrears || 0,
        `"${s.riskLevel || ''}"`,
        `"${s.student_fees_status || ''}"`,
        `"${s.current_status || ''}"`,
        `"${issues}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Institutional_Problem_Report_${selectedProblem}_${selectedDepartment}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Honor roll candidates
  const honorStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedDepartment !== 'all' && s.department !== selectedDepartment) return false;
      return (Number(s.cgpa) || 0) >= 8.5 && (Number(s.currentArrears) || 0) === 0;
    });
  }, [students, selectedDepartment]);

  // Transcript processing
  const semesterMap = useMemo(() => {
    return new Map<string, any>((selectedStudentReport?.semesters || []).map((s: any) => [s.id, s]));
  }, [selectedStudentReport]);

  const groupedBySemester = useMemo(() => {
    const grouped: Record<
      number,
      {
        semMeta: any;
        courses: any[];
        sgpa: number;
        totalCredits: number;
        earnedCredits: number;
        passedCount: number;
        failedCount: number;
      }
    > = {};

    (selectedStudentReport?.semesterResults || []).forEach((sr: any) => {
      const sem = semesterMap.get(sr.semester_id);
      const semNum = sem ? sem.semester_number : parseInt(sr.semester_id?.replace(/\D/g, '') || '0', 10);

      if (semNum > 0) {
        if (!grouped[semNum]) {
          grouped[semNum] = {
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
          };
        }
        grouped[semNum].courses.push(sr);
      }
    });

    const sortedNums = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b);

    sortedNums.forEach((semNum) => {
      const semGroup = grouped[semNum];
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
    });

    return grouped;
  }, [selectedStudentReport, semesterMap]);

  const sortedSemNumbers = useMemo(() => {
    return Object.keys(groupedBySemester)
      .map(Number)
      .sort((a, b) => a - b);
  }, [groupedBySemester]);

  const toRoman = (num: number) => {
    const romans = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    return romans[num] || num.toString();
  };

  const isSingleSem = reportSection === 'transcript' && selectedSemester !== 'all';
  const selectedSemNum = Number(selectedSemester);
  const singleSemGroup = isSingleSem ? groupedBySemester[selectedSemNum] : null;
  const displayedCourses = isSingleSem && singleSemGroup
    ? singleSemGroup.courses
    : selectedStudentReport?.semesterResults || [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold">Generating institutional academic telemetry and deficiency reports...</span>
      </div>
    );
  }

  const currentProblemMeta = PROBLEM_CATEGORIES.find((p) => p.id === selectedProblem) || PROBLEM_CATEGORIES[0];
  const affectedDepartmentsCount = deptProblemStats.filter((d) => d.affectedCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              Institutional Governance Division
            </span>
            <span className="text-xs text-slate-400">• Dynamic Academic & Departmental Audit</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Institutional Examination & Student Deficiency Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamically analyze academic issues, attendance deficits, arrears, and risk factors filtered department-wise across the university.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {reportSection === 'problems' && (
            <button
              onClick={handleExportCSV}
              disabled={filteredProblemStudents.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV ({filteredProblemStudents.length})</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {/* Primary Report Category Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 print:hidden">
        <button
          onClick={() => setReportSection('problems')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
            reportSection === 'problems'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Dynamic Student Problem & Deficiency Audit</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              reportSection === 'problems' ? 'bg-amber-700/60 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {filteredProblemStudents.length} Students
          </span>
        </button>

        <button
          onClick={() => setReportSection('honor')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
            reportSection === 'honor'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Dean's Academic Merit & Honor Roll</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              reportSection === 'honor' ? 'bg-amber-700/60 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {honorStudents.length}
          </span>
        </button>

        <button
          onClick={() => setReportSection('transcript')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
            reportSection === 'transcript'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Official Student Transcript Generator</span>
        </button>
      </div>

      {/* ==================== SECTION 1: DYNAMIC PROBLEM & DEPARTMENT AUDIT ==================== */}
      {reportSection === 'problems' && (
        <div className="space-y-6">
          {/* Problem & Department Selector Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Problem Selector Dropdown */}
              <div className="md:col-span-7">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Select Deficiency / Problem Category</span>
                </label>
                <select
                  value={selectedProblem}
                  onChange={(e) => setSelectedProblem(e.target.value as ProblemType)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {PROBLEM_CATEGORIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1 italic">{currentProblemMeta.description}</p>
              </div>

              {/* Department Selector Dropdown */}
              <div className="md:col-span-5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>Select Academic Department</span>
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Departments ({departmentList.length} Departments)</option>
                  {departmentList.map((dept) => {
                    const stats = deptProblemStats.find((d) => d.department === dept);
                    return (
                      <option key={dept} value={dept}>
                        {dept} ({stats?.affectedCount || 0} Affected / {stats?.total || 0} Students)
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Scope:{' '}
                  <strong>
                    {selectedDepartment === 'all'
                      ? 'Institution-Wide (All Departments)'
                      : selectedDepartment}
                  </strong>
                </p>
              </div>
            </div>

            {/* Filter Sub-toolbar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search candidate by name, register number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Display Mode Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setDisplayMode('grouped')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                      displayMode === 'grouped'
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>Grouped by Department</span>
                  </button>
                  <button
                    onClick={() => setDisplayMode('flat')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                      displayMode === 'flat'
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5 text-blue-600" />
                    <span>Consolidated Roster</span>
                  </button>
                </div>
              </div>

              {selectedDepartment !== 'all' && (
                <button
                  onClick={() => setSelectedDepartment('all')}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Department Filter ({selectedDepartment})</span>
                </button>
              )}
            </div>
          </div>

          {/* Department-Wise Problem Matrix Pill Carousel / Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2 print:hidden">
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-600" />
                <span>Department-Wise Breakdown for {currentProblemMeta.badgeLabel}</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Click any department pill below to filter instantly
              </span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pt-1">
              <button
                onClick={() => setSelectedDepartment('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedDepartment === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span>All Departments</span>
                <span className="bg-white/20 px-1.5 py-0.2 rounded text-[10px]">
                  {filteredProblemStudents.length}
                </span>
              </button>

              {deptProblemStats.map((d) => {
                const isSelected = selectedDepartment === d.department;
                return (
                  <button
                    key={d.department}
                    onClick={() => setSelectedDepartment(isSelected ? 'all' : d.department)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-xs'
                        : d.affectedCount > 0
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}
                  >
                    <span>{d.department}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold font-mono ${
                        isSelected
                          ? 'bg-amber-700 text-white'
                          : d.affectedCount > 0
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {d.affectedCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* KPI Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Affected Students</span>
              <span className="text-2xl font-extrabold text-rose-700">
                {filteredProblemStudents.length.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                In {selectedDepartment === 'all' ? 'all departments' : selectedDepartment}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Departments Affected</span>
              <span className="text-2xl font-extrabold text-slate-900">
                {selectedDepartment === 'all' ? `${affectedDepartmentsCount} / ${departmentList.length}` : '1 Dept'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Possessing active issue</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Mean Cohort Attendance</span>
              <span className="text-2xl font-extrabold text-teal-700">
                {filteredProblemStudents.length > 0
                  ? Math.round(
                      filteredProblemStudents.reduce((acc, s) => acc + (Number(s.attendancePercentage) || 0), 0) /
                        filteredProblemStudents.length
                    )
                  : 0}
                %
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">For filtered cohort</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Mean Cohort CGPA</span>
              <span className="text-2xl font-extrabold text-amber-700">
                {filteredProblemStudents.length > 0
                  ? (
                      filteredProblemStudents.reduce((acc, s) => acc + (Number(s.cgpa) || 0), 0) /
                      filteredProblemStudents.length
                    ).toFixed(2)
                  : '0.00'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Average academic point</span>
            </div>
          </div>

          {/* ==================== PRINTABLE PAPER SHEET REPORT ==================== */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-5xl mx-auto print:border-none print:shadow-none print:p-0 space-y-6 text-slate-800">
            {/* University Official Letterhead */}
            <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mx-auto mb-2 print:border">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight uppercase text-slate-900">
                State Technological University
              </h2>
              <h3 className="text-sm font-bold text-slate-700">OFFICE OF THE CONTROLLER OF EXAMINATIONS</h3>
              <p className="text-xs text-slate-500">
                Institutional Academic Audit & Examination Governance Division
              </p>

              <div className="inline-block mt-2 px-3 py-1 bg-slate-100 rounded text-xs font-extrabold uppercase tracking-wider text-slate-900 border border-slate-300">
                OFFICIAL DEFICIENCY REPORT: {currentProblemMeta.label.toUpperCase()}
              </div>

              <div className="text-[11px] text-slate-600 font-medium pt-1">
                Scope:{' '}
                <strong className="text-slate-900">
                  {selectedDepartment === 'all'
                    ? 'All Academic Departments (Institution-Wide)'
                    : selectedDepartment}
                </strong>{' '}
                • Total Candidate(s) Identified:{' '}
                <strong className="text-rose-700">{filteredProblemStudents.length} Students</strong>
              </div>
            </div>

            {/* Regulatory Reference Notice */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 font-medium leading-relaxed">
              <strong>Official Institutional Governance Note:</strong> The candidate(s) listed below have been identified during statutory institutional verification as meeting criteria for <strong>{currentProblemMeta.label}</strong>. Faculty advisors, HODs, and the Examination Board are mandated to execute formal interventions, notices, or remedial actions in accordance with University Academic Regulations.
            </div>

            {/* MODE A: GROUPED BY DEPARTMENT */}
            {displayMode === 'grouped' && (
              <div className="space-y-6">
                {studentsGroupedByDepartment.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No candidates found matching the selected deficiency criteria in the specified department(s).
                  </div>
                ) : (
                  studentsGroupedByDepartment.map(([deptName, deptStudents]) => (
                    <div key={deptName} className="border border-slate-200 rounded-xl overflow-hidden">
                      {/* Department Section Header */}
                      <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-amber-700" />
                          <h3 className="font-extrabold text-slate-900">{deptName}</h3>
                          <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                            {deptStudents.length} Candidate{deptStudents.length > 1 ? 's' : ''} Identified
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Avg Attd:{' '}
                          <strong className="text-slate-800">
                            {Math.round(
                              deptStudents.reduce((acc, s) => acc + (Number(s.attendancePercentage) || 0), 0) /
                                deptStudents.length
                            )}
                            %
                          </strong>{' '}
                          • Avg CGPA:{' '}
                          <strong className="text-slate-800">
                            {(
                              deptStudents.reduce((acc, s) => acc + (Number(s.cgpa) || 0), 0) / deptStudents.length
                            ).toFixed(2)}
                          </strong>
                        </div>
                      </div>

                      {/* Department Candidates Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Register No</th>
                              <th className="py-2.5 px-3">Student Name</th>
                              <th className="py-2.5 px-3">Batch</th>
                              <th className="py-2.5 px-3 text-center">Attd %</th>
                              <th className="py-2.5 px-3 text-center">CGPA</th>
                              <th className="py-2.5 px-3 text-center">Arrears</th>
                              <th className="py-2.5 px-3">Identified Deficiencies</th>
                              <th className="py-2.5 px-3">Risk Level</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {deptStudents.map((s) => {
                              const diagnostics = getStudentDiagnostics(s);
                              return (
                                <tr key={s.id} className="hover:bg-slate-50/70">
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                    {s.register_number}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                                    <div>{s.student_name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{s.email}</div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{s.batch}</td>
                                  <td className="py-2.5 px-3 text-center font-mono">
                                    <span
                                      className={`font-bold ${
                                        (Number(s.attendancePercentage) || 0) < 75
                                          ? 'text-rose-700'
                                          : 'text-slate-700'
                                      }`}
                                    >
                                      {s.attendancePercentage}%
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                                    {(Number(s.cgpa) || 0).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono">
                                    {(Number(s.currentArrears) || 0) > 0 ? (
                                      <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded text-[10px]">
                                        {s.currentArrears}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">0</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex flex-wrap gap-1">
                                      {diagnostics.map((d, i) => (
                                        <span
                                          key={i}
                                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                            d.severity === 'high'
                                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                                              : 'bg-amber-50 text-amber-800 border-amber-200'
                                          }`}
                                        >
                                          {d.label}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <RiskBadge level={s.riskLevel} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* MODE B: CONSOLIDATED ROSTER (FLAT TABLE) */}
            {displayMode === 'flat' && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Register No</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Batch</th>
                      <th className="py-2.5 px-3 text-center">Attd %</th>
                      <th className="py-2.5 px-3 text-center">CGPA</th>
                      <th className="py-2.5 px-3 text-center">Arrears</th>
                      <th className="py-2.5 px-3">Identified Deficiencies</th>
                      <th className="py-2.5 px-3">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredProblemStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          No candidates found matching the selected deficiency criteria in the specified department(s).
                        </td>
                      </tr>
                    ) : (
                      filteredProblemStudents.map((s) => {
                        const diagnostics = getStudentDiagnostics(s);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{s.register_number}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              <div>{s.student_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{s.email}</div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{s.department}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{s.batch}</td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              <span
                                className={`font-bold ${
                                  (Number(s.attendancePercentage) || 0) < 75 ? 'text-rose-700' : 'text-slate-700'
                                }`}
                              >
                                {s.attendancePercentage}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">
                              {(Number(s.cgpa) || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {(Number(s.currentArrears) || 0) > 0 ? (
                                <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded text-[10px]">
                                  {s.currentArrears}
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1">
                                {diagnostics.map((d, i) => (
                                  <span
                                    key={i}
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                      d.severity === 'high'
                                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}
                                  >
                                    {d.label}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <RiskBadge level={s.riskLevel} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Official Verification Signatures */}
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
      )}

      {/* ==================== SECTION 2: DEAN'S MERIT & HONOR ROLL ==================== */}
      {reportSection === 'honor' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Meritorious Students Filter</h3>
                <p className="text-xs text-slate-500">Filter honor roll candidates by academic department</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
              >
                <option value="all">All Departments</option>
                {departmentList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 space-y-6 text-slate-800">
            <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mx-auto mb-2 print:border">
                <Award className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight uppercase text-slate-900">
                State Technological University
              </h2>
              <h3 className="text-sm font-bold text-slate-700">UNIVERSITY COLLEGE OF ENGINEERING</h3>
              <p className="text-xs text-slate-500">
                Dean of Academic Affairs • Institutional Meritorious Roll
              </p>

              <div className="inline-block mt-2 px-3 py-1 bg-amber-50 rounded text-xs font-bold uppercase tracking-wider text-amber-900 border border-amber-300">
                DEAN'S ACADEMIC MERIT & MERIT SCHOLARSHIP ROLL ({selectedDepartment === 'all' ? 'ALL DEPARTMENTS' : selectedDepartment.toUpperCase()})
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 text-center">Merit Rank</th>
                    <th className="p-2.5">Register No</th>
                    <th className="p-2.5">Student Name</th>
                    <th className="p-2.5">Department</th>
                    <th className="p-2.5 text-center">Cumulative CGPA</th>
                    <th className="p-2.5 text-center">Attendance</th>
                    <th className="p-2.5 text-center">Academic Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {honorStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No students found meeting CGPA ≥ 8.50 criteria in the selected department.
                      </td>
                    </tr>
                  ) : (
                    honorStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="p-2.5 font-bold text-center">#{idx + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-amber-800">{s.register_number}</td>
                        <td className="p-2.5 font-bold text-slate-900">{s.student_name}</td>
                        <td className="p-2.5 font-semibold text-slate-700">{s.department}</td>
                        <td className="p-2.5 text-center font-mono font-extrabold text-amber-700 text-sm">
                          {(Number(s.cgpa) || 0).toFixed(2)} / 10.0
                        </td>
                        <td className="p-2.5 text-center font-bold text-emerald-700">
                          {s.attendancePercentage}%
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            First Class with Distinction
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">Dean (Academic Affairs)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SECTION 3: OFFICIAL TRANSCRIPT GENERATOR ==================== */}
      {reportSection === 'transcript' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs font-bold text-slate-700">Select Student for Official Transcript:</div>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setSelectedSemester('all');
                }}
                className="w-full sm:w-80 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {departmentList.map((dept) => {
                  const deptStudents = students.filter((s) => s.department === dept);
                  if (deptStudents.length === 0) return null;
                  return (
                    <optgroup key={dept} label={`📂 ${dept} (${deptStudents.length})`}>
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

            {/* Semester Selector Pills */}
            {selectedStudentReport && sortedSemNumbers.length > 0 && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">
                  <Filter className="w-3.5 h-3.5 text-amber-600" />
                  <span>Semester Filter:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setSelectedSemester('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedSemester === 'all'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>All Semesters (Consolidated)</span>
                  </button>

                  {sortedSemNumbers.map((semNum) => {
                    const isSelected = selectedSemester === semNum.toString();
                    const group = groupedBySemester[semNum];
                    return (
                      <button
                        key={semNum}
                        onClick={() => setSelectedSemester(semNum.toString())}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400/40'
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
            )}
          </div>

          {/* Transcript Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 space-y-6 text-slate-800">
            <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mx-auto mb-2 print:border">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight uppercase text-slate-900">
                State Technological University
              </h2>
              <h3 className="text-sm font-bold text-slate-700">UNIVERSITY COLLEGE OF ENGINEERING</h3>
              <p className="text-xs text-slate-500">
                Office of the Controller of Examinations • Official Grade Record
              </p>

              <div className="inline-block mt-2 px-3 py-1 bg-slate-100 rounded text-xs font-bold uppercase tracking-wider text-slate-800">
                {isSingleSem
                  ? `OFFICIAL SEMESTER ${toRoman(selectedSemNum)} GRADE PERFORMANCE REPORT`
                  : 'OFFICIAL STUDENT ACADEMIC TRANSCRIPT'}
              </div>
            </div>

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
                    <span className="font-mono font-bold text-amber-800">
                      {selectedStudentReport.student.register_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Department</span>
                    <span className="font-semibold text-slate-900">{selectedStudentReport.student.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Report Scope</span>
                    <span className="font-bold text-amber-800">
                      {isSingleSem ? `Semester ${toRoman(selectedSemNum)} Only` : 'Cumulative (All Terms)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Batch / Year</span>
                    <span className="font-medium text-slate-800">
                      {selectedStudentReport.student.batch}{' '}
                      {isSingleSem && singleSemGroup?.semMeta?.academic_year
                        ? `(${singleSemGroup.semMeta.academic_year})`
                        : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      {isSingleSem ? `Sem ${toRoman(selectedSemNum)} SGPA` : 'Cumulative CGPA'}
                    </span>
                    <span className="font-extrabold text-amber-800 text-sm">
                      {isSingleSem && singleSemGroup
                        ? `${singleSemGroup.sgpa.toFixed(2)} / 10.0`
                        : `${(Number(selectedStudentReport.metrics.cgpa) || 0).toFixed(2)} / 10.0`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      {isSingleSem ? 'Registered / Earned Credits' : 'Total Earned Credits'}
                    </span>
                    <span className="font-bold text-slate-800">
                      {isSingleSem && singleSemGroup
                        ? `${singleSemGroup.earnedCredits} / ${singleSemGroup.totalCredits} Credits`
                        : `${selectedStudentReport.metrics.totalEarnedCredits ?? selectedStudentReport.semesterResults.reduce((acc: number, c: any) => acc + (c.result_status === 'Pass' ? c.credits : 0), 0)} Credits`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      {isSingleSem ? 'Semester Standing' : 'Active Arrears'}
                    </span>
                    <span
                      className={`font-bold ${
                        isSingleSem
                          ? singleSemGroup?.failedCount === 0
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                          : selectedStudentReport.metrics.currentArrears === 0
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {isSingleSem
                        ? singleSemGroup?.failedCount === 0
                          ? 'ALL CLEARED'
                          : `${singleSemGroup?.failedCount} BACKLOG(S)`
                        : selectedStudentReport.metrics.currentArrears}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {isSingleSem
                        ? `Semester ${toRoman(selectedSemNum)} Course Examination Ledger`
                        : 'Comprehensive Examination Grade Ledger'}
                    </h4>
                    <span className="text-[11px] font-mono font-medium text-slate-500">
                      {displayedCourses.length} Courses Listed
                    </span>
                  </div>
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
                      {displayedCourses.map((sr: any) => (
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
      )}
    </div>
  );
};
