import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { MetricCard } from '../common/MetricCard.js';
import { RiskBadge } from '../common/RiskBadge.js';
import {
  Users,
  AlertTriangle,
  AlertOctagon,
  CalendarCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ClipboardList,
  GraduationCap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface FacultyDashboardProps {
  onNavigate: (tab: string, studentId?: string) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getStudents(), api.getFacultyReport()])
      .then(([stuList, rep]) => {
        setStudents(stuList);
        setReport(rep);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalStudents = students.length;
  const highRiskStudents = students.filter((s) => s.riskLevel === 'High');
  const mediumRiskStudents = students.filter((s) => s.riskLevel === 'Medium');
  const lowRiskStudents = students.filter((s) => s.riskLevel === 'Low');

  const attendanceShortage = students.filter((s) => s.attendancePercentage < 75);
  const arrearStudents = students.filter((s) => s.currentArrears > 0);

  const avgCGPA =
    totalStudents > 0
      ? (students.reduce((acc, s) => acc + (s.cgpa || 0), 0) / totalStudents).toFixed(2)
      : '0.00';

  const avgAttendance =
    totalStudents > 0
      ? Math.round(students.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / totalStudents)
      : 0;

  const riskData = [
    { name: 'Low Risk', value: lowRiskStudents.length, color: '#3F7D58' },
    { name: 'Medium Risk', value: mediumRiskStudents.length, color: '#B7791F' },
    { name: 'High Risk', value: highRiskStudents.length, color: '#B94A48' },
  ];

  const cgpaDistribution = [
    { bracket: '9.0 - 10.0', count: students.filter((s) => s.cgpa >= 9.0).length },
    { bracket: '8.0 - 8.99', count: students.filter((s) => s.cgpa >= 8.0 && s.cgpa < 9.0).length },
    { bracket: '7.0 - 7.99', count: students.filter((s) => s.cgpa >= 7.0 && s.cgpa < 8.0).length },
    { bracket: '6.0 - 6.99', count: students.filter((s) => s.cgpa >= 6.0 && s.cgpa < 7.0).length },
    { bracket: '< 6.0', count: students.filter((s) => s.cgpa < 6.0).length },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#1E3A5F] border border-[#16304F] rounded-2xl text-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Faculty Academic Administration Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Welcome, {user?.name || 'Professor'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Department of Computer Science & Engineering • B.E. CSE Cohort Academic Progress Overview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('attendance')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => onNavigate('marks')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Enter Marks</span>
          </button>
          <button
            onClick={() => onNavigate('ai-insights')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-slate-300" />
            <span>Academic Analytics</span>
          </button>
        </div>
      </div>

      {/* Top 4 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Enrolled Students"
          value={totalStudents}
          subtitle="Department of CSE (2023-2027)"
          icon={Users}
          accentColor="indigo"
        />
        <MetricCard
          title="Batch Average CGPA"
          value={`${avgCGPA} / 10`}
          subtitle="Overall academic standing"
          icon={GraduationCap}
          accentColor="blue"
        />
        <MetricCard
          title="Average Attendance"
          value={`${avgAttendance}%`}
          subtitle={`${attendanceShortage.length} student(s) < 75% threshold`}
          icon={CalendarCheck}
          accentColor={avgAttendance >= 80 ? 'emerald' : 'amber'}
        />
        <MetricCard
          title="High Risk Alerts"
          value={highRiskStudents.length}
          subtitle={`${arrearStudents.length} student(s) with active arrears`}
          icon={AlertOctagon}
          accentColor={highRiskStudents.length === 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Charts Row: CGPA Distribution & Risk Engine Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CGPA Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Cohort CGPA Grade Distribution</h2>
              <p className="text-xs text-slate-500">Number of students within respective grade ranges</p>
            </div>
            <span className="text-xs font-bold text-[#1E3A5F] bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              Mean: {avgCGPA}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cgpaDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="bracket" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Students" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Breakdown Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Academic Risk Standing</h2>
            <p className="text-xs text-slate-500">Evaluated via transparent rule-based risk engine</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-[#3F7D58] border border-emerald-100 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3F7D58]" />
                <span>Low Risk (Safe)</span>
              </div>
              <span className="font-bold">{lowRiskStudents.length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-[#B7791F] border border-amber-100 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B7791F]" />
                <span>Medium Risk</span>
              </div>
              <span className="font-bold">{mediumRiskStudents.length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 text-[#B94A48] border border-red-100 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B94A48]" />
                <span>High Risk (Intervention Needed)</span>
              </div>
              <span className="font-bold">{highRiskStudents.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Attention Watchlist: High Risk & Attendance Shortage */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#B94A48]" />
              <span>Priority Remedial Watchlist & Academic Interventions</span>
            </h2>
            <p className="text-xs text-slate-500">
              Students identified with active arrears, low attendance (&lt;75%), or CGPA &lt; 6.0
            </p>
          </div>
          <button
            onClick={() => onNavigate('students')}
            className="text-xs font-semibold text-[#1E3A5F] hover:text-[#16304F] flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Roster ({totalStudents})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Register No.</th>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3 text-center">CGPA</th>
                <th className="px-5 py-3 text-center">Attendance</th>
                <th className="px-5 py-3 text-center">Active Arrears</th>
                <th className="px-5 py-3 text-center">Risk Tier</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {highRiskStudents.length > 0 || attendanceShortage.length > 0 ? (
                [...highRiskStudents, ...mediumRiskStudents.filter((m) => m.attendancePercentage < 75)]
                  .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#1E3A5F]">{s.register_number}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{s.student_name}</td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-900">
                        {s.cgpa ? s.cgpa.toFixed(2) : '0.00'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`font-semibold ${
                            s.attendancePercentage >= 75 ? 'text-slate-800' : 'text-[#B94A48] font-bold'
                          }`}
                        >
                          {s.attendancePercentage}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            s.currentArrears === 0
                              ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                              : 'bg-red-50 text-[#B94A48] border-red-200'
                          }`}
                        >
                          {s.currentArrears} Arrear(s)
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <RiskBadge level={s.riskLevel} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onNavigate('academic-progress', s.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#1E3A5F] border border-slate-200 font-medium text-[11px] transition"
                          >
                            Progress Dossier
                          </button>
                          <button
                            onClick={() => onNavigate('ai-insights', s.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[11px] transition flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 text-slate-500" />
                            <span>Analytics</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No high-risk students found. All cohort members meeting benchmark.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
