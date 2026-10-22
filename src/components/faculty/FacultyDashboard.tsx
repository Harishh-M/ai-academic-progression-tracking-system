import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { MetricCard } from '../common/MetricCard.js';
import { RiskBadge } from '../common/RiskBadge.js';
import { GradeChip } from '../common/GradeChip.js';
import {
  Users,
  AlertTriangle,
  AlertOctagon,
  CalendarCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ClipboardList,
  GraduationCap,
  Award,
  Building,
  Filter,
  Lock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Eye,
  X,
  BookOpen,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface FacultyDashboardProps {
  onNavigate: (tab: string, studentId?: string) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [, setReport] = useState<any | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<number>(0);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [semesters, setSemesters] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedPrevSemId, setSelectedPrevSemId] = useState<string>('');
  const [prevSemResults, setPrevSemResults] = useState<any[]>([]);
  const [prevSemLoading, setPrevSemLoading] = useState(false);
  const [studentBreakdownModal, setStudentBreakdownModal] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getStudents(),
      api.getFacultyReport(),
      api.getAchievements().catch(() => []),
      api.getSemesters().catch(() => []),
      api.getCourses().catch(() => []),
    ])
      .then(([stuList, rep, achList, semList, courseList]) => {
        setStudents(stuList);
        setReport(rep);
        setPendingAchievements((achList || []).filter((a: any) => a.verification_status === 'Pending').length);
        setSemesters(semList || []);
        setCourses(courseList || []);

        // Previous completed semesters are typically semester_number < 4
        const prevSems = (semList || []).filter((s: any) => s.semester_number < 4);
        if (prevSems.length > 0) {
          // Default to the latest completed previous semester (e.g. sem_2 or sem_1)
          const latestPrev = [...prevSems].sort((a: any, b: any) => b.semester_number - a.semester_number)[0];
          setSelectedPrevSemId(latestPrev.id);
        } else if (semList && semList.length > 0) {
          setSelectedPrevSemId(semList[0].id);
        }

        // Default to faculty member's department, or first available department
        const facultyDept = (profile as any)?.department || (rep as any)?.faculty?.department;
        if (facultyDept) {
          setSelectedDepartment(facultyDept);
        } else if (stuList.length > 0) {
          const depts = Array.from(new Set(stuList.map((s: any) => s.department).filter(Boolean)));
          setSelectedDepartment((depts[0] as string) || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  // Fetch results whenever previous semester changes
  useEffect(() => {
    if (selectedPrevSemId) {
      setPrevSemLoading(true);
      api
        .getResults({ semesterId: selectedPrevSemId })
        .then((res) => {
          setPrevSemResults(res || []);
        })
        .catch(console.error)
        .finally(() => setPrevSemLoading(false));
    }
  }, [selectedPrevSemId]);

  // Get distinct list of departments with student count
  const departmentCounts: Record<string, number> = {};
  students.forEach((s) => {
    if (s.department) {
      departmentCounts[s.department] = (departmentCounts[s.department] || 0) + 1;
    }
  });
  const departments = Object.keys(departmentCounts).sort();

  // Filter students by selected department
  const departmentStudents = selectedDepartment
    ? students.filter((s) => s.department === selectedDepartment)
    : students;

  const totalStudents = departmentStudents.length;
  const highRiskStudents = departmentStudents.filter((s) => s.riskLevel === 'High');
  const mediumRiskStudents = departmentStudents.filter((s) => s.riskLevel === 'Medium');
  const lowRiskStudents = departmentStudents.filter((s) => s.riskLevel === 'Low');

  const attendanceShortage = departmentStudents.filter((s) => s.attendancePercentage < 75);
  const arrearStudents = departmentStudents.filter((s) => s.currentArrears > 0);

  const avgCGPA =
    totalStudents > 0
      ? (departmentStudents.reduce((acc, s) => acc + (s.cgpa || 0), 0) / totalStudents).toFixed(2)
      : '0.00';

  const avgAttendance =
    totalStudents > 0
      ? Math.round(departmentStudents.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / totalStudents)
      : 0;

  const riskData = [
    { name: 'Low Risk', value: lowRiskStudents.length, color: '#3F7D58' },
    { name: 'Medium Risk', value: mediumRiskStudents.length, color: '#B7791F' },
    { name: 'High Risk', value: highRiskStudents.length, color: '#B94A48' },
  ];

  const cgpaDistribution = [
    { bracket: '9.0 - 10.0', count: departmentStudents.filter((s) => s.cgpa >= 9.0).length },
    { bracket: '8.0 - 8.99', count: departmentStudents.filter((s) => s.cgpa >= 8.0 && s.cgpa < 9.0).length },
    { bracket: '7.0 - 7.99', count: departmentStudents.filter((s) => s.cgpa >= 7.0 && s.cgpa < 8.0).length },
    { bracket: '6.0 - 6.99', count: departmentStudents.filter((s) => s.cgpa >= 6.0 && s.cgpa < 7.0).length },
    { bracket: '< 6.0', count: departmentStudents.filter((s) => s.cgpa < 6.0).length },
  ];

  const facultyDept = (profile as any)?.department;

  // Map of courses for lookup
  const courseMap = useMemo(() => new Map<string, any>(courses.map((c) => [c.id, c])), [courses]);

  // Previous completed semesters (e.g. semesters with semester_number < 4 or all sorted)
  const previousSemesters = useMemo(() => {
    const list = (semesters || []).filter((s) => s.semester_number < 4);
    return list.length > 0
      ? list.sort((a, b) => a.semester_number - b.semester_number)
      : (semesters || []).sort((a, b) => a.semester_number - b.semester_number);
  }, [semesters]);

  const activePrevSem = useMemo(() => {
    return semesters.find((s) => s.id === selectedPrevSemId) || previousSemesters[0];
  }, [semesters, selectedPrevSemId, previousSemesters]);

  // Aggregate student stats for the selected previous semester
  const prevSemStudentSummary = useMemo(() => {
    const studentResultsMap: Record<string, any[]> = {};
    prevSemResults.forEach((r) => {
      if (!studentResultsMap[r.student_id]) {
        studentResultsMap[r.student_id] = [];
      }
      studentResultsMap[r.student_id].push(r);
    });

    return departmentStudents.map((s) => {
      const records = studentResultsMap[s.id] || [];
      let totalCredits = 0;
      let earnedCredits = 0;
      let totalPoints = 0;
      let passedCourses = 0;
      let arrearCourses = 0;

      records.forEach((r) => {
        const cr = Number(r.credits) || 0;
        const gp = Number(r.grade_point) || 0;
        totalCredits += cr;
        totalPoints += cr * gp;
        if (r.result_status === 'Pass' && gp > 0) {
          earnedCredits += cr;
          passedCourses++;
        } else {
          arrearCourses++;
        }
      });

      const sgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
      const hasRecords = records.length > 0;

      return {
        student: s,
        records,
        totalCredits,
        earnedCredits,
        sgpa,
        passedCourses,
        arrearCourses,
        hasRecords,
        isCleared: hasRecords && arrearCourses === 0,
      };
    });
  }, [departmentStudents, prevSemResults]);

  // Summary statistics for previous semester
  const prevSemStats = useMemo(() => {
    const studentsWithRecords = prevSemStudentSummary.filter((s) => s.hasRecords);
    const count = studentsWithRecords.length;
    if (count === 0) {
      return { count: 0, passRate: 0, avgSGPA: '0.00', clearedCount: 0, arrearCount: 0 };
    }

    const clearedCount = studentsWithRecords.filter((s) => s.isCleared).length;
    const arrearCount = studentsWithRecords.filter((s) => s.arrearCourses > 0).length;
    const passRate = Math.round((clearedCount / count) * 100);
    const avgSGPA = (
      studentsWithRecords.reduce((acc, s) => acc + s.sgpa, 0) / count
    ).toFixed(2);

    return { count, passRate, avgSGPA, clearedCount, arrearCount };
  }, [prevSemStudentSummary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#1E3A5F] border border-[#16304F] rounded-2xl text-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Faculty Academic Administration Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Welcome, {user?.name || 'Professor'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Department-Wise Cohort Academic Standing & Performance Monitoring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('attendance')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Attendance Register</span>
          </button>
          <button
            onClick={() => onNavigate('marks')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Enter Marks</span>
          </button>
          <button
            onClick={() => onNavigate('achievements')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              pendingAchievements > 0
                ? 'bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border-amber-400/40'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>
              Review Achievements {pendingAchievements > 0 ? `(${pendingAchievements})` : ''}
            </span>
          </button>
          <button
            onClick={() => onNavigate('ai-insights')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-300" />
            <span>Academic Analytics</span>
          </button>
        </div>
      </div>

      {/* Department Filter Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E3A5F]">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Department Cohort View:</span>
              <span className="text-[#1E3A5F]">{selectedDepartment || 'All Departments'}</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Displaying {totalStudents} student records filtered by academic department (out of {students.length} total across institution)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="dept-select" className="font-bold text-slate-700 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Select Department:</span>
          </label>
          <select
            id="dept-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept} ({departmentCounts[dept]} students)
              </option>
            ))}
          </select>

          {facultyDept && selectedDepartment !== facultyDept && (
            <button
              onClick={() => setSelectedDepartment(facultyDept)}
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1E3A5F] font-bold rounded-lg border border-blue-200 text-[11px] transition cursor-pointer"
              title="Reset to your department"
            >
              My Dept
            </button>
          )}
        </div>
      </div>

      {/* Top 4 Key Metrics for Selected Department */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Department Students"
          value={totalStudents}
          subtitle={`${selectedDepartment} (Cohort 2023-2027)`}
          icon={Users}
          accentColor="indigo"
        />
        <MetricCard
          title="Department Average CGPA"
          value={`${avgCGPA} / 10`}
          subtitle="Cumulative academic performance"
          icon={GraduationCap}
          accentColor="blue"
        />
        <MetricCard
          title="Average Attendance"
          value={`${avgAttendance}%`}
          subtitle={`${attendanceShortage.length} student(s) < 75% threshold`}
          icon={CalendarCheck}
          accentColor={avgAttendance >= 80 ? 'emerald' : 'amber'}
        />
        <MetricCard
          title="High Risk Alerts"
          value={highRiskStudents.length}
          subtitle={`${arrearStudents.length} student(s) with active arrears`}
          icon={AlertOctagon}
          accentColor={highRiskStudents.length === 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Charts Row: CGPA Distribution & Risk Engine Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CGPA Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Department CGPA Grade Distribution</h2>
              <p className="text-xs text-slate-500">
                Cohort standing for {selectedDepartment}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Active Cohort: {totalStudents} Students
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cgpaDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="bracket" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#1E3A5F" radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Breakdown Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Risk Distribution Engine</h2>
            <p className="text-xs text-slate-500">
              Automated institutional risk stratification
            </p>
          </div>

          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-100">
            <div>
              <span className="block font-bold text-[#3F7D58]">{lowRiskStudents.length}</span>
              <span className="text-[11px] text-slate-500">Low Risk</span>
            </div>
            <div>
              <span className="block font-bold text-[#B7791F]">{mediumRiskStudents.length}</span>
              <span className="text-[11px] text-slate-500">Medium</span>
            </div>
            <div>
              <span className="block font-bold text-[#B94A48]">{highRiskStudents.length}</span>
              <span className="text-[11px] text-slate-500">High Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* PREVIOUS SEMESTER EXAMINATION RESULTS & COHORT PERFORMANCE (READ-ONLY ARCHIVE) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#1E3A5F]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>Previous Semester Examination Results Ledger</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    Semester {activePrevSem?.semester_number || 1}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Certified historical semester end grades & SGPA evaluation records for {selectedDepartment} cohort
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>COE Controlled • Read-Only Faculty View</span>
            </div>
            <button
              onClick={() => onNavigate('results')}
              className="px-3.5 py-1.5 rounded-xl bg-[#1E3A5F] hover:bg-[#16304F] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Full Results Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Semester Selector Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#1E3A5F]" />
              <span>Select Previous Semester:</span>
            </span>

            {previousSemesters.map((sem) => {
              const isSelected = selectedPrevSemId === sem.id;
              return (
                <button
                  key={sem.id}
                  onClick={() => setSelectedPrevSemId(sem.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#1E3A5F] text-white shadow-xs ring-2 ring-blue-400/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>
                    Semester {sem.semester_number} ({sem.academic_year} - {sem.semester_type})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Official End Semester Exam Results Published by COE
          </div>
        </div>

        {/* Statutory Governance Callout */}
        <div className="mx-5 my-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-amber-950 block">
              Statutory Regulation: Semester End Marks Governed Exclusively by Controller of Examinations (COE)
            </span>
            <span className="text-amber-800">
              Semester examination grades displayed here are verified institutional records sealed by the COE. Teaching staff and faculty advisors have view-only access with zero edit permissions. Only the COE is legally authorized to alter, rectify, or publish semester end grades. Faculty can enter formative marks in the{' '}
              <button
                onClick={() => onNavigate('marks')}
                className="underline font-bold text-amber-950 hover:text-indigo-900 cursor-pointer"
              >
                Internal Marks
              </button>{' '}
              module.
            </span>
          </div>
        </div>

        {/* 4 Summary Telemetry Badges for Previous Semester */}
        <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[11px] font-semibold uppercase">Cohort Pass Rate</span>
            <span className="text-lg font-extrabold text-[#3F7D58]">{prevSemStats.passRate}%</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">All courses cleared</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[11px] font-semibold uppercase">Cohort Average SGPA</span>
            <span className="text-lg font-extrabold text-[#1E3A5F]">{prevSemStats.avgSGPA} / 10.0</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Semester {activePrevSem?.semester_number} SGPA</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[11px] font-semibold uppercase">Cleared Candidates</span>
            <span className="text-lg font-extrabold text-emerald-700">{prevSemStats.clearedCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Zero arrears recorded</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[11px] font-semibold uppercase">Candidates with Arrear</span>
            <span className="text-lg font-extrabold text-rose-700">{prevSemStats.arrearCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Backlog remedial required</span>
          </div>
        </div>

        {/* Previous Semester Student Table */}
        <div className="overflow-x-auto border-t border-slate-100">
          {prevSemLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading Semester {activePrevSem?.semester_number} results from COE archive...
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Register Number</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3 text-center">Registered Credits</th>
                  <th className="px-5 py-3 text-center">Earned Credits</th>
                  <th className="px-5 py-3 text-center">Semester SGPA</th>
                  <th className="px-5 py-3 text-center">Courses Passed</th>
                  <th className="px-5 py-3 text-center">Semester Standing</th>
                  <th className="px-5 py-3 text-center">COE Status</th>
                  <th className="px-5 py-3 text-right">Course Grades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {prevSemStudentSummary.slice(0, 15).map(({ student, records, totalCredits, earnedCredits, sgpa, passedCourses, arrearCourses, hasRecords, isCleared }) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3 font-mono font-bold text-[#1E3A5F]">{student.register_number}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{student.student_name}</td>
                    <td className="px-5 py-3 text-center font-mono font-semibold">{hasRecords ? totalCredits : '—'}</td>
                    <td className="px-5 py-3 text-center font-mono font-semibold text-emerald-700">
                      {hasRecords ? earnedCredits : '—'}
                    </td>
                    <td className="px-5 py-3 text-center font-mono font-bold text-sm text-[#1E3A5F]">
                      {hasRecords ? sgpa.toFixed(2) : '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {hasRecords ? (
                        <span className="text-[11px] text-slate-600">
                          {passedCourses} / {records.length} Passed
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No records</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {hasRecords ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                            isCleared
                              ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                              : 'bg-red-50 text-[#B94A48] border-red-200'
                          }`}
                        >
                          {isCleared ? 'All Cleared' : `${arrearCourses} Arrear(s)`}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Published</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() =>
                          setStudentBreakdownModal({
                            student,
                            records,
                            sgpa,
                            totalCredits,
                            earnedCredits,
                            isCleared,
                            arrearCourses,
                            semester: activePrevSem,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#1E3A5F] font-semibold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                        title="View Course Breakdown"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Breakdown</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Cohort Action Roster */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              {selectedDepartment} Cohort Action Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Showing students of {selectedDepartment}
            </p>
          </div>

          <button
            onClick={() => onNavigate('students')}
            className="text-xs font-bold text-[#1E3A5F] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Complete Student Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Register Number</th>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Branch & Batch</th>
                <th className="px-5 py-3 text-center">CGPA</th>
                <th className="px-5 py-3 text-center">Attendance</th>
                <th className="px-5 py-3 text-center">Arrears</th>
                <th className="px-5 py-3 text-center">Risk Level</th>
                <th className="px-5 py-3 text-right">Quick Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {departmentStudents.slice(0, 15).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3 font-mono font-bold text-[#1E3A5F]">{s.register_number}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{s.student_name}</td>
                  <td className="px-5 py-3 text-slate-500">{s.branch_code} • {s.batch}</td>
                  <td className="px-5 py-3 text-center font-bold font-mono text-slate-900">{s.cgpa?.toFixed(2) || '0.00'}</td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`font-mono font-semibold ${
                        s.attendancePercentage >= 85
                          ? 'text-[#3F7D58]'
                          : s.attendancePercentage >= 75
                          ? 'text-[#B7791F]'
                          : 'text-[#B94A48]'
                      }`}
                    >
                      {s.attendancePercentage}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center font-mono">
                    <span className={s.currentArrears > 0 ? 'text-[#B94A48] font-bold' : 'text-slate-400'}>
                      {s.currentArrears}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <RiskBadge level={s.riskLevel} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onNavigate('academic-progress', s.id)}
                        className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[#1E3A5F] font-semibold text-[11px] transition cursor-pointer"
                      >
                        Progress
                      </button>
                      <button
                        onClick={() => onNavigate('ai-insights', s.id)}
                        className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-[#1E3A5F] font-semibold text-[11px] transition flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-[#1E3A5F]" />
                        <span>AI</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Course Breakdown Modal (Read-Only) */}
      {studentBreakdownModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#1E3A5F]">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {studentBreakdownModal.student.student_name} — Semester {studentBreakdownModal.semester?.semester_number} Grade Card
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Register No: {studentBreakdownModal.student.register_number} • Batch: {studentBreakdownModal.student.batch}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStudentBreakdownModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Semester SGPA</span>
                  <span className="font-extrabold text-base text-[#1E3A5F]">
                    {studentBreakdownModal.sgpa.toFixed(2)} / 10.0
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Credits Registered</span>
                  <span className="font-bold text-slate-800">{studentBreakdownModal.totalCredits}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Credits Earned</span>
                  <span className="font-bold text-emerald-700">{studentBreakdownModal.earnedCredits}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Clearance Status</span>
                  <span className={`font-bold ${studentBreakdownModal.isCleared ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {studentBreakdownModal.isCleared ? 'All Cleared' : `${studentBreakdownModal.arrearCourses} Arrear(s)`}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">Course Code</th>
                      <th className="p-2.5">Course Title</th>
                      <th className="p-2.5 text-center">Credits</th>
                      <th className="p-2.5 text-center">Grade</th>
                      <th className="p-2.5 text-center">Grade Point</th>
                      <th className="p-2.5 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentBreakdownModal.records.map((r: any) => {
                      const course = courseMap.get(r.course_id);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70">
                          <td className="p-2.5 font-mono font-bold text-[#1E3A5F]">
                            {course?.course_code || r.courseCode || r.course_id}
                          </td>
                          <td className="p-2.5">{course?.course_name || r.courseName || 'Course'}</td>
                          <td className="p-2.5 text-center font-medium">{r.credits}</td>
                          <td className="p-2.5 text-center">
                            <GradeChip grade={r.grade} />
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold">{r.grade_point}</td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.result_status === 'Pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-rose-700'
                              }`}
                            >
                              {r.result_status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  Official certified transcript record • Read-only faculty audit view • Marks can only be altered by COE.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setStudentBreakdownModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
