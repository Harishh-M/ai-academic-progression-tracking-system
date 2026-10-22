import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { AuditLogRecord } from '../../types/index.js';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Layers,
  Database,
  Eye,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  History,
  FileText,
} from 'lucide-react';

export const AdminAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterEntity, setFilterEntity] = useState<string>('All');
  const [filterAction, setFilterAction] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

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
  }, [search, filterEntity, filterAction, pageSize]);

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
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLogs = filteredLogs.slice((safePage - 1) * pageSize, safePage * pageSize);
  const startIdx = filteredLogs.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, filteredLogs.length);

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
    const a = (action || '').toUpperCase();
    if (a.includes('CREATE') || a.includes('INSERT')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (a.includes('UPDATE') || a.includes('ALTER') || a.includes('MODIFY')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (a.includes('DELETE') || a.includes('REMOVE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (a.includes('PUBLISH')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (a.includes('LOGIN') || a.includes('AUTH')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
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
            <span className="text-xs text-slate-400">• Security & Integrity</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            <span>Institutional Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system event log recording all administrative modifications, authentication events, and data mutations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by actor, entity, action, IP, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-bold">Entity:</span>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
            >
              <option value="All">All Entities</option>
              <option value="User">User Accounts</option>
              <option value="Faculty">Faculty Masters</option>
              <option value="Student">Student Masters</option>
              <option value="Course">Courses & Curriculum</option>
              <option value="Attendance">Attendance Records</option>
              <option value="SemesterResult">Exam Results</option>
              <option value="FacultyCourseMapping">Mappings</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-bold">Action:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
            >
              <option value="All">All Actions</option>
              <option value="CREATE">CREATE / INSERT</option>
              <option value="UPDATE">UPDATE / MODIFY</option>
              <option value="DELETE">DELETE / REMOVE</option>
              <option value="PUBLISH">PUBLISH RESULTS</option>
              <option value="LOGIN">LOGIN / AUTH</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Showing <strong className="text-purple-700">{filteredLogs.length}</strong> event logs
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                      <span>Loading audit trail...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const act = log.action || log.action_type || 'UNKNOWN';
                  const ent = log.entity_type || log.entity_name || 'SYSTEM';
                  return (
                    <tr key={log.id} className="hover:bg-purple-50/30 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getActionBadgeClass(
                            act
                          )}`}
                        >
                          {act}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{ent}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.entity_id || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{log.user_name || log.user_id || 'System'}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">{log.role || 'ADMIN'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
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
            Showing <span className="font-semibold text-slate-800">{startIdx}</span> to{' '}
            <span className="font-semibold text-slate-800">{endIdx}</span> of{' '}
            <span className="font-semibold text-slate-800">{filteredLogs.length}</span> audit logs
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

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">Audit Event Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Action Type</span>
                  <span className="font-bold text-slate-900">{selectedLog.action || selectedLog.action_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Target Entity</span>
                  <span className="font-bold text-slate-900">{selectedLog.entity_type || selectedLog.entity_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Actor Username</span>
                  <span className="font-mono text-slate-900">{selectedLog.user_name || selectedLog.user_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Timestamp</span>
                  <span className="font-mono text-slate-900">
                    {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : '—'}
                  </span>
                </div>
              </div>

              {(selectedLog.old_value || (selectedLog as any).old_values) && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Previous Values</label>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40">
                    {formatDiffValue(selectedLog.old_value || (selectedLog as any).old_values)}
                  </pre>
                </div>
              )}

              {(selectedLog.new_value || (selectedLog as any).new_values) && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">New Values</label>
                  <pre className="p-3 bg-slate-900 text-purple-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40">
                    {formatDiffValue(selectedLog.new_value || (selectedLog as any).new_values)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
