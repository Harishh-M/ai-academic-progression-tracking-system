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
} from 'lucide-react';

export const FacultyAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState<string>('All');
  const [filterAction, setFilterAction] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getAuditLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    if (filterEntity !== 'All' && log.entity_name !== filterEntity) return false;
    if (filterAction !== 'All' && log.action_type !== filterAction) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.user_id.toLowerCase().includes(q) ||
        log.entity_name.toLowerCase().includes(q) ||
        log.action_type.toLowerCase().includes(q) ||
        log.entity_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institutional Audit Trail & Governance Logs</h1>
          <p className="text-xs text-slate-500">
            Immutable tracking of all academic modifications, grade submissions, attendance marks, and verifications
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Audit Logging Active (ISO 27001 / FERPA Compliant)</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by User, Entity ID, Action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        {/* Entity Filter */}
        <div>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="All">All Entities</option>
            <option value="student">Student Dossier</option>
            <option value="attendance">Course Attendance</option>
            <option value="internal_marks">Internal Marks (CIA)</option>
            <option value="semester_results">Semester Grade Sheets</option>
            <option value="achievements">Student Achievements</option>
          </select>
        </div>

        {/* Action Filter */}
        <div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="All">All Actions</option>
            <option value="INSERT">INSERT (Created Record)</option>
            <option value="UPDATE">UPDATE (Modified Value)</option>
            <option value="DELETE">DELETE (Removed Record)</option>
            <option value="VERIFY">VERIFY (Approved Claim)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Total Event Logs: {filteredLogs.length}
          </span>
          <span className="text-xs text-slate-400">Timestamped in UTC</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">User & Role</th>
                <th className="px-5 py-3 text-center">Action</th>
                <th className="px-5 py-3">Target Entity</th>
                <th className="px-5 py-3">Record ID</th>
                <th className="px-5 py-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const isUpdate = log.action_type === 'UPDATE';
                  const isInsert = log.action_type === 'INSERT';
                  const isVerify = log.action_type === 'VERIFY';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{log.user_id}</div>
                        <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                          {log.role}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            isInsert
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isUpdate
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isVerify
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {log.action_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold uppercase tracking-wider text-slate-800 text-[11px]">
                        {log.entity_name}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px]">
                        {log.entity_id}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Diff</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No audit logs matching current filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diff Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Audit Log State Diff</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Action Executed</span>
                  <span className="font-bold text-slate-900">{selectedLog.action_type} on {selectedLog.entity_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Initiated By</span>
                  <span className="font-semibold text-indigo-700">{selectedLog.user_id} ({selectedLog.role})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
                  <span className="font-mono text-slate-800">{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">IP Address</span>
                  <span className="font-mono text-slate-800">{selectedLog.ip_address || '127.0.0.1'}</span>
                </div>
              </div>

              {/* JSON Payload Display */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Previous vs. Committed State</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200">
                    <span className="text-rose-700 font-bold block mb-1">Previous Snapshot</span>
                    <pre className="text-[10px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-40">
                      {selectedLog.previous_value
                        ? JSON.stringify(selectedLog.previous_value, null, 2)
                        : '(None / Initial Creation)'}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                    <span className="text-emerald-700 font-bold block mb-1">New Committed State</span>
                    <pre className="text-[10px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-40">
                      {selectedLog.new_value
                        ? JSON.stringify(selectedLog.new_value, null, 2)
                        : '(None)'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
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
