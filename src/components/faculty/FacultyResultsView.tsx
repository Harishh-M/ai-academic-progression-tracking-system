import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Course, Semester, Student, SemesterResultRecord, GradeType } from '../../types/index.js';
import { GradeChip } from '../common/GradeChip.js';
import {
  GraduationCap,
  Save,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  Award,
  ShieldCheck,
} from 'lucide-react';

const GRADE_POINTS: Record<GradeType, number> = {
  O: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  U: 0,
};

export const FacultyResultsView: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSemId, setSelectedSemId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [gradesState, setGradesState] = useState<Record<string, GradeType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getSemesters(), api.getCourses(), api.getStudents()])
      .then(([semList, courseList, stuList]) => {
        setSemesters(semList);
        setCourses(courseList);
        setStudents(stuList);
        if (semList.length > 0) setSelectedSemId(semList[0].id);
        if (courseList.length > 0) setSelectedCourseId(courseList[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch results when course / semester changes
  useEffect(() => {
    if (selectedSemId && selectedCourseId) {
      api.getResults().then((results) => {
        const matching = results.filter(
          (r) => r.semester_id === selectedSemId && r.course_id === selectedCourseId
        );
        const map: Record<string, GradeType> = {};
        students.forEach((s) => {
          const found = matching.find((m) => m.student_id === s.id);
          if (found) {
            map[s.id] = found.grade;
          } else {
            // Default grade
            map[s.id] = 'A';
          }
        });
        setGradesState(map);
      });
    }
  }, [selectedSemId, selectedCourseId, students]);

  const handleGradeChange = (studentId: string, grade: GradeType) => {
    setGradesState((prev) => ({
      ...prev,
      [studentId]: grade,
    }));
  };

  const handleSaveResults = async () => {
    if (!selectedSemId || !selectedCourseId) return;
    const course = courses.find((c) => c.id === selectedCourseId);
    const semester = semesters.find((s) => s.id === selectedSemId);
    if (!course || !semester) return;

    setSaving(true);
    try {
      for (const s of students) {
        const g = gradesState[s.id] || 'A';
        const gp = GRADE_POINTS[g];
        const status = g === 'U' ? 'Fail' : 'Pass';

        await api.saveResult({
          student_id: s.id,
          semester_id: selectedSemId,
          course_id: selectedCourseId,
          grade: g,
          grade_point: gp,
          credits: course.credits,
          result_status: status,
          academic_year: semester.academic_year,
          published_date: new Date().toISOString().split('T')[0],
        });
      }
      setFeedback(`Semester grade sheets for ${course.course_code} successfully committed to ledger.`);
      // Refresh students to re-evaluate CGPA and arrear counts
      const refreshed = await api.getStudents();
      setStudents(refreshed);
    } catch (err: any) {
      alert(err.message || 'Failed to save results');
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedSem = semesters.find((s) => s.id === selectedSemId);

  // Grade Counts
  const gradeCounts: Record<string, number> = { O: 0, 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, U: 0 };
  (Object.values(gradesState) as string[]).forEach((g) => {
    if (gradeCounts[g] !== undefined) gradeCounts[g]++;
  });

  const totalPass = students.length - (gradeCounts['U'] || 0);
  const passRate = students.length > 0 ? Math.round((totalPass / students.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Semester Examination Results & Grade Point Ledger</h1>
          <p className="text-xs text-slate-500">
            Publish official university course letter grades, calculate SGPA/CGPA impacts, and manage arrear logs
          </p>
        </div>

        <button
          id="btn-save-results"
          onClick={handleSaveResults}
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-[#1E3A5F] hover:bg-[#16304F] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Publishing...' : 'Commit Grades to ERP'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3F7D58]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Selectors */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#1E3A5F]" />
            <span>Select Semester Examination</span>
          </label>
          <select
            id="select-results-semester"
            value={selectedSemId}
            onChange={(e) => setSelectedSemId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          >
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                Semester {s.semester_number} ({s.academic_year} - {s.semester_type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#1E3A5F]" />
            <span>Select Course</span>
          </label>
          <select
            id="select-results-course"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_code} - {c.course_name} ({c.credits} Credits)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grade Distribution Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Course Grade Distribution • Pass Rate: <strong className="text-[#3F7D58]">{passRate}%</strong>
          </span>
          <span className="text-xs text-slate-400">Total Enrolled: {students.length}</span>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {(['O', 'A+', 'A', 'B+', 'B', 'C', 'U'] as GradeType[]).map((g) => (
            <div
              key={g}
              className={`p-2.5 rounded-xl border ${
                g === 'U'
                  ? 'bg-red-50 border-red-200 text-[#B94A48]'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="font-extrabold text-sm">{g}</div>
              <div className="text-[10px] text-slate-500">GP: {GRADE_POINTS[g]}</div>
              <div className="text-base font-bold mt-1">{gradeCounts[g] || 0}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grade Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-900 text-sm">
            Grade Sheet: {selectedCourse?.course_code} - {selectedCourse?.course_name} (Semester {selectedSem?.semester_number})
          </div>
          <span className="text-xs text-slate-400">
            Course Credits: {selectedCourse?.credits || 3}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Register Number</th>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3 text-center">Letter Grade</th>
                <th className="px-5 py-3 text-center">Earned Grade Point</th>
                <th className="px-5 py-3 text-center">Credit Points (GP × Credits)</th>
                <th className="px-5 py-3 text-center">Examination Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {students.map((s) => {
                const currentGrade = gradesState[s.id] || 'A';
                const gp = GRADE_POINTS[currentGrade];
                const credits = selectedCourse?.credits || 3;
                const creditPoints = gp * credits;
                const isPass = currentGrade !== 'U';

                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#1E3A5F]">{s.register_number}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{s.student_name}</td>
                    <td className="px-5 py-3.5 text-center">
                      <select
                        value={currentGrade}
                        onChange={(e) => handleGradeChange(s.id, e.target.value as GradeType)}
                        className="px-3 py-1.5 font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                      >
                        <option value="O">O (Outstanding - 10)</option>
                        <option value="A+">A+ (Excellent - 9)</option>
                        <option value="A">A (Very Good - 8)</option>
                        <option value="B+">B+ (Good - 7)</option>
                        <option value="B">B (Above Average - 6)</option>
                        <option value="C">C (Pass - 5)</option>
                        <option value="U">U (Reappear / Fail - 0)</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-900">{gp}</td>
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-[#1E3A5F]">{creditPoints}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                          isPass
                            ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                            : 'bg-red-50 text-[#B94A48] border-red-200'
                        }`}
                      >
                        {isPass ? 'Pass' : 'Fail (Arrear)'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
