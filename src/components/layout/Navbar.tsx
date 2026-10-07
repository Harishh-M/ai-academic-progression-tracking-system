import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  GraduationCap,
  UserCheck,
  ChevronDown,
  LogOut,
  Sparkles,
  ShieldCheck,
  User,
  Check,
} from 'lucide-react';

interface NavbarProps {
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectTab }) => {
  const { user, role, logout, switchUser } = useAuth();
  const [demoAccounts, setDemoAccounts] = useState<{
    faculty: Array<{ username: string; name: string; department: string; designation: string; role: 'FACULTY'; facultyId: string }>;
    students: Array<{ username: string; regNo: string; name: string; programme: string; currentStatus: string; role: 'STUDENT'; studentId: string }>;
  } | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);

  useEffect(() => {
    api.getDemoAccounts().then(setDemoAccounts).catch(console.error);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                Academic Progress & Achievement Tracking System
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                <Sparkles className="w-3 h-3 text-amber-400" /> AI-Powered ERP
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
              title="Switch user scenario"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    role === 'FACULTY' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="font-semibold text-white">
                  {role === 'FACULTY' ? 'Faculty' : 'Student'}: {user?.name || user?.username}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showSwitcher && demoAccounts && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Quick Persona Switcher
                  </span>
                  <button
                    onClick={() => setShowSwitcher(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {/* Faculty Section */}
                  <div className="py-1">
                    <div className="px-3 py-1 font-semibold text-[11px] text-amber-700 bg-amber-50 uppercase tracking-wider">
                      Faculty Members (Edit & Manage)
                    </div>
                    {demoAccounts.faculty.map((f) => {
                      const isCurrent = user?.username === f.username;
                      return (
                        <button
                          key={f.username}
                          onClick={() => {
                            switchUser(f.username);
                            setShowSwitcher(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition ${
                            isCurrent ? 'bg-indigo-50/70 font-semibold' : ''
                          }`}
                        >
                          <div>
                            <div className="text-slate-900 font-medium flex items-center gap-1.5">
                              {f.name}
                              {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                            </div>
                            <div className="text-[11px] text-slate-500">{f.designation}</div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
                            Faculty
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Students Section */}
                  <div className="py-1">
                    <div className="px-3 py-1 font-semibold text-[11px] text-emerald-700 bg-emerald-50 uppercase tracking-wider">
                      Students (Strict Read-Only)
                    </div>
                    {demoAccounts.students.slice(0, 7).map((s) => {
                      const isCurrent = user?.username === s.username;
                      let badge = 'Student';
                      if (s.regNo === '24CSE001') badge = '⭐ 9.3 CGPA';
                      else if (s.regNo === '24CSE002') badge = '⚠️ High Risk (3 Arrears)';
                      else if (s.regNo === '24CSE004') badge = '⚠️ 71% Attendance';
                      else if (s.regNo === '24CSE003') badge = '1 Arrear';

                      return (
                        <button
                          key={s.username}
                          onClick={() => {
                            switchUser(s.username);
                            setShowSwitcher(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition ${
                            isCurrent ? 'bg-indigo-50/70 font-semibold' : ''
                          }`}
                        >
                          <div>
                            <div className="text-slate-900 font-medium flex items-center gap-1.5">
                              {s.name}
                              {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{s.regNo}</div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-medium">
                            {badge}
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
          <button
            onClick={() => onSelectTab(role === 'FACULTY' ? 'profile' : 'my-profile')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="View Profile"
          >
            <User className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            id="btn-logout"
            onClick={logout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-400 transition"
            title="Logout from ERP"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
