import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  SemesterResultRecord,
  CalculatedAcademicMetrics,
  Course,
  Semester,
} from '../../types/index.js';
import { GradeChip } from '../common/GradeChip.js';
import { MetricCard } from '../common/MetricCard.js';
import { GraduationCap, Award, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const StudentResultsView: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<SemesterResultRecord[]>([]);
  const [metrics, setMetrics] = useState<CalculatedAcademicMetrics | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemId, setSelectedSemId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.studentId) {
      setLoading(true);
      Promise.all([
        api.getStudentById(user.studentId),
        api.getCourses(),
        api.getSemesters(),
      ])
        .then(([stuRes, courseList, semList]) => {
          setResults(stuRes.semesterResults);
          setMetrics(stuRes.metrics);
          setCourses(courseList);
          setSemesters(semList);

          // default to latest semester
          if (semList.length > 0) {
            setSelectedSemId(semList[0].id);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.studentId]);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const courseMap = new Map<string, Course>(courses.map((c) => [c.id, c]));
  const semesterMap = new Map<string, Semester>(semesters.map((s) => [s.id, s]));

  const currentSemResults = results.filter((r) => r.semester_id === selectedSemId);
  const currentSemMetrics = metrics.semesterSGPA.find((s) => s.semesterId === selectedSemId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Semester Examination Results & Grade Sheets</h1>
          <p className="text-xs text-slate-500">
            Official university semester-end grades, grade points, and SGPA calculations
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>University Certified Grade Ledger</span>
        </div>
      </div>

      {/* Cumulative CGPA & Arrear Summary Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Cumulative CGPA</span>
            <div className="text-2xl font-extrabold text-indigo-600">{metrics.cgpa.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Completed Semesters</span>
            <div className="text-2xl font-extrabold text-purple-600">{metrics.semesterSGPA.length}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
              metrics.currentArrears === 0
                ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                : 'bg-rose-50 border border-rose-100 text-rose-600'
            }`}
          >
            {metrics.currentArrears === 0 ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Arrear Standing</span>
            <div
              className={`text-2xl font-extrabold ${
                metrics.currentArrears === 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {metrics.currentArrears === 0 ? 'Zero Arrears' : `${metrics.currentArrears} Active`}
            </div>
          </div>
        </div>
      </div>

      {/* Semester Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {semesters.map((sem) => {
          const isActive = selectedSemId === sem.id;
          const semMetric = metrics.semesterSGPA.find((s) => s.semesterId === sem.id);
          return (
            <button
              key={sem.id}
              onClick={() => setSelectedSemId(sem.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Semester {sem.semester_number}</span>
              {semMetric && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  SGPA {semMetric.sgpa.toFixed(2)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Semester Performance Breakdown */}
      {currentSemMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <MetricCard
            title="Semester SGPA"
            value={currentSemMetrics.sgpa.toFixed(2)}
            subtitle="Semester Grade Point Average"
            icon={GraduationCap}
            accentColor="indigo"
          />
          <MetricCard
            title="Registered Credits"
            value={currentSemMetrics.totalCredits}
            subtitle="Total credits registered"
            icon={Award}
            accentColor="purple"
          />
          <MetricCard
            title="Earned Credits"
            value={currentSemMetrics.earnedCredits}
            subtitle="Credits cleared with Pass grade"
            icon={CheckCircle2}
            accentColor="emerald"
          />
          <MetricCard
            title="Courses Passed"
            value={`${currentSemMetrics.passedCourses} / ${currentSemMetrics.passedCourses + currentSemMetrics.failedCourses}`}
            subtitle={currentSemMetrics.failedCourses > 0 ? `${currentSemMetrics.failedCourses} arrear(s)` : 'All cleared'}
            icon={Award}
            accentColor={currentSemMetrics.failedCourses === 0 ? 'emerald' : 'rose'}
          />
        </div>
      )}

      {/* Semester Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              Grade Sheet - {semesterMap.get(selectedSemId)?.academic_year || 'Academic Year'}
            </h2>
            <p className="text-xs text-slate-500">Official course-wise letter grades and earned grade points</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Course Code</th>
                <th className="px-5 py-3">Course Title</th>
                <th className="px-5 py-3 text-center">Credits</th>
                <th className="px-5 py-3 text-center">Letter Grade</th>
                <th className="px-5 py-3 text-center">Grade Point</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentSemResults.length > 0 ? (
                currentSemResults.map((r) => {
                  const c = courseMap.get(r.course_id);
                  const isPass = r.result_status === 'Pass';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-700">{c?.course_code || r.course_id}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{c?.course_name || 'Course'}</td>
                      <td className="px-5 py-3.5 text-center font-semibold">{r.credits}</td>
                      <td className="px-5 py-3.5 text-center">
                        <GradeChip grade={r.grade} points={r.grade_point} status={r.result_status} />
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-900">{r.grade_point}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isPass
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.result_status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No examination records found for this semester.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
