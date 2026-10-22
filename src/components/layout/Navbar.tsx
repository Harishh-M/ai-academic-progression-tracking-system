import React, { useState, useEffect } from 'react';
import { useAuth, getDashboardPath } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  GraduationCap,
  ChevronDown,
  LogOut,
  User,
  Check,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';

interface NavbarProps {
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectTab }) => {
  const { user, role, logout, switchUser } = useAuth();
  const [demoAccounts, setDemoAccounts] = useState<{
    faculty: Array<{ username: string; name: string; department: string; designation: string; role: 'FACULTY'; facultyId: string }>;
    students: Array<{ username: string; regNo: string; name: string; programme: string; currentStatus: string; role: 'STUDENT'; studentId: string }>;
    coe?: Array<{ username: string; name: string; department: string; designation: string; role: 'COE' }>;
    admin?: Array<{ username: string; name: string; department: string; designation: string; role: 'ADMIN' }>;
  } | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);

  useEffect(() => {
    api.getDemoAccounts().then(setDemoAccounts).catch(console.error);
  }, []);

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Admin', color: 'bg-purple-600', text: 'text-purple-700', bg: 'bg-purple-50' };
      case 'COE':
        return { label: 'COE', color: 'bg-amber-600', text: 'text-amber-700', bg: 'bg-amber-50' };
      case 'FACULTY':
        return { label: 'Faculty', color: 'bg-[#1E3A5F]', text: 'text-[#1E3A5F]', bg: 'bg-blue-50' };
      case 'STUDENT':
      default:
        return { label: 'Student', color: 'bg-[#3F7D58]', text: 'text-[#3F7D58]', bg: 'bg-emerald-50' };
    }
  };

  const badge = getRoleBadge();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 text-slate-800 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1E3A5F] flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900">
                Academic Progress & Achievement Tracking System
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Institutional ERP
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              State Technological University • Department of Academic Affairs
            </p>
          </div>
        </div>

        {/* Right: User Role Badge, Fast Persona Switcher, Profile & Logout */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Persona Switcher */}
          <div className="relative">
            <button
              id="btn-persona-switcher"
              onClick={() => setShowSwitcher(!showSwitcher)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition cursor-pointer"
              title="Switch user scenario"
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${badge.color}`} />
                <span className="font-semibold text-slate-900">
                  {badge.label}: {user?.name || user?.username}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showSwitcher && demoAccounts && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Quick Persona Switcher (All 4 Roles)
                  </span>
                  <button
                    onClick={() => setShowSwitcher(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {/* Admin & COE Quick Links */}
                  <div className="py-1">
                    <div className="px-3 py-1 font-semibold text-[10px] text-purple-800 bg-purple-50 uppercase tracking-wider">
                      Executive Roles
                    </div>
                    <button
                      onClick={() => {
                        switchUser('admin');
                        setShowSwitcher(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-purple-600" />
                        <div>
                          <div className="font-semibold text-slate-900">System Administrator</div>
                          <div className="text-[10px] text-slate-500">Full master permissions</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                        ADMIN
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        switchUser('coe');
                        setShowSwitcher(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-amber-600" />
                        <div>
                          <div className="font-semibold text-slate-900">Controller of Examinations</div>
                          <div className="text-[10px] text-slate-500">Approve & Publish Results</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        COE
                      </span>
                    </button>
                  </div>

                  {/* Faculty Section */}
                  <div className="py-1">
                    <div className="px-3 py-1 font-semibold text-[10px] text-slate-700 bg-slate-50 uppercase tracking-wider border-b border-slate-100">
                      Faculty Members
                    </div>
                    {demoAccounts.faculty.slice(0, 3).map((f) => {
                      const isCurrent = user?.username === f.username;
                      return (
                        <button
                          key={f.username}
                          onClick={() => {
                            switchUser(f.username);
                            setShowSwitcher(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer ${
                            isCurrent ? 'bg-slate-100 font-semibold text-[#1E3A5F]' : ''
                          }`}
                        >
                          <div>
                            <div className="text-slate-900 font-medium flex items-center gap-1.5">
                              {f.name}
                              {isCurrent && <Check className="w-3.5 h-3.5 text-[#1E3A5F]" />}
                            </div>
                            <div className="text-[11px] text-slate-500">{f.department}</div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                            Faculty
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Students Section */}
                  <div className="py-1">
                    <div className="px-3 py-1 font-semibold text-[10px] text-slate-700 bg-slate-50 uppercase tracking-wider border-b border-slate-100">
                      Students (Strict Read-Only)
                    </div>
                    {demoAccounts.students.slice(0, 3).map((s) => {
                      const isCurrent = user?.username === s.username;
                      return (
                        <button
                          key={s.username}
                          onClick={() => {
                            switchUser(s.username);
                            setShowSwitcher(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer ${
                            isCurrent ? 'bg-slate-100 font-semibold text-[#1E3A5F]' : ''
                          }`}
                        >
                          <div>
                            <div className="text-slate-900 font-medium flex items-center gap-1.5">
                              {s.name}
                              {isCurrent && <Check className="w-3.5 h-3.5 text-[#1E3A5F]" />}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{s.regNo}</div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                            Student
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Shortcut */}
          {role === 'FACULTY' || role === 'STUDENT' ? (
            <button
              onClick={() => onSelectTab(role === 'FACULTY' ? 'profile' : 'my-profile')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
              title="View Profile"
            >
              <User className="w-4 h-4" />
            </button>
          ) : null}

          {/* Logout */}
          <button
            id="btn-logout"
            onClick={logout}
            className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-[#B94A48] border border-slate-200 transition cursor-pointer"
            title="Logout from ERP"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
