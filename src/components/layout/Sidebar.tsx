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
  GraduationCap,
  ClipboardList,
  History,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  BookOpen,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { role, user } = useAuth();

  const facultyNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'marks', label: 'Marks', icon: ClipboardList },
    { id: 'results', label: 'Results', icon: GraduationCap },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'academic-progress', label: 'Academic Progress', icon: TrendingUp },
    { id: 'ai-insights', label: 'Academic Analytics', icon: Sparkles, badge: 'Advisor' },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'audit-logs', label: 'Audit Trail', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const studentNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-profile', label: 'My Profile', icon: User },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'marks', label: 'Marks', icon: ClipboardList },
    { id: 'results', label: 'Results', icon: GraduationCap },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'academic-progress', label: 'Academic Progress', icon: TrendingUp },
    { id: 'ai-insights', label: 'Academic Analytics', icon: Sparkles, badge: 'Advisor' },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const coeNav: NavItem[] = [
    { id: 'dashboard', label: 'COE Dashboard', icon: FileCheck },
    { id: 'results', label: 'Review & Publish Results', icon: GraduationCap },
    { id: 'students', label: 'Student Records', icon: Users },
    { id: 'academic-progress', label: 'Academic Progress', icon: TrendingUp },
    { id: 'reports', label: 'Institutional Reports', icon: FileText },
    { id: 'audit-logs', label: 'Audit Trail', icon: History },
  ];

  const adminNav: NavItem[] = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Accounts', icon: Users },
    { id: 'faculty', label: 'Faculty Directory', icon: ShieldCheck },
    { id: 'students', label: 'Student Directory', icon: Users },
    { id: 'courses', label: 'Courses & Curriculum', icon: BookOpen },
    { id: 'mappings', label: 'Course Mappings', icon: Layers },
    { id: 'audit-logs', label: 'Audit Trail', icon: History },
  ];

  const getNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return adminNav;
      case 'COE':
        return coeNav;
      case 'FACULTY':
        return facultyNav;
      case 'STUDENT':
      default:
        return studentNav;
    }
  };

  const navItems = getNavItems();

  const getAvatarInfo = () => {
    switch (role) {
      case 'ADMIN':
        return { initials: 'AD', portal: 'System Administration', bg: 'bg-purple-900/60' };
      case 'COE':
        return { initials: 'CO', portal: 'Controller of Exams', bg: 'bg-amber-900/60' };
      case 'FACULTY':
        return { initials: 'FC', portal: 'Faculty Portal', bg: 'bg-blue-900/60' };
      case 'STUDENT':
      default:
        return { initials: 'ST', portal: 'Student (Read-Only)', bg: 'bg-emerald-900/60' };
    }
  };

  const avatar = getAvatarInfo();

  return (
    <aside className="w-64 bg-[#1E3A5F] border-r border-[#16304F] text-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Role Banner */}
      <div className="p-4 border-b border-[#16304F]">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${avatar.bg} text-white border border-white/20 flex items-center justify-center font-bold text-sm`}>
            {avatar.initials}
          </div>
          <div className="overflow-hidden">
            <div className="font-semibold text-sm text-white truncate">{user?.name}</div>
            <div className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-300" />
              {avatar.portal}
            </div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
          {avatar.portal}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-[#2A4D7A] text-white font-semibold shadow-2xs'
                  : 'text-slate-200 hover:bg-[#16304F] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/15 text-slate-100 border border-white/20">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div className="p-3 border-t border-[#16304F] text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Role: {role}</span>
        </div>
        <span className="font-mono text-[10px]">v2.6 Secure</span>
      </div>
    </aside>
  );
};
