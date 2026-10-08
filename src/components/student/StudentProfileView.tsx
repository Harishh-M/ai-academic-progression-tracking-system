import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Student, CalculatedAcademicMetrics } from '../../types/index.js';
import { RiskBadge, PerformanceBadge } from '../common/RiskBadge.js';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Award,
  Building,
  GraduationCap,
  MapPin,
  FileCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const StudentProfileView: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{ student: Student; metrics: CalculatedAcademicMetrics } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.studentId) {
      setLoading(true);
      api
        .getStudentById(user.studentId)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.studentId]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { student, metrics } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#1E3A5F] text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-xs">
              {student.student_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{student.student_name}</h1>
                <RiskBadge level={metrics.riskLevel} />
                <PerformanceBadge status={metrics.performanceStatus} />
              </div>
              <p className="text-sm font-mono font-semibold text-[#1E3A5F]">{student.register_number}</p>
              <p className="text-xs text-slate-500">{student.programme} • {student.branch}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Official Institutional Record (Read-Only)</span>
          </div>
        </div>
      </div>

      {/* Grid of Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Academic & Institutional Identifiers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
            <GraduationCap className="w-4 h-4 text-[#1E3A5F]" />
            <span>Academic Identity & Enrollment</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Register Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{student.register_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Admission Number</span>
              <span className="font-mono font-semibold text-slate-900">{student.admission_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Academic Bank of Credits (ABC ID)</span>
              <span className="font-mono font-semibold text-[#1E3A5F]">{student.abc_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">UMIS Identifier</span>
              <span className="font-mono text-slate-800">{student.umis_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Degree Programme</span>
              <span className="font-semibold text-slate-900">{student.programme}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Branch / Discipline</span>
              <span className="font-semibold text-slate-900">{student.branch} ({student.branch_code})</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Department</span>
              <span className="text-slate-800">{student.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Academic Batch</span>
              <span className="font-semibold text-slate-900">{student.batch} (Admitted {student.year_of_admission})</span>
            </div>
          </div>
        </div>

        {/* Section 2: Student Status & Fee Compliance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
            <FileCheck className="w-4 h-4 text-[#1E3A5F]" />
            <span>Academic Standing & Status</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Current Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold text-[#3F7D58] bg-emerald-50 border border-emerald-200">
                {student.current_status}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Programme Status</span>
              <span className="font-semibold text-slate-900">{student.programme_status}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Admission Type</span>
              <span className="text-slate-800">{student.admission_type}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Fees Status</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${
                  student.student_fees_status === 'Paid'
                    ? 'text-[#3F7D58] bg-emerald-50 border border-emerald-200'
                    : 'text-[#B7791F] bg-amber-50 border border-amber-200'
                }`}
              >
                {student.student_fees_status}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Readmission Category</span>
              <span className="text-slate-800">{student.readmitted_category}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Degree Conferred Date</span>
              <span className="text-slate-800">{student.degree_awarded_month_year || 'In Progress (Expected 2027)'}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Personal & Contact Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
            <User className="w-4 h-4 text-[#1E3A5F]" />
            <span>Personal & Communication</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Date of Birth</span>
              <span className="font-semibold text-slate-900">{student.date_of_birth}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Gender</span>
              <span className="font-semibold text-slate-900">{student.gender}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">University Email</span>
              <span className="font-mono text-slate-800">{student.email}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">Mobile Number</span>
              <span className="font-mono text-slate-900">{student.mobile_number}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">Residential Campus Address</span>
              <span className="text-slate-700">{student.address}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Current Academic Metrics Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
            <Award className="w-4 h-4 text-[#1E3A5F]" />
            <span>Academic Performance Metrics</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Cumulative Grade Point Average</span>
              <span className="text-xl font-extrabold text-[#1E3A5F]">{metrics.cgpa.toFixed(2)}</span>
              <span className="text-[10px] text-slate-400 block">Out of 10.0 scale</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Current Semester SGPA</span>
              <span className="text-xl font-extrabold text-[#3B6EA5]">{metrics.currentSGPA.toFixed(2)}</span>
              <span className="text-[10px] text-slate-400 block">Semester {metrics.semesterSGPA.length}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Total Attendance Compliance</span>
              <span className="text-base font-bold text-slate-900">{metrics.attendancePercentage}%</span>
              <span className="text-[10px] text-slate-500 block">{metrics.presentClasses}/{metrics.totalClasses} classes attended</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Active / Cleared Arrears</span>
              <span className="text-base font-bold text-slate-900">
                {metrics.currentArrears} active / {metrics.clearedArrears} cleared
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
