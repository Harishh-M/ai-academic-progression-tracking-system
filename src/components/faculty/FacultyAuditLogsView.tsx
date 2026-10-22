import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { AuditLogRecord } from '../../types/index.js';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  UserCheck,
  Layers,
  Database,
  ArrowRight,
  Eye,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  History,
} from 'lucide-react';

export const FacultyAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState<string>('All');
  const [filterAction, setFilterAction] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchLogs = () => {
    setLoading(true);
    api
      .getAuditLogs()
      .then((data) => {
        setLogs(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterEntity, filterAction]);

  const filteredLogs = logs.filter((log) => {
    const action = (log.action || log.action_type || '').toUpperCase();
    const entity = (log.entity_type || log.entity_name || '').toUpperCase();

    if (filterEntity !== 'All' && entity !== filterEntity.toUpperCase()) {
      return false;
    }

    if (filterAction !== 'All') {
      if (filterAction === 'CREATE' && !['CREATE', 'INSERT'].some((a) => action.includes(a))) return false;
      else if (filterAction === 'UPDATE' && !action.includes('UPDATE')) return false;
      else if (filterAction === 'DELETE' && !action.includes('DELETE')) return false;
      else if (filterAction === 'LOGIN' && !action.includes('LOGIN')) return false;
      else if (filterAction === 'PUBLISH' && !action.includes('PUBLISH')) return false;
      else if (!action.includes(filterAction.toUpperCase())) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (log.user_id || '').toLowerCase().includes(q) ||
        (log.user_name || '').toLowerCase().includes(q) ||
        entity.toLowerCase().includes(q) ||
        action.toLowerCase().includes(q) ||
        (log.entity_id || '').toLowerCase().includes(q) ||
        (log.ip_address || '').toLowerCase().includes(q) ||
        (log.role || '').toLowerCase().includes(q)
      );
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = pageSize === -1 ? filteredLogs : filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startIdx = filteredLogs.length === 0 ? 0 : (currentPage - 1) * (pageSize === -1 ? filteredLogs.length : pageSize) + 1;
  const endIdx = pageSize === -1 ? filteredLogs.length : Math.min(currentPage * pageSize, filteredLogs.length);

  const formatDiffValue = (val: any) => {
    if (!val) return '(None / Initial Creation)';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(val);
    }
  };

  const getActionBadgeClass = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes('CREATE') || a.includes('INSERT')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (a.includes('UPDATE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (a.includes('PUBLISH')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (a.includes('LOGIN')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (a.includes('DELETE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600" />
            Institutional Audit Trail & Governance Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable tracking of all academic modifications, grade submissions, attendance marks, and verifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            Refresh
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit Active (FERPA & Statutory Compliant)</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by User, Name, Entity ID, Action, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition"
          />
        </div>

        {/* Entity Filter */}
        <div>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition"
          >
            <option value="All">All Entities</option>
            <option value="MARKS">Internal Marks (CIA)</option>
            <option value="ATTENDANCE">Course Attendance</option>
            <option value="STUDENT">Student Records</option>
            <option value="SEMESTER_RESULTS">Semester Grade Sheets</option>
            <option value="ACHIEVEMENT">Student Achievements</option>
            <option value="FACULTY">Faculty Directory</option>
            <option value="USER">User Accounts & Auth</option>
          </select>
        </div>

        {/* Action Filter */}
        <div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition"
          >
            <option value="All">All Actions</option>
            <option value="CREATE">CREATE / INSERT</option>
            <option value="UPDATE">UPDATE (Modified Value)</option>
            <option value="DELETE">DELETE (Removed Record)</option>
            <option value="LOGIN">LOGIN (Authentication Event)</option>
            <option value="PUBLISH">PUBLISH (Results)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Total Audit Logs ({filteredLogs.length})
            </span>
            {filteredLogs.length > 0 && (
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                Showing {startIdx}–{endIdx} of {filteredLogs.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">User & Initiator</th>
                <th className="px-5 py-3 text-center">Action</th>
                <th className="px-5 py-3">Target Entity</th>
                <th className="px-5 py-3">Record ID</th>
                <th className="px-5 py-3">IP Address</th>
                <th className="px-5 py-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading secure institutional audit trails...
                  </td>
                </tr>
              ) : paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => {
                  const action = log.action || log.action_type || 'UNKNOWN';
                  const entity = log.entity_type || log.entity_name || 'SYSTEM';
                  const timestampStr = log.timestamp || log.created_at;
                  const dateFormatted = timestampStr ? new Date(timestampStr).toLocaleString() : 'N/A';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                        {dateFormatted}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{log.user_name || log.user_id}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400">{log.user_id}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            {log.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${getActionBadgeClass(
                            action
                          )}`}
                        >
                          {action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold uppercase tracking-wider text-slate-800 text-[11px]">
                        {entity}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px]">
                        {log.entity_id || '—'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-purple-600" />
                          <span>View Diff</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No audit logs matching current filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
              <strong className="text-slate-800">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronsLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Previous Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let pageNum = currentPage;
                if (currentPage <= 3) {
                  pageNum = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + idx;
                } else {
                  pageNum = currentPage - 2 + idx;
                }
                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                      currentPage === pageNum
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Next Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Last Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronsRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Diff Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">Audit Log State Diff Inspection</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Action Executed</span>
                  <span className="font-bold text-slate-900">
                    {selectedLog.action || selectedLog.action_type} on {selectedLog.entity_type || selectedLog.entity_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Initiated By</span>
                  <span className="font-semibold text-purple-700">
                    {selectedLog.user_name || selectedLog.user_id} ({selectedLog.role})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
                  <span className="font-mono text-slate-800">
                    {new Date(selectedLog.timestamp || selectedLog.created_at || Date.now()).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Record ID / IP</span>
                  <span className="font-mono text-slate-800">
                    {selectedLog.entity_id || '—'} ({selectedLog.ip_address || '127.0.0.1'})
                  </span>
                </div>
              </div>

              {/* JSON Payload Display */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Previous Snapshot vs. Committed State</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200">
                    <span className="text-rose-700 font-bold block mb-1">Previous Snapshot</span>
                    <pre className="text-[10px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-48">
                      {formatDiffValue(selectedLog.old_value || selectedLog.previous_value)}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                    <span className="text-emerald-700 font-bold block mb-1">New Committed State</span>
                    <pre className="text-[10px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-48">
                      {formatDiffValue(selectedLog.new_value)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close Diff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
