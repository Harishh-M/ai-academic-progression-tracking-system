import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  GraduationCap,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
  FileCheck,
  ShieldAlert,
  Award,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [demoAccounts, setDemoAccounts] = useState<{
    faculty: Array<{ username: string; name: string; department: string; designation: string; role: 'FACULTY'; facultyId: string }>;
    students: Array<{ username: string; regNo: string; name: string; programme: string; currentStatus: string; role: 'STUDENT'; studentId: string }>;
    coe?: Array<{ username: string; name: string; department: string; designation: string; role: 'COE' }>;
    admin?: Array<{ username: string; name: string; department: string; designation: string; role: 'ADMIN' }>;
  } | null>(null);

  useEffect(() => {
    api.getDemoAccounts().then(setDemoAccounts).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username or institutional email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname: string, pwd = 'password123') => {
    setUsername(uname);
    setPassword(pwd);
    setError(null);
    setLoading(true);
    login(uname, pwd).catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1E3A5F] flex items-center justify-center text-white shadow-sm border border-[#16304F]">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#1E293B] sm:text-3xl">
          Academic Progress & Achievement Tracking System
        </h2>
        <p className="mt-2 text-center text-sm text-[#64748B]">
          Institutional ERP Portal • Unified Access for Student, Faculty, COE & Admin
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl sm:px-10 border border-[#E2E8F0]">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-[#B94A48] text-sm">
              <AlertCircle className="w-5 h-5 text-[#B94A48] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Authentication Error</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Username or Institutional Email
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="input-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, coe, faculty_rajesh, or 24cse001"
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F] transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (default: password123)"
                  className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F] transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-session"
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="h-4 w-4 text-[#1E3A5F] focus:ring-[#1E3A5F] border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-session" className="ml-2 block text-xs text-slate-600 cursor-pointer">
                  Remember academic session
                </label>
              </div>
              <div className="text-xs text-[#1E3A5F] font-medium hover:underline cursor-pointer">
                University SSO Help
              </div>
            </div>

            <div>
              <button
                id="btn-login"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg shadow-xs text-sm font-bold text-white bg-[#1E3A5F] hover:bg-[#16304F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A5F] disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying Credentials (Bcrypt)...
                  </span>
                ) : (
                  <>
                    <span>Sign In to Academic Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Logins Section - All 4 Roles */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1-Click Quick-Login Personas (All 4 Roles)
              </span>
            </div>

            {/* 1. ADMIN & 2. COE Logins */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
              <button
                type="button"
                id="btn-quick-admin"
                onClick={() => handleQuickLogin('admin', 'password123')}
                className="text-left p-2.5 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 hover:border-purple-400 transition group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-xs text-purple-900 group-hover:text-purple-950 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                    Administrator
                  </div>
                  <span className="text-[9px] uppercase font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">ADMIN</span>
                </div>
                <div className="text-[10px] text-purple-700 font-mono">admin • /admin/dashboard</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Manage Users, Mappings & Masters</div>
              </button>

              <button
                type="button"
                id="btn-quick-coe"
                onClick={() => handleQuickLogin('coe', 'password123')}
                className="text-left p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 hover:border-amber-400 transition group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-xs text-amber-900 group-hover:text-amber-950 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                    Controller of Exams
                  </div>
                  <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">COE</span>
                </div>
                <div className="text-[10px] text-amber-700 font-mono">coe • /coe/dashboard</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Review, Approve & Publish Results</div>
              </button>
            </div>

            {/* 3. Faculty Logins */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 mb-2 flex items-center justify-between">
                <span>Faculty Members (Course & Student Administration)</span>
                <span className="text-[10px] uppercase font-bold text-[#1E3A5F]">FACULTY ROLE</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-quick-faculty-1"
                  onClick={() => handleQuickLogin('faculty_rajesh', 'password123')}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#1E3A5F] hover:bg-slate-50 transition group cursor-pointer"
                >
                  <div className="font-semibold text-xs text-slate-900 group-hover:text-[#1E3A5F]">
                    Dr. Rajesh Sharma
                  </div>
                  <div className="text-[10px] text-slate-500">HoD CSE • /faculty/dashboard</div>
                </button>
                <button
                  type="button"
                  id="btn-quick-faculty-2"
                  onClick={() => handleQuickLogin('AD001', 'password123')}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#1E3A5F] hover:bg-slate-50 transition group cursor-pointer"
                >
                  <div className="font-semibold text-xs text-slate-900 group-hover:text-[#1E3A5F]">
                    Faculty AD001
                  </div>
                  <div className="text-[10px] text-slate-500">Dept Faculty • /faculty/dashboard</div>
                </button>
              </div>
            </div>

            {/* 4. Student Logins */}
            <div>
              <div className="text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 mb-2 flex items-center justify-between">
                <span>Students (Strictly Read-Only Access)</span>
                <span className="text-[10px] uppercase font-bold text-[#1E3A5F]">STUDENT ROLE</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  id="btn-quick-student-1"
                  onClick={() => handleQuickLogin('24cse001', 'password123')}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition group cursor-pointer"
                >
                  <div className="font-semibold text-slate-900 flex items-center justify-between">
                    <span>Arun Kumar</span>
                    <span className="text-[10px] font-semibold text-[#3F7D58] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Topper</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">24CSE001 • /student/dashboard</div>
                </button>

                <button
                  type="button"
                  id="btn-quick-student-2"
                  onClick={() => handleQuickLogin('7376232AD001', 'password123')}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition group cursor-pointer"
                >
                  <div className="font-semibold text-slate-900 flex items-center justify-between">
                    <span>Tharanirani N</span>
                    <span className="text-[10px] font-semibold text-[#3B6EA5] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Active</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">7376232AD001 • /student/dashboard</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Architectural Disclaimer */}
        <div className="mt-4 p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#1E3A5F] shrink-0" />
          <span>
            Strict Backend Authorization: Passwords securely verified with Bcrypt. Role permissions strictly enforced on server endpoints.
          </span>
        </div>
      </div>
    </div>
  );
};
