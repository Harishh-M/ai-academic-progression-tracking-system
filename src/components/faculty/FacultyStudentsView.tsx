import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Student } from '../../types/index.js';
import { RiskBadge, PerformanceBadge } from '../common/RiskBadge.js';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  GraduationCap,
  Calendar,
  Building,
  UserCheck,
  CreditCard,
  Hash,
  Mail,
  Phone,
  MapPin,
  X,
} from 'lucide-react';

interface FacultyStudentsViewProps {
  onNavigateToStudentProgress?: (studentId: string) => void;
  onNavigateToAI?: (studentId: string) => void;
}

export const FacultyStudentsView: React.FC<FacultyStudentsViewProps> = ({
  onNavigateToStudentProgress,
  onNavigateToAI,
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');

  // Modals
  const [dossierStudent, setDossierStudent] = useState<any | null>(null);
  const [editModalStudent, setEditModalStudent] = useState<Partial<Student> | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchStudents = () => {
    setLoading(true);
    api
      .getStudents({
        search: search || undefined,
        batch: selectedBatch || undefined,
        status: selectedStatus || undefined,
        risk: selectedRisk || undefined,
      })
      .then(setStudents)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, [search, selectedBatch, selectedStatus, selectedRisk]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalStudent) return;
    setSaving(true);
    try {
      if (isCreatingNew) {
        await api.createStudent(editModalStudent);
        setFeedback('Student created successfully in institutional ledger.');
      } else if (editModalStudent.id) {
        await api.updateStudent(editModalStudent.id, editModalStudent);
        setFeedback('Student demographic & academic dossier updated.');
      }
      setEditModalStudent(null);
      setIsCreatingNew(false);
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to save student record');
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleOpenNewStudent = () => {
    setIsCreatingNew(true);
    setEditModalStudent({
      student_name: '',
      register_number: '',
      admission_number: '',
      abc_id: '',
      umis_number: '',
      email: '',
      mobile_number: '',
      programme: 'B.E. Computer Science and Engineering',
      programme_short_name: 'B.E. CSE',
      branch: 'Computer Science and Engineering',
      branch_code: 'CSE',
      department: 'Computer Science and Engineering',
      batch: '2023-2027',
      year_of_admission: 2023,
      current_status: 'Continuing',
      programme_status: 'Active',
      student_fees_status: 'Paid',
      readmitted_category: 'No',
      admission_type: 'Regular',
      gender: 'Male',
      date_of_birth: '2005-05-15',
      address: 'Chennai, Tamil Nadu',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory & Demographic Dossier</h1>
          <p className="text-xs text-slate-500">
            Institutional student profiles, state UMIS, ABC ID, fee clearance, and progress metrics
          </p>
        </div>

        <button
          id="btn-add-student"
          onClick={handleOpenNewStudent}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Enrol New Student</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-student"
            type="text"
            placeholder="Search by Name, Register No, ABC ID, UMIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
          />
        </div>

        {/* Batch Filter */}
        <div>
          <select
            id="select-batch"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Batches</option>
            <option value="2023-2027">Batch 2023-2027</option>
            <option value="2022-2026">Batch 2022-2026</option>
            <option value="2021-2025">Batch 2021-2025</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            id="select-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Statuses</option>
            <option value="Continuing">Continuing</option>
            <option value="Shortage of Attendance">Shortage of Attendance</option>
            <option value="Long Absent">Long Absent</option>
            <option value="Discontinued">Discontinued</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Risk Filter */}
        <div>
          <select
            id="select-risk"
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Risk Levels</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Showing {students.length} Student Record(s)
          </span>
          <span className="text-xs text-slate-400">Institutional Database Connected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Register No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Branch & Batch</th>
                <th className="px-4 py-3 text-center">CGPA</th>
                <th className="px-4 py-3 text-center">Attendance</th>
                <th className="px-4 py-3 text-center">Arrears</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Risk Tier</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading institutional student records...
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{s.register_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{s.student_name}</div>
                      <div className="text-[11px] text-slate-400">{s.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{s.branch_code}</div>
                      <div className="text-[11px] text-slate-400">{s.batch}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                      {s.cgpa ? s.cgpa.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-semibold ${
                          s.attendancePercentage >= 75 ? 'text-slate-800' : 'text-rose-600 font-bold'
                        }`}
                      >
                        {s.attendancePercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.currentArrears === 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {s.currentArrears}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          s.current_status === 'Continuing'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : s.current_status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {s.current_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <RiskBadge level={s.riskLevel} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setDossierStudent(s)}
                          title="View Full Profile Dossier"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setIsCreatingNew(false);
                            setEditModalStudent({ ...s });
                          }}
                          title="Edit Student Record"
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {onNavigateToAI && (
                          <button
                            onClick={() => onNavigateToAI(s.id)}
                            title="Run AI Advisor"
                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No students match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Dossier Modal */}
      {dossierStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Comprehensive Student Dossier</h3>
              </div>
              <button
                onClick={() => setDossierStudent(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Dossier Header */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-900 text-lg">{dossierStudent.student_name}</h4>
                <div className="text-xs text-slate-500 font-mono">
                  Reg No: <span className="font-bold text-indigo-700">{dossierStudent.register_number}</span> |
                  Adm No: <span>{dossierStudent.admission_number}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RiskBadge level={dossierStudent.riskLevel} />
                <PerformanceBadge status={dossierStudent.performanceStatus} />
              </div>
            </div>

            {/* Comprehensive Grid of 25+ attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic Bank of Credits (ABC)</span>
                <span className="font-mono font-bold text-slate-900">{dossierStudent.abc_id}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">State UMIS ID</span>
                <span className="font-mono font-bold text-slate-900">{dossierStudent.umis_number}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Admission Type</span>
                <span className="font-semibold text-slate-900">{dossierStudent.admission_type}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Programme</span>
                <span className="font-semibold text-slate-900">{dossierStudent.programme}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Branch & Code</span>
                <span className="font-semibold text-slate-900">{dossierStudent.branch} ({dossierStudent.branch_code})</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch</span>
                <span className="font-semibold text-slate-900">{dossierStudent.batch} (Adm: {dossierStudent.year_of_admission})</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender & DOB</span>
                <span className="font-semibold text-slate-900">{dossierStudent.gender} • {dossierStudent.date_of_birth}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Status</span>
                <span className="font-bold text-emerald-700">{dossierStudent.current_status}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Institutional Fees</span>
                <span className="font-bold text-indigo-700">{dossierStudent.student_fees_status}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Readmitted Category</span>
                <span className="font-semibold text-slate-900">{dossierStudent.readmitted_category}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Email</span>
                <span className="font-semibold text-slate-900 truncate block">{dossierStudent.email}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Number</span>
                <span className="font-semibold text-slate-900">{dossierStudent.mobile_number}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-3">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Residential Address</span>
                <span className="font-medium text-slate-800">{dossierStudent.address}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const s = dossierStudent;
                  setDossierStudent(null);
                  if (onNavigateToStudentProgress) onNavigateToStudentProgress(s.id);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
              >
                View Academic Ledger & Transcript
              </button>
              <button
                onClick={() => setDossierStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Student Modal */}
      {editModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveStudent}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {isCreatingNew ? 'Enrol New Student Record' : 'Edit Student Record'}
              </h3>
              <button
                type="button"
                onClick={() => setEditModalStudent(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Student Name *</label>
                <input
                  type="text"
                  required
                  value={editModalStudent.student_name || ''}
                  onChange={(e) => setEditModalStudent({ ...editModalStudent, student_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Register Number (Unique) *</label>
                <input
                  type="text"
                  required
                  value={editModalStudent.register_number || ''}
                  onChange={(e) => setEditModalStudent({ ...editModalStudent, register_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Admission Number</label>
                <input
                  type="text"
                  value={editModalStudent.admission_number || ''}
                  onChange={(e) => setEditModalStudent({ ...editModalStudent, admission_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ABC ID (Academic Bank of Credits)</label>
                <input
                  type="text"
                  value={editModalStudent.abc_id || ''}
                  onChange={(e) => setEditModalStudent({ ...editModalStudent, abc_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">State UMIS Number</label>
                <input
                  type="text"
                  value={editModalStudent.umis_number || ''}
                  onChange={(e) => setEditModalStudent({ ...editModalStudent, umis_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={editModalStudent.email || ''}
                  onChange={(e) => setEditModalStudent({ ...editModalStudent, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={editModalStudent.mobile_number || ''}
                  onChange={(e) => setEditModalStudent({ ...editModalStudent, mobile_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Programme</label>
                <input
                  type="text"
                  value={editModalStudent.programme || ''}
                  onChange={(e) => setEditModalStudent({ ...editModalStudent, programme: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Current Academic Status</label>
                <select
                  value={editModalStudent.current_status || 'Continuing'}
                  onChange={(e: any) => setEditModalStudent({ ...editModalStudent, current_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="Continuing">Continuing</option>
                  <option value="Completed">Completed</option>
                  <option value="Shortage of Attendance">Shortage of Attendance</option>
                  <option value="Long Absent">Long Absent</option>
                  <option value="Discontinued">Discontinued</option>
                  <option value="Debarred">Debarred</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Fees Status</label>
                <select
                  value={editModalStudent.student_fees_status || 'Paid'}
                  onChange={(e: any) => setEditModalStudent({ ...editModalStudent, student_fees_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Not Paid">Not Paid</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editModalStudent.address || ''}
                  onChange={(e) => setEditModalStudent({ ...editModalStudent, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition"
              >
                {saving ? 'Saving...' : 'Save to Institutional Ledger'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
