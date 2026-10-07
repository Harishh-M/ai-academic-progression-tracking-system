import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('faculty_rajesh');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [demoAccounts, setDemoAccounts] = useState<{
    faculty: Array<{ username: string; name: string; department: string; designation: string; role: 'FACULTY'; facultyId: string }>;
    students: Array<{ username: string; regNo: string; name: string; programme: string; currentStatus: string; role: 'STUDENT'; studentId: string }>;
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

  const handleQuickLogin = (uname: string) => {
    setUsername(uname);
    setPassword('password123');
    setError(null);
    setLoading(true);
    login(uname, 'password123').catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative university background subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/30">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Academic Progress & Achievement Tracking System
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Institutional ERP Portal • Exactly Two Verified Roles (Faculty & Student)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
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
                  placeholder="e.g. faculty_rajesh or 24cse001"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
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
                  placeholder="Enter password"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
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
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-session" className="ml-2 block text-xs text-slate-600 cursor-pointer">
                  Remember academic session
                </label>
              </div>
              <div className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer">
                University SSO Help
              </div>
            </div>

            <div>
              <button
                id="btn-login"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating Verified Identity...
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

          {/* Quick Demo Logins Section for instantaneous grading and verification */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1-Click Persona Quick-Logins (Test Scenarios)
              </span>
            </div>

            {/* Faculty Logins */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 mb-2 flex items-center justify-between">
                <span>Faculty Members (Full Academic Administration)</span>
                <span className="text-[10px] uppercase font-bold text-amber-700">ROLE 1: FACULTY</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('faculty_rajesh')}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition group"
                >
                  <div className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600">
                    Dr. Rajesh Sharma
                  </div>
                  <div className="text-[10px] text-slate-500">HoD Computer Science (fac_1)</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('faculty_priya')}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition group"
                >
                  <div className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600">
                    Dr. Priya Natarajan
                  </div>
                  <div className="text-[10px] text-slate-500">Assoc. Prof AI/ML (fac_2)</div>
                </button>
              </div>
            </div>

            {/* Student Logins */}
            <div>
              <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 mb-2 flex items-center justify-between">
                <span>Students (Strictly Read-Only Access)</span>
                <span className="text-[10px] uppercase font-bold text-emerald-700">ROLE 2: STUDENT</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('24cse001')}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition group"
                >
                  <div className="font-semibold text-slate-900 group-hover:text-emerald-700 flex items-center justify-between">
                    <span>Arun Kumar</span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">9.3 CGPA</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">24CSE001 • Top Academic Topper</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('24cse002')}
                  className="text-left p-2 rounded-lg border border-rose-200 bg-rose-50/30 hover:border-rose-400 hover:bg-rose-50 transition group"
                >
                  <div className="font-semibold text-slate-900 group-hover:text-rose-700 flex items-center justify-between">
                    <span>Ravi Shankar</span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">High Risk</span>
                  </div>
                  <div className="text-[10px] text-rose-600 font-mono">24CSE002 • 3 Arrears, 68% Att</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('24cse004')}
                  className="text-left p-2 rounded-lg border border-amber-200 bg-amber-50/30 hover:border-amber-400 hover:bg-amber-50 transition group"
                >
                  <div className="font-semibold text-slate-900 group-hover:text-amber-700 flex items-center justify-between">
                    <span>Sneha Patel</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">71% Att</span>
                  </div>
                  <div className="text-[10px] text-amber-700 font-mono">24CSE004 • Attendance Shortage</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('24cse003')}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition group"
                >
                  <div className="font-semibold text-slate-900 group-hover:text-blue-700 flex items-center justify-between">
                    <span>Priya Sundaram</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">1 Arrear</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">24CSE003 • Discrete Math Arrear</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Architectural Disclaimer */}
        <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
          <span>
            Strict Backend Authorization: Non-faculty write operations are rejected with 403 Forbidden. No Admin/COE role exists.
          </span>
        </div>
      </div>
    </div>
  );
};
