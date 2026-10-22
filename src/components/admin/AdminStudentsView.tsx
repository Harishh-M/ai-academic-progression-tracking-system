import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api.js';
import { Student } from '../../types/index.js';
import {
  GraduationCap,
  Search,
  Filter,
  RefreshCw,
  Building,
  Calendar,
  Award,
  UserCheck,
  AlertTriangle,
  Eye,
  X,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Layers,
} from 'lucide-react';

type EnrichedStudent = Student & {
  cgpa: number;
  currentSGPA: number;
  attendancePercentage: number;
  currentArrears: number;
  riskLevel: string;
  performanceStatus: string;
  current_semester?: number;
};

export const AdminStudentsView: React.FC = () => {
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [inspectingStudent, setInspectingStudent] = useState<EnrichedStudent | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents();
      setStudents(data as EnrichedStudent[]);
    } catch (err) {
      console.error('Failed to load student master records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Department list
  const departments = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.department).filter(Boolean))).sort();
  }, [students]);

  // Batch list
  const batches = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.batch).filter(Boolean))).sort();
  }, [students]);

  // Filtered list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedDept !== 'all' && s.department !== selectedDept) return false;
      if (selectedBatch !== 'all' && s.batch !== selectedBatch) return false;
      if (selectedStatus !== 'all' && s.current_status !== selectedStatus) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.student_name?.toLowerCase().includes(q);
        const matchReg = s.register_number?.toLowerCase().includes(q);
        const matchEmail = s.email?.toLowerCase().includes(q);
        const matchAbc = s.abc_id?.toLowerCase().includes(q);
        if (!matchName && !matchReg && !matchEmail && !matchAbc) return false;
      }

      return true;
    });
  }, [students, selectedDept, selectedBatch, selectedStatus, search]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDept, selectedBatch, selectedStatus, pageSize]);

  // Telemetry KPIs
  const totalCount = students.length;
  const filteredCount = filteredStudents.length;

  const avgCgpa = useMemo(() => {
    const list = filteredStudents.filter((s) => typeof s.cgpa === 'number' && s.cgpa > 0);
    if (list.length === 0) return '0.00';
    const sum = list.reduce((acc, s) => acc + s.cgpa, 0);
    return (sum / list.length).toFixed(2);
  }, [filteredStudents]);

  const avgAttendance = useMemo(() => {
    const list = filteredStudents.filter((s) => typeof s.attendancePercentage === 'number');
    if (list.length === 0) return '0.0';
    const sum = list.reduce((acc, s) => acc + s.attendancePercentage, 0);
    return (sum / list.length).toFixed(1);
  }, [filteredStudents]);

  const totalArrearCount = useMemo(() => {
    return filteredStudents.filter((s) => (s.currentArrears || 0) > 0).length;
  }, [filteredStudents]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = [
      'Register Number',
      'Student Name',
      'Department',
      'Programme',
      'Batch',
      'Semester',
      'CGPA',
      'Attendance %',
      'Arrears',
      'Status',
      'Email',
      'Mobile',
      'ABC ID',
    ];
    const rows = filteredStudents.map((s) => [
      `"${s.register_number}"`,
      `"${s.student_name}"`,
      `"${s.department}"`,
      `"${s.programme}"`,
      `"${s.batch}"`,
      s.current_semester,
      s.cgpa ?? 'N/A',
      s.attendancePercentage ?? 'N/A',
      s.currentArrears ?? 0,
      `"${s.current_status || 'Active'}"`,
      `"${s.email || ''}"`,
      `"${s.mobile_number || ''}"`,
      `"${s.abc_id || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Master_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Module Title Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
              Administrative Master Node
            </span>
            <span className="text-xs text-slate-400">• Institutional Registry</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            <span>Student Master Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized registry of all enrolled students, academic standing, cohort telemetry, and statutory records.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={loadStudents}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Enrolled</span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{totalCount.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active institution cohort</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filtered View</span>
            <Filter className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-blue-700">{filteredCount.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Current selection</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mean CGPA</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-extrabold text-amber-700">{avgCgpa}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Scale of 10.0</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Attendance Avg</span>
            <UserCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-extrabold text-teal-700">{avgAttendance}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cumulative presence</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">With Arrears</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-extrabold text-rose-700">{totalArrearCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Backlogs carried</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by reg no, student name, email, ABC ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-bold">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-bold">Batch:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-bold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Detained">Detained</option>
              <option value="Transferred">Transferred</option>
              <option value="Alumni">Alumni</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Showing <strong className="text-purple-700">{filteredCount}</strong> of{' '}
          <strong className="text-slate-800">{totalCount}</strong> students
        </div>
      </div>

      {/* Main Student Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Register No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Programme & Batch</th>
                <th className="py-3 px-4 text-center">Semester</th>
                <th className="py-3 px-4 text-center">CGPA</th>
                <th className="py-3 px-4 text-center">Attendance</th>
                <th className="py-3 px-4 text-center">Arrears</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                      <span>Loading student master records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No student records match the active filters.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s) => {
                  const hasShortage = (s.attendancePercentage || 0) < 75;
                  const hasArrears = (s.currentArrears || 0) > 0;
                  return (
                    <tr key={s.id} className="hover:bg-purple-50/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.register_number}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.email}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{s.department}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{s.programme}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">Batch {s.batch}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">Sem {s.current_semester}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-extrabold px-2 py-0.5 rounded text-[11px] ${
                            (s.cgpa || 0) >= 8.0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : (s.cgpa || 0) >= 6.5
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {typeof s.cgpa === 'number' && s.cgpa > 0 ? s.cgpa.toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 ${
                            hasShortage
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {hasShortage && <AlertTriangle className="w-2.5 h-2.5" />}
                          <span>{s.attendancePercentage !== undefined ? `${s.attendancePercentage}%` : '—'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasArrears ? (
                          <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                            {s.currentArrears} Backlog{s.currentArrears > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                            Clear (0)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.current_status === 'Continuing' || (s.current_status as any) === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {s.current_status || 'Continuing'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectingStudent(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition cursor-pointer"
                          title="Inspect Master Record"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
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
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800">{filteredCount === 0 ? 0 : startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">{Math.min(startIndex + pageSize, filteredCount)}</span> of{' '}
            <span className="font-semibold text-slate-800">{filteredCount.toLocaleString()}</span> student records
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 py-1 font-semibold bg-white border border-slate-200 rounded">
                Page {safePage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inspect Student Master Record Modal */}
      {inspectingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{inspectingStudent.student_name}</h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Reg: {inspectingStudent.register_number} • Dept: {inspectingStudent.department}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectingStudent(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Academic Master Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Programme</span>
                <span className="font-bold text-slate-900">{inspectingStudent.programme}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Batch & Sem</span>
                <span className="font-bold text-slate-900">
                  {inspectingStudent.batch} (Sem {inspectingStudent.current_semester})
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">CGPA</span>
                <span className="font-mono font-extrabold text-purple-700">
                  {typeof inspectingStudent.cgpa === 'number' ? inspectingStudent.cgpa.toFixed(2) : 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Attendance</span>
                <span className="font-bold text-teal-700">
                  {inspectingStudent.attendancePercentage !== undefined
                    ? `${inspectingStudent.attendancePercentage}%`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Contact & Administrative Record Details */}
            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1">
                Administrative & Contact Profile
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Institutional Email</span>
                    <span className="font-mono text-xs">{inspectingStudent.email || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Mobile Number</span>
                    <span className="font-mono text-xs">{inspectingStudent.mobile_number || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">ABC ID (Academic Bank)</span>
                    <span className="font-mono text-xs">{inspectingStudent.abc_id || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Date of Birth / Gender</span>
                    <span className="font-medium text-xs">
                      {inspectingStudent.date_of_birth || 'N/A'} ({inspectingStudent.gender || 'N/A'})
                    </span>
                  </div>
                </div>
              </div>

              {inspectingStudent.address && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Permanent Address</span>
                    <span className="text-slate-800">{inspectingStudent.address}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
