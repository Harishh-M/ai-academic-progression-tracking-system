import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api.js';
import { Faculty, Student } from '../../types/index.js';
import { RiskBadge } from './RiskBadge.js';
import {
  Building,
  Users,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  Layers,
  UserCheck,
  Award,
  AlertTriangle,
  Search,
  RefreshCw,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
} from 'lucide-react';

type EnrichedStudent = Student & {
  cgpa: number;
  currentSGPA: number;
  attendancePercentage: number;
  currentArrears: number;
  riskLevel: string;
  performanceStatus: string;
};

interface DepartmentDirectoryDashboardProps {
  initialDepartment?: string;
  showHeader?: boolean;
}

export const DepartmentDirectoryDashboard: React.FC<DepartmentDirectoryDashboardProps> = ({
  initialDepartment = 'all',
  showHeader = true,
}) => {
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartment);
  const [directoryView, setDirectoryView] = useState<'both' | 'students' | 'faculty'>('both');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [studentPage, setStudentPage] = useState<number>(1);
  const [studentPageSize, setStudentPageSize] = useState<number>(10);
  const [facultyPage, setFacultyPage] = useState<number>(1);
  const [facultyPageSize, setFacultyPageSize] = useState<number>(10);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadDirectoryData = async () => {
    setLoading(true);
    setNotification(null);
    try {
      const [studentsData, facultyData] = await Promise.all([
        api.getStudents().catch((err) => {
          console.error('Failed to load students:', err);
          return [];
        }),
        api.getFaculty().catch((err) => {
          console.error('Failed to load faculty:', err);
          return [];
        }),
      ]);
      setStudents(studentsData as EnrichedStudent[]);
      setFaculty(facultyData);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to fetch department rosters' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectoryData();
  }, []);

  useEffect(() => {
    setStudentPage(1);
    setFacultyPage(1);
  }, [selectedDept, batchFilter, searchQuery]);

  // Unique departments from both students and faculty
  const departmentList = useMemo(() => {
    return Array.from(
      new Set([
        ...students.map((s) => s.department).filter(Boolean),
        ...faculty.map((f) => f.department).filter(Boolean),
      ])
    ).sort((a, b) => a.localeCompare(b));
  }, [students, faculty]);

  // Unique student batches
  const batchList = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.batch).filter(Boolean))).sort();
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedDept !== 'all' && s.department !== selectedDept) return false;
      if (batchFilter !== 'all' && s.batch !== batchFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.student_name?.toLowerCase().includes(q);
        const matchReg = s.register_number?.toLowerCase().includes(q);
        const matchEmail = s.email?.toLowerCase().includes(q);
        if (!matchName && !matchReg && !matchEmail) return false;
      }
      return true;
    });
  }, [students, selectedDept, batchFilter, searchQuery]);

  // Filtered Faculty
  const filteredFaculty = useMemo(() => {
    return faculty.filter((f) => {
      if (selectedDept !== 'all' && f.department !== selectedDept) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${f.first_name} ${f.last_name}`.toLowerCase();
        const matchCode = f.faculty_code?.toLowerCase().includes(q);
        const matchDesig = f.designation?.toLowerCase().includes(q);
        const matchEmail = f.email?.toLowerCase().includes(q);
        if (!fullName.includes(q) && !matchCode && !matchDesig && !matchEmail) return false;
      }
      return true;
    });
  }, [faculty, selectedDept, searchQuery]);

  // Selected Department Cohort Telemetry
  const deptCohortStudents = useMemo(() => {
    return selectedDept === 'all' ? students : students.filter((s) => s.department === selectedDept);
  }, [students, selectedDept]);

  const deptCohortFaculty = useMemo(() => {
    return selectedDept === 'all' ? faculty : faculty.filter((f) => f.department === selectedDept);
  }, [faculty, selectedDept]);

  const totalDeptStudents = deptCohortStudents.length;
  const totalDeptFaculty = deptCohortFaculty.length;
  const studentFacultyRatio = totalDeptFaculty > 0 ? (totalDeptStudents / totalDeptFaculty).toFixed(1) : '0';

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
  const highRiskCount = deptCohortStudents.filter((s) => s.riskLevel?.toLowerCase() === 'high').length;

  // Pagination for Students
  const studentTotalPages = Math.max(1, Math.ceil(filteredStudents.length / studentPageSize));
  const safeStudentPage = Math.min(Math.max(1, studentPage), studentTotalPages);
  const studentStartIndex = (safeStudentPage - 1) * studentPageSize;
  const paginatedStudents = filteredStudents.slice(studentStartIndex, studentStartIndex + studentPageSize);

  // Pagination for Faculty
  const facultyTotalPages = Math.max(1, Math.ceil(filteredFaculty.length / facultyPageSize));
  const safeFacultyPage = Math.min(Math.max(1, facultyPage), facultyTotalPages);
  const facultyStartIndex = (safeFacultyPage - 1) * facultyPageSize;
  const paginatedFaculty = filteredFaculty.slice(facultyStartIndex, facultyStartIndex + facultyPageSize);

  return (
    <div className="space-y-6">
      {/* Optional Standalone Header Banner */}
      {showHeader && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Department Directory Dashboard
              </span>
              <span className="text-xs text-slate-400">• Institutional Roster & Academic Standing</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Department-Wise Faculty & Student Cohorts
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive institutional directory: inspect both faculty strength and student academic progress organized department-wise across the university.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadDirectoryData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      )}

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
              onClick={() => setDirectoryView('both')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                directoryView === 'both'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
              <span>Dual View (Both)</span>
            </button>
            <button
              onClick={() => setDirectoryView('students')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                directoryView === 'students'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>Students ({filteredStudents.length})</span>
            </button>
            <button
              onClick={() => setDirectoryView('faculty')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                directoryView === 'faculty'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>Faculty ({filteredFaculty.length})</span>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-semibold">Batch:</span>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
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
            Showing <strong className="text-slate-800">{filteredFaculty.length}</strong> faculty &{' '}
            <strong className="text-slate-800">{filteredStudents.length}</strong> students in{' '}
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
          <div className="text-xl font-extrabold text-purple-700">{studentFacultyRatio} : 1</div>
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
          <div className="text-[10px] text-slate-400 mt-0.5">{highRiskCount} High-risk students</div>
        </div>
      </div>

      {/* ==================== DUAL VIEW (BOTH SIDE-BY-SIDE) ==================== */}
      {directoryView === 'both' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Faculty Cohort */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Faculty Cohort ({filteredFaculty.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {selectedDept === 'all' ? 'Across Departments' : selectedDept}
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
              {filteredFaculty.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs">
                  No faculty found for this department criteria.
                </div>
              ) : (
                paginatedFaculty.map((f) => {
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
            {facultyTotalPages > 1 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span>
                  Page {safeFacultyPage} of {facultyTotalPages} ({filteredFaculty.length} faculty)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFacultyPage((p) => Math.max(1, p - 1))}
                    disabled={safeFacultyPage <= 1}
                    className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setFacultyPage((p) => Math.min(facultyTotalPages, p + 1))}
                    disabled={safeFacultyPage >= facultyTotalPages}
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
                  Students Directory ({filteredStudents.length})
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        No students found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s) => (
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Students Pagination Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <span>
                Showing {paginatedStudents.length} of {filteredStudents.length} students (Page{' '}
                {safeStudentPage} of {studentTotalPages})
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                  disabled={safeStudentPage <= 1}
                  className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setStudentPage((p) => Math.min(studentTotalPages, p + 1))}
                  disabled={safeStudentPage >= studentTotalPages}
                  className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== STUDENTS ONLY VIEW ==================== */}
      {directoryView === 'students' && (
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
                  <th className="py-3 px-4">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No students found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((s) => (
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
                      <td className="py-3 px-4 text-[11px] text-slate-600 font-mono">
                        <div>{s.email}</div>
                        <div className="text-slate-400">{s.mobile_number}</div>
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
                {filteredStudents.length === 0 ? 0 : studentStartIndex + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(studentStartIndex + studentPageSize, filteredStudents.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{filteredStudents.length.toLocaleString()}</span>{' '}
              students
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={studentPageSize}
                  onChange={(e) => setStudentPageSize(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStudentPage(1)}
                  disabled={safeStudentPage <= 1}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                  disabled={safeStudentPage <= 1}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 py-1 font-semibold bg-white border border-slate-200 rounded">
                  Page {safeStudentPage} of {studentTotalPages}
                </span>
                <button
                  onClick={() => setStudentPage((p) => Math.min(studentTotalPages, p + 1))}
                  disabled={safeStudentPage >= studentTotalPages}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setStudentPage(studentTotalPages)}
                  disabled={safeStudentPage >= studentTotalPages}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FACULTY ONLY VIEW ==================== */}
      {directoryView === 'faculty' && (
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
                {filteredFaculty.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No faculty found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedFaculty.map((f) => (
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
                {filteredFaculty.length === 0 ? 0 : facultyStartIndex + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(facultyStartIndex + facultyPageSize, filteredFaculty.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{filteredFaculty.length.toLocaleString()}</span>{' '}
              faculty members
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={facultyPageSize}
                  onChange={(e) => setFacultyPageSize(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFacultyPage(1)}
                  disabled={safeFacultyPage <= 1}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFacultyPage((p) => Math.max(1, p - 1))}
                  disabled={safeFacultyPage <= 1}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 py-1 font-semibold bg-white border border-slate-200 rounded">
                  Page {safeFacultyPage} of {facultyTotalPages}
                </span>
                <button
                  onClick={() => setFacultyPage((p) => Math.min(facultyTotalPages, p + 1))}
                  disabled={safeFacultyPage >= facultyTotalPages}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFacultyPage(facultyTotalPages)}
                  disabled={safeFacultyPage >= facultyTotalPages}
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
  );
};
