import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { User, Faculty, Course, Semester, UserRole } from '../../types/index.js';
import {
  Users,
  Shield,
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  UserCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'faculty' | 'courses' | 'semesters' | 'mappings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [facultyMappings, setFacultyMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // User form modal / states
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: 'password123',
    role: 'FACULTY' as UserRole,
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Course form modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_code: '',
    course_name: '',
    department: 'Computer Science and Engineering',
    programme: 'B.E. CSE',
    semester_number: 1,
    credits: 3,
    course_type: 'Theory',
  });

  // Mapping form modal
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [newMapping, setNewMapping] = useState({
    faculty_id: '',
    course_id: '',
    semester_id: '',
    academic_year: '2024-2025',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, fData, cData, sData, mData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminFaculty(),
        api.getCourses(),
        api.getSemesters(),
        api.getFacultyMappings().catch(() => []),
      ]);
      setUsers(uData);
      setFacultyList(fData);
      setCourses(cData);
      setSemesters(sData);
      setFacultyMappings(mData);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load administrative master records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminUser(newUser);
      setNotification({ type: 'success', message: `User '${newUser.username}' created successfully.` });
      setShowUserModal(false);
      setNewUser({ username: '', email: '', password: 'password123', role: 'FACULTY', status: 'Active' });
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user account '${username}'?`)) return;
    try {
      await api.deleteAdminUser(userId);
      setNotification({ type: 'success', message: `User '${username}' deleted.` });
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.updateAdminUser(user.id, { status: nextStatus });
      setNotification({ type: 'success', message: `Updated ${user.username} status to ${nextStatus}.` });
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminCourse(newCourse);
      setNotification({ type: 'success', message: `Course '${newCourse.course_code}' registered successfully.` });
      setShowCourseModal(false);
      setNewCourse({
        course_code: '',
        course_name: '',
        department: 'Computer Science and Engineering',
        programme: 'B.E. CSE',
        semester_number: 1,
        credits: 3,
        course_type: 'Theory',
      });
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFacultyMapping(newMapping);
      setNotification({ type: 'success', message: 'Faculty-Course mapping created successfully.' });
      setShowMappingModal(false);
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteMapping = async (id: string) => {
    try {
      await api.deleteFacultyMapping(id);
      setNotification({ type: 'success', message: 'Mapping removed.' });
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
              System Administration Portal
            </span>
            <span className="text-xs text-slate-400">• Institutional Master Config</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Academic ERP Administration & System Masters
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full administrative authority: Manage user roles, passwords, courses, semesters, and academic mappings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'users' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          User Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('faculty')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'faculty' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Faculty Directory ({facultyList.length})
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'courses' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Courses ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('semesters')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'semesters' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Semesters ({semesters.length})
        </button>
        <button
          onClick={() => setActiveTab('mappings')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'mappings' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Faculty Mappings ({facultyMappings.length})
        </button>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search users by username, email or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New User
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.slice(0, 100).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{u.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{u.username}</td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'COE'
                            ? 'bg-amber-100 text-amber-800'
                            : u.role === 'FACULTY'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        }`}
                      >
                        {u.status || 'Active'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FACULTY DIRECTORY */}
      {activeTab === 'faculty' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Faculty Code</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facultyList.slice(0, 100).map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{f.faculty_code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{f.first_name} {f.last_name}</td>
                  <td className="py-3 px-4 text-slate-600">{f.department}</td>
                  <td className="py-3 px-4 text-slate-600">{f.designation}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{f.email}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {f.working_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: COURSES */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCourseModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register New Course
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Course Code</th>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.course_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.course_name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.department}</td>
                    <td className="py-3 px-4 font-mono">Sem {c.semester_number}</td>
                    <td className="py-3 px-4 font-bold text-purple-700">{c.credits}</td>
                    <td className="py-3 px-4 text-slate-500">{c.course_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SEMESTERS */}
      {activeTab === 'semesters' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Semester ID</th>
                <th className="py-3 px-4">Semester Number</th>
                <th className="py-3 px-4">Academic Year</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {semesters.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono text-slate-500">{s.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">Semester {s.semester_number}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{s.academic_year}</td>
                  <td className="py-3 px-4">{s.semester_type}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {s.start_date} to {s.end_date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: FACULTY COURSE MAPPINGS */}
      {activeTab === 'mappings' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowMappingModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Faculty Course Mapping
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Mapping ID</th>
                  <th className="py-3 px-4">Faculty ID</th>
                  <th className="py-3 px-4">Course ID</th>
                  <th className="py-3 px-4">Semester ID</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facultyMappings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{m.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{m.faculty_id}</td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{m.course_id}</td>
                    <td className="py-3 px-4 text-slate-600">{m.semester_id}</td>
                    <td className="py-3 px-4 text-slate-500">{m.academic_year}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteMapping(m.id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition cursor-pointer"
                        title="Remove mapping"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Create New User Account</h2>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ×
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Username / Register No</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="e.g. coe_lead or 24cse099"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@bit.example"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="text"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Password"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="FACULTY">FACULTY</option>
                    <option value="COE">COE</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Register New Academic Course</h2>
              <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ×
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  value={newCourse.course_code}
                  onChange={(e) => setNewCourse({ ...newCourse, course_code: e.target.value })}
                  placeholder="e.g. 24CS401"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={newCourse.course_name}
                  onChange={(e) => setNewCourse({ ...newCourse, course_name: e.target.value })}
                  placeholder="e.g. Deep Learning Systems"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester Number</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    required
                    value={newCourse.semester_number}
                    onChange={(e) => setNewCourse({ ...newCourse, semester_number: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={newCourse.credits}
                    onChange={(e) => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MAPPING MODAL */}
      {showMappingModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Add Faculty-Course Mapping</h2>
              <button onClick={() => setShowMappingModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ×
              </button>
            </div>
            <form onSubmit={handleCreateMapping} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Faculty Member</label>
                <select
                  required
                  value={newMapping.faculty_id}
                  onChange={(e) => setNewMapping({ ...newMapping, faculty_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select Faculty...</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.faculty_code} - {f.first_name} {f.last_name} ({f.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Course</label>
                <select
                  required
                  value={newMapping.course_id}
                  onChange={(e) => setNewMapping({ ...newMapping, course_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select Course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_code} - {c.course_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Semester</label>
                <select
                  required
                  value={newMapping.semester_id}
                  onChange={(e) => setNewMapping({ ...newMapping, semester_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select Semester...</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      Semester {s.semester_number} ({s.academic_year})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMappingModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Create Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
