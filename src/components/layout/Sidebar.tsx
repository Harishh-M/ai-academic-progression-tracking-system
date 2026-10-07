import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Award,
  TrendingUp,
  Sparkles,
  FileText,
  User,
  LogOut,
  GraduationCap,
  ClipboardList,
  History,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { role, user, logout } = useAuth();

  const facultyNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'marks', label: 'Marks', icon: ClipboardList },
    { id: 'results', label: 'Results', icon: GraduationCap },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'academic-progress', label: 'Academic Progress', icon: TrendingUp },
    { id: 'ai-insights', label: 'AI Insights', icon: Sparkles, badge: 'AI' },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'audit-logs', label: 'Audit Trail', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const studentNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-profile', label: 'My Profile', icon: User },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'marks', label: 'Marks', icon: ClipboardList },
    { id: 'results', label: 'Results', icon: GraduationCap },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'academic-progress', label: 'Academic Progress', icon: TrendingUp },
    { id: 'ai-insights', label: 'AI Insights', icon: Sparkles, badge: 'AI' },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const navItems = role === 'FACULTY' ? facultyNav : studentNav;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Role Banner */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
              role === 'FACULTY'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {role === 'FACULTY' ? 'FC' : 'ST'}
          </div>
          <div className="overflow-hidden">
            <div className="font-semibold text-sm text-white truncate">{user?.name}</div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              {role === 'FACULTY' ? 'Faculty Portal' : 'Student (Read-Only)'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
          {role === 'FACULTY' ? 'Academic Administration' : 'Student Academic Portal'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-indigo-700 text-amber-300'
                      : 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
