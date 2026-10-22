import React, { useState } from 'react';
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
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { user, role } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const facultyNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'departments', label: 'Department Directory', icon: Building },
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
    { id: 'departments', label: 'Department Directory', icon: Building },
    { id: 'results', label: 'Review & Publish Results', icon: GraduationCap },
    { id: 'students', label: 'Student Records', icon: Users },
    { id: 'academic-progress', label: 'Academic Progress', icon: TrendingUp },
    { id: 'reports', label: 'Institutional Reports', icon: FileText },
    { id: 'audit-logs', label: 'Audit Trail', icon: History },
  ];

  const adminNav: NavItem[] = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'departments', label: 'Department Directory', icon: Building },
    { id: 'attendance-manager', label: 'Attendance Management', icon: CalendarCheck, badge: 'Central' },
    { id: 'users', label: 'User Accounts', icon: Users },
    { id: 'faculty', label: 'Faculty Directory', icon: ShieldCheck },
    { id: 'students', label: 'Student Directory', icon: Users },
    { id: 'courses', label: 'Courses & Curriculum', icon: BookOpen },
    { id: 'semesters', label: 'Semesters & Terms', icon: Calendar },
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
        return { initials: 'AD', portal: 'Admin', bg: 'bg-purple-900/60' };
      case 'COE':
        return { initials: 'CO', portal: 'COE', bg: 'bg-amber-900/60' };
      case 'FACULTY':
        return { initials: 'FC', portal: 'Faculty', bg: 'bg-blue-900/60' };
      case 'STUDENT':
      default:
        return { initials: 'ST', portal: 'Student', bg: 'bg-emerald-900/60' };
    }
  };

  const avatar = getAvatarInfo();

  return (
    <aside
      className={`relative bg-[#1E3A5F] border-r border-[#16304F] text-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Floating Slide Toggle Button (Positioned on the edge) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-5 z-30 w-7 h-7 rounded-full bg-[#1E3A5F] border-2 border-white text-white hover:bg-[#16304F] shadow-md flex items-center justify-center transition cursor-pointer"
        title={isCollapsed ? 'Slide Right (Expand Sidebar)' : 'Slide Left (Collapse Sidebar)'}
        aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Role Banner / Profile Header */}
      <div className="p-4 border-b border-[#16304F]">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-9 h-9 rounded-lg ${avatar.bg} text-white border border-white/20 flex items-center justify-center font-bold text-sm shrink-0`}>
              {avatar.initials}
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="font-semibold text-sm text-white truncate">{user?.name}</div>
              <div className="text-xs text-slate-300 font-medium truncate">
                {avatar.portal}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-lg ${avatar.bg} text-white border border-white/20 flex items-center justify-center font-bold text-sm shadow-xs`}>
              {avatar.initials}
            </div>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
            {avatar.portal}
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-lg text-sm font-medium transition cursor-pointer ${
                isCollapsed
                  ? 'justify-center p-2.5 my-1'
                  : 'justify-between px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-[#2A4D7A] text-white font-semibold shadow-2xs'
                  : 'text-slate-200 hover:bg-[#16304F] hover:text-white'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && item.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/15 text-slate-100 border border-white/20 shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div className={`p-3 border-t border-[#16304F] text-[11px] text-slate-400 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">Role: {role}</span>
            </div>
            <span className="font-mono text-[10px]">v2.6</span>
          </>
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title={`Role: ${role}`} />
        )}
      </div>
    </aside>
  );
};
