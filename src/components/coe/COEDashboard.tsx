import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { SemesterResultRecord, Course, Semester } from '../../types/index.js';
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
} from 'lucide-react';

export const COEDashboard: React.FC = () => {
  const [results, setResults] = useState<SemesterResultRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, courseData, semData] = await Promise.all([
        api.getResults(),
        api.getCourses(),
        api.getSemesters(),
      ]);
      setResults(resData);
      setCourses(courseData);
      setSemesters(semData);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load semester results' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const courseMap = new Map<string, Course>(courses.map((c) => [c.id, c]));

  // Filtering
  const filtered = results.filter((r) => {
    if (selectedSemester !== 'all' && r.semester_id !== selectedSemester) return false;
    if (statusFilter === 'Pass' && r.result_status !== 'Pass') return false;
    if (statusFilter === 'Fail' && r.result_status !== 'Fail') return false;
    if (statusFilter === 'Pending' && r.published_date) return false;
    if (statusFilter === 'Published' && !r.published_date) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const course = courseMap.get(r.course_id);
      const matchStu = r.student_id.toLowerCase().includes(q);
      const matchCourse = course?.course_name.toLowerCase().includes(q) || course?.course_code.toLowerCase().includes(q);
      if (!matchStu && !matchCourse) return false;
    }
    return true;
  });

  const totalCount = results.length;
  const passedCount = results.filter((r) => r.result_status === 'Pass' || r.grade_point > 0).length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const publishedCount = results.filter((r) => !!r.published_date).length;
  const pendingCount = totalCount - publishedCount;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              Controller of Examinations Portal
            </span>
            <span className="text-xs text-slate-400">• Institutional Evaluation Division</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Official Semester Results & Evaluation Review
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sole Authorized Office: Review grade sheets, verify SGPA/credits, approve and publish official grade transcripts.
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
          <button
            onClick={handlePublishSelected}
            disabled={publishing || selectedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {publishing ? 'Publishing...' : `Approve & Publish Selected (${selectedIds.size})`}
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

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student ID or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Semesters</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                Semester {s.semester_number} ({s.academic_year})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Pass">Pass Only</option>
            <option value="Fail">Fail (Arrears) Only</option>
            <option value="Published">Officially Published</option>
            <option value="Pending">Unpublished / Draft</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={selectAllFiltered}
            className="text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            {selectedIds.size === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All Filtered'}
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={selectAllFiltered}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                </th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Grade Point</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Publication Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading academic records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No semester results found matching current criteria.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map((r) => {
                  const course = courseMap.get(r.course_id);
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
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{r.student_id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {course ? course.course_name : r.course_id}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {course ? course.course_code : r.course_id}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.grade}</td>
                      <td className="py-3 px-4 font-mono">{r.grade_point.toFixed(1)}</td>
                      <td className="py-3 px-4 font-mono">{r.credits}</td>
                      <td className="py-3 px-4">
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
                            Published ({r.published_date?.split('T')[0]})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Awaiting Publication
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
