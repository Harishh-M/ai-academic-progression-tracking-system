import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  GraduationCap,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickFill = (userVal: string) => {
    setUsername(userVal);
    setPassword('password123');
    setError(null);
  };

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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
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
                Username / Student Register Number / Faculty User ID
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
                  placeholder="Student: reg_number | Faculty: user_id | admin | coe"
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
                  placeholder="Enter password (password123 for all users)"
                  className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F] transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    Verifying Credentials...
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

          {/* Quick Demo Accounts Helper */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Role Logins
              </span>
              <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono font-medium">
                Password: password123 (all users)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="px-3 py-2 text-left rounded-lg border border-slate-200 hover:border-[#1E3A5F] hover:bg-slate-50 transition flex flex-col cursor-pointer"
              >
                <span className="font-semibold text-slate-800">Admin</span>
                <span className="text-slate-500 text-[11px] font-mono">admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('coe')}
                className="px-3 py-2 text-left rounded-lg border border-slate-200 hover:border-[#1E3A5F] hover:bg-slate-50 transition flex flex-col cursor-pointer"
              >
                <span className="font-semibold text-slate-800">COE (Exam Cell)</span>
                <span className="text-slate-500 text-[11px] font-mono">coe</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('FACAD001')}
                className="px-3 py-2 text-left rounded-lg border border-slate-200 hover:border-[#1E3A5F] hover:bg-slate-50 transition flex flex-col cursor-pointer"
              >
                <span className="font-semibold text-slate-800">Faculty (user_id)</span>
                <span className="text-slate-500 text-[11px] font-mono">FACAD001 / AD001</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('7376232BM001')}
                className="px-3 py-2 text-left rounded-lg border border-slate-200 hover:border-[#1E3A5F] hover:bg-slate-50 transition flex flex-col cursor-pointer"
              >
                <span className="font-semibold text-slate-800">Student (reg_number)</span>
                <span className="text-slate-500 text-[11px] font-mono">7376232BM001</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Architectural Disclaimer */}
        <div className="mt-4 p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#1E3A5F] shrink-0" />
          <span>
            Strict Backend Authorization: Passwords securely verified with Bcrypt. Role-based access control strictly enforced on server endpoints.
          </span>
        </div>
      </div>
    </div>
  );
};
