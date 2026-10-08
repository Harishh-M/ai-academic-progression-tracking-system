import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  User,
  ShieldCheck,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const isFaculty = user.role === 'FACULTY';
  const faculty = isFaculty ? (user as any) : null;
  const student = !isFaculty ? (user as any) : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header Banner */}
      <div className="bg-[#1E3A5F] rounded-2xl text-white p-8 shadow-xs border border-[#16304F] relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-[#16304F] border border-white/20 text-white flex items-center justify-center font-bold text-3xl shadow-xs">
            {user.name.charAt(0)}
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isFaculty ? 'Institutional Faculty / Professor' : 'Undergraduate Student Member'}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <p className="text-xs text-slate-300">
              Department of Computer Science & Engineering • State Technological University
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <User className="w-4 h-4 text-[#1E3A5F]" />
            <span>Institutional Profile & Academic Credentials</span>
          </h2>
          <span className="text-xs text-[#3F7D58] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold">
            Account Status: Active
          </span>
        </div>

        {isFaculty ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Faculty Code</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{faculty.employee_id || faculty.faculty_code || 'FAC-CSE-001'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Designation</span>
              <span className="font-semibold text-slate-900 text-sm">{faculty.designation || 'Associate Professor'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Academic Department</span>
              <span className="font-semibold text-slate-900 text-sm">{faculty.department || 'Computer Science & Engineering'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Official Email Address</span>
              <span className="font-semibold text-slate-900 text-sm">{faculty.email}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Contact Mobile</span>
              <span className="font-semibold text-slate-900 text-sm">{faculty.mobile_number || '+91 98765 43210'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Assigned Subject Load</span>
              <span className="font-semibold text-[#1E3A5F] text-sm">
                Data Structures (CS202), DBMS (CS301)
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">University Register No</span>
              <span className="font-mono font-bold text-[#1E3A5F] text-sm">{student.register_number}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Admission Number</span>
              <span className="font-mono font-semibold text-slate-900 text-sm">{student.admission_number}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">ABC ID</span>
              <span className="font-mono font-semibold text-slate-900 text-sm">{student.abc_id}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">State UMIS Number</span>
              <span className="font-mono font-semibold text-slate-900 text-sm">{student.umis_number}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Programme</span>
              <span className="font-semibold text-slate-900 text-sm">{student.programme}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Batch & Cohort</span>
              <span className="font-semibold text-slate-900 text-sm">{student.batch}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
