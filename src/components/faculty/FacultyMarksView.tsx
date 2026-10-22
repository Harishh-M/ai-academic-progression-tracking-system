import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { Course, Student } from '../../types/index.js';
import {
  BookOpen,
  FlaskConical,
  Award,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  Search,
  SlidersHorizontal,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
  Check,
  ChevronRight,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';

type PanelCategory = 'internal' | 'lab' | 'continuous';

interface AssessmentPreset {
  id: string;
  name: string;
  category: PanelCategory;
  type: 'Internal Test' | 'Practical' | 'Assignment' | 'Quiz' | 'Other';
  defaultMax: number;
  description: string;
}

const ASSESSMENT_PRESETS: AssessmentPreset[] = [
  // Internal Assessments
  {
    id: 'cia-1',
    name: 'Continuous Internal Assessment - I (CIA 1)',
    category: 'internal',
    type: 'Internal Test',
    defaultMax: 50,
    description: 'Units 1 & 2 Theory Formative Assessment',
  },
  {
    id: 'cia-2',
    name: 'Continuous Internal Assessment - II (CIA 2)',
    category: 'internal',
    type: 'Internal Test',
    defaultMax: 50,
    description: 'Units 3 & 4 Theory Formative Assessment',
  },
  {
    id: 'model-exam',
    name: 'Model Examination',
    category: 'internal',
    type: 'Internal Test',
    defaultMax: 100,
    description: 'Full Syllabus Summative Pre-Semester Examination',
  },
  {
    id: 'cia-retest',
    name: 'CIA Retest / Improvement Examination',
    category: 'internal',
    type: 'Internal Test',
    defaultMax: 50,
    description: 'Remedial internal examination for academic recovery',
  },

  // Lab & Practical Evaluations
  {
    id: 'lab-exp',
    name: 'Laboratory Experiment & Continuous Record',
    category: 'lab',
    type: 'Practical',
    defaultMax: 25,
    description: 'Weekly lab experiments, observation & record completion',
  },
  {
    id: 'model-lab',
    name: 'Model Practical Examination',
    category: 'lab',
    type: 'Practical',
    defaultMax: 50,
    description: 'Hands-on practical programming & circuit execution test',
  },
  {
    id: 'lab-viva',
    name: 'Laboratory Viva-Voce & Code Inspection',
    category: 'lab',
    type: 'Practical',
    defaultMax: 25,
    description: 'Oral technical defense, code walkthrough & algorithmic analysis',
  },
  {
    id: 'mini-project',
    name: 'Mini-Project / Capstone Practical Review',
    category: 'lab',
    type: 'Practical',
    defaultMax: 50,
    description: 'Practical project demonstration & design verification',
  },

  // Continuous / Assignment / Seminar
  {
    id: 'assignment-1',
    name: 'Module Assignment - I',
    category: 'continuous',
    type: 'Assignment',
    defaultMax: 20,
    description: 'Problem-solving problem set on core analytical topics',
  },
  {
    id: 'assignment-2',
    name: 'Module Assignment - II',
    category: 'continuous',
    type: 'Assignment',
    defaultMax: 20,
    description: 'Case study analysis and applied technical design',
  },
  {
    id: 'seminar',
    name: 'Technical Seminar & Paper Presentation',
    category: 'continuous',
    type: 'Other',
    defaultMax: 20,
    description: 'Literature review presentation and peer Q&A',
  },
  {
    id: 'quiz',
    name: 'Objective Online Quiz & Rapid Fire',
    category: 'continuous',
    type: 'Quiz',
    defaultMax: 20,
    description: 'Online LMS timed multiple choice conceptual quiz',
  },
];

export const FacultyMarksView: React.FC = () => {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<PanelCategory>('internal');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('cia-1');
  const [maxMarks, setMaxMarks] = useState<number>(50);
  const [marksState, setMarksState] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load initial courses and all students
  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCourses(), api.getStudents()])
      .then(([courseList, stuList]) => {
        setCourses(courseList);
        setStudents(stuList);
        if (courseList.length > 0) {
          setSelectedCourseId(courseList[0].id);
        }

        // Default to faculty department or first available department
        const facultyDept = (profile as any)?.department;
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

  // Current active preset object
  const currentPreset = useMemo(() => {
    return (
      ASSESSMENT_PRESETS.find((p) => p.id === selectedPresetId) ||
      ASSESSMENT_PRESETS.find((p) => p.category === activeCategory) ||
      ASSESSMENT_PRESETS[0]
    );
  }, [selectedPresetId, activeCategory]);

  // When active category changes, switch preset to the first preset of that category
  const handleSelectCategory = (cat: PanelCategory) => {
    setActiveCategory(cat);
    const firstOfCat = ASSESSMENT_PRESETS.find((p) => p.category === cat);
    if (firstOfCat) {
      setSelectedPresetId(firstOfCat.id);
      setMaxMarks(firstOfCat.defaultMax);
    }
  };

  const handleSelectPreset = (preset: AssessmentPreset) => {
    setSelectedPresetId(preset.id);
    setMaxMarks(preset.defaultMax);
  };

  // Department counts
  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      if (s.department) {
        counts[s.department] = (counts[s.department] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  const departments = useMemo(() => Object.keys(departmentCounts).sort(), [departmentCounts]);

  // Filter students by selected department
  const departmentStudents = useMemo(() => {
    if (!selectedDepartment) return students;
    return students.filter((s) => s.department === selectedDepartment);
  }, [students, selectedDepartment]);

  // Fetch / initialize existing marks whenever course, assessment preset, or department changes
  useEffect(() => {
    if (selectedCourseId && currentPreset) {
      api
        .getMarks()
        .then((records) => {
          const matching = records.filter(
            (r) => r.course_id === selectedCourseId && r.assessment_name === currentPreset.name
          );
          const map: Record<string, number> = {};
          departmentStudents.forEach((s) => {
            const found = matching.find((m) => m.student_id === s.id);
            if (found) {
              map[s.id] = found.marks_obtained;
            } else {
              // Deterministic seed mark for demonstration
              const seed = (s.student_name.charCodeAt(0) * 11 + s.id.charCodeAt(1)) % (maxMarks - 10) + 10;
              map[s.id] = Math.min(seed, maxMarks);
            }
          });
          setMarksState(map);
        })
        .catch(console.error);
    }
  }, [selectedCourseId, currentPreset, maxMarks, departmentStudents]);

  // Search filtered students within department
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return departmentStudents;
    const q = searchQuery.toLowerCase();
    return departmentStudents.filter(
      (s) => s.student_name.toLowerCase().includes(q) || s.register_number.toLowerCase().includes(q)
    );
  }, [departmentStudents, searchQuery]);

  const handleMarkChange = (studentId: string, val: string) => {
    const num = parseFloat(val) || 0;
    const clamped = Math.min(Math.max(0, num), maxMarks);
    setMarksState((prev) => ({
      ...prev,
      [studentId]: clamped,
    }));
  };

  // Batch mark fill helpers
  const handleAutoFillBenchmark = (pct: number) => {
    const score = Math.round((pct / 100) * maxMarks);
    const updated: Record<string, number> = { ...marksState };
    departmentStudents.forEach((s) => {
      updated[s.id] = score;
    });
    setMarksState(updated);
  };

  const handleClearMarks = () => {
    const updated: Record<string, number> = { ...marksState };
    departmentStudents.forEach((s) => {
      updated[s.id] = 0;
    });
    setMarksState(updated);
  };

  // Save marks to API
  const handleSaveMarks = async () => {
    if (!selectedCourseId || !currentPreset) return;
    setSaving(true);
    try {
      for (const s of departmentStudents) {
        const obtained = marksState[s.id] ?? 0;
        await api.saveMark({
          student_id: s.id,
          course_id: selectedCourseId,
          assessment_name: currentPreset.name,
          assessment_type: currentPreset.type,
          marks_obtained: obtained,
          maximum_marks: maxMarks,
        });
      }
      setFeedback({
        type: 'success',
        text: `Marks for "${currentPreset.name}" successfully recorded for ${departmentStudents.length} students in ${selectedDepartment}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to save marks. Check permissions and try again.',
      });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Analytics calculation
  const markValues: number[] = departmentStudents.map((s) => marksState[s.id] ?? 0);
  const classAvg =
    markValues.length > 0 ? (markValues.reduce((a, b) => a + b, 0) / markValues.length).toFixed(1) : '0';
  const highest = markValues.length > 0 ? Math.max(...markValues) : 0;
  const lowest = markValues.length > 0 ? Math.min(...markValues) : 0;
  const passCutoff = maxMarks * 0.5;
  const passCount = markValues.filter((m) => m >= passCutoff).length;
  const passRate = markValues.length > 0 ? Math.round((passCount / markValues.length) * 100) : 0;

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const categoryPresets = ASSESSMENT_PRESETS.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A5F] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#1E3A5F]" />
              Modular Assessment Portal
            </span>
            <span className="text-xs text-slate-400">• Department Cohort Ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Academic Assessment & Mark Entry System
          </h1>
          <p className="text-xs text-slate-500">
            Select an assessment category panel (Internal, Lab, Continuous) and grade department student cohorts.
          </p>
        </div>

        <button
          id="btn-save-marks"
          onClick={handleSaveMarks}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#16304F] disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving to Database...' : 'Save & Publish Marks'}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700 font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* DEPARTMENT SELECTOR BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#1E3A5F] flex items-center justify-center shrink-0">
            <Building className="w-5 h-5 text-[#1E3A5F]" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>Filter By Department</span>
              <span className="text-slate-400">• Total {departments.length} Departments</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {selectedDepartment || 'Select Department Cohort'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            id="select-faculty-department"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="flex-1 md:w-80 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept} ({departmentCounts[dept]} students)
              </option>
            ))}
          </select>

          <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 whitespace-nowrap">
            {departmentStudents.length} Students
          </div>
        </div>
      </div>

      {/* THREE INTERACTIVE ASSESSMENT CATEGORY PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Panel 1: Internal Assessments (CIA) */}
        <div
          onClick={() => handleSelectCategory('internal')}
          className={`p-5 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeCategory === 'internal'
              ? 'bg-blue-50/50 border-[#1E3A5F] shadow-md ring-2 ring-[#1E3A5F]/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          {activeCategory === 'internal' && (
            <div className="absolute top-0 right-0 bg-[#1E3A5F] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
              Active Panel
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  activeCategory === 'internal'
                    ? 'bg-[#1E3A5F] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Internal Assessments</h3>
                <span className="text-[11px] text-slate-500">Continuous Internal (CIA)</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Log CIA-1, CIA-2, Model Examination, and Improvement Tests for theory courses.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs">
            <span className="font-semibold text-slate-500">4 Sub-Tests Available</span>
            <span className="font-bold text-[#1E3A5F] flex items-center gap-1">
              Open Panel <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Panel 2: Laboratory & Practical Evaluations */}
        <div
          onClick={() => handleSelectCategory('lab')}
          className={`p-5 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeCategory === 'lab'
              ? 'bg-emerald-50/50 border-[#3F7D58] shadow-md ring-2 ring-[#3F7D58]/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          {activeCategory === 'lab' && (
            <div className="absolute top-0 right-0 bg-[#3F7D58] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
              Active Panel
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  activeCategory === 'lab'
                    ? 'bg-[#3F7D58] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Lab & Practical Evaluations</h3>
                <span className="text-[11px] text-slate-500">Laboratory & Hands-on</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Enter continuous experiment marks, model practical tests, viva-voce, and mini-project reviews.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs">
            <span className="font-semibold text-slate-500">4 Lab Assessments</span>
            <span className="font-bold text-[#3F7D58] flex items-center gap-1">
              Open Panel <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Panel 3: Continuous Assessments & Seminars */}
        <div
          onClick={() => handleSelectCategory('continuous')}
          className={`p-5 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeCategory === 'continuous'
              ? 'bg-amber-50/50 border-[#B7791F] shadow-md ring-2 ring-[#B7791F]/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          {activeCategory === 'continuous' && (
            <div className="absolute top-0 right-0 bg-[#B7791F] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
              Active Panel
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  activeCategory === 'continuous'
                    ? 'bg-[#B7791F] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Continuous Assessments</h3>
                <span className="text-[11px] text-slate-500">Assignments & Quizzes</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Grade module assignments, technical seminars, presentations, and online quizzes.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs">
            <span className="font-semibold text-slate-500">4 Formative Tasks</span>
            <span className="font-bold text-[#B7791F] flex items-center gap-1">
              Open Panel <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* DEDICATED ACTIVE ASSESSMENT ENTRY PANEL */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm space-y-6">
        {/* Panel Title & Sub-Test Pills */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`p-2 rounded-xl text-white ${
                  activeCategory === 'internal'
                    ? 'bg-[#1E3A5F]'
                    : activeCategory === 'lab'
                    ? 'bg-[#3F7D58]'
                    : 'bg-[#B7791F]'
                }`}
              >
                {activeCategory === 'internal' ? (
                  <BookOpen className="w-4 h-4" />
                ) : activeCategory === 'lab' ? (
                  <FlaskConical className="w-4 h-4" />
                ) : (
                  <Award className="w-4 h-4" />
                )}
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {activeCategory === 'internal'
                    ? 'Internal Theory Assessment Entry Panel'
                    : activeCategory === 'lab'
                    ? 'Laboratory & Practical Examination Entry Panel'
                    : 'Continuous Assessment & Seminar Entry Panel'}
                </h2>
                <p className="text-xs text-slate-500">{currentPreset.description}</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1 self-start sm:self-auto">
              <span>Department:</span>
              <strong className="text-slate-900">{selectedDepartment}</strong>
            </div>
          </div>

          {/* Sub-Test Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {categoryPresets.map((preset) => {
              const isSelected = preset.id === currentPreset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? activeCategory === 'internal'
                        ? 'bg-[#1E3A5F] text-white shadow-xs'
                        : activeCategory === 'lab'
                        ? 'bg-[#3F7D58] text-white shadow-xs'
                        : 'bg-[#B7791F] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{preset.name}</span>
                  <span className="opacity-80 font-normal">({preset.defaultMax}m)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration Row: Course & Max Marks & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#1E3A5F]" />
              <span>Select Course / Subject</span>
            </label>
            <select
              id="select-marks-course"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code} - {c.course_name} (Sem {c.semester_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#1E3A5F]" />
              <span>Maximum Marks</span>
            </label>
            <input
              id="input-max-marks"
              type="number"
              min={10}
              max={100}
              value={maxMarks}
              onChange={(e) => setMaxMarks(parseInt(e.target.value) || 50)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search Cohort</span>
            </label>
            <input
              type="text"
              placeholder="Search reg no or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
        </div>

        {/* Live Metrics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Class Average</span>
            <div className="text-xl font-extrabold text-[#1E3A5F]">
              {classAvg} <span className="text-xs font-normal text-slate-500">/ {maxMarks}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Mean Score in Department</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Highest Score</span>
            <div className="text-xl font-extrabold text-[#3F7D58]">
              {highest} <span className="text-xs font-normal text-slate-500">/ {maxMarks}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Top Performer</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Lowest Score</span>
            <div className="text-xl font-extrabold text-[#B7791F]">
              {lowest} <span className="text-xs font-normal text-slate-500">/ {maxMarks}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Needs Remediation</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Pass Rate (≥50%)</span>
            <div className="text-xl font-extrabold text-[#1E3A5F]">{passRate}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {passCount} / {departmentStudents.length} Cleared
            </div>
          </div>
        </div>

        {/* Quick Batch Actions & Helper Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Quick Batch Autofill:</span>
            <button
              type="button"
              onClick={() => handleAutoFillBenchmark(70)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E3A5F] border border-blue-200 font-semibold transition cursor-pointer"
            >
              Fill 70% (B+)
            </button>
            <button
              type="button"
              onClick={() => handleAutoFillBenchmark(85)}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#3F7D58] border border-emerald-200 font-semibold transition cursor-pointer"
            >
              Fill 85% (A+)
            </button>
            <button
              type="button"
              onClick={handleClearMarks}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>

          <div className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredStudents.length}</strong> of{' '}
            <strong className="text-slate-900">{departmentStudents.length}</strong> students in {selectedDepartment}
          </div>
        </div>

        {/* Department-Wise Student Marks Roster Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="font-bold text-slate-900 text-xs">
              Marks Sheet: {selectedCourse?.course_code} - {currentPreset.name} (Max: {maxMarks})
            </div>
            <span className="text-[11px] text-slate-500">Directly editable • Clamped between 0 and {maxMarks}</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Register Number</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3 text-center">Marks Obtained (/{maxMarks})</th>
                  <th className="px-5 py-3 text-center">Percentage</th>
                  <th className="px-5 py-3 text-center">Letter Grade</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((s) => {
                  const val = marksState[s.id] ?? 0;
                  const pct = Math.round((val / maxMarks) * 100);
                  const isPassed = val >= passCutoff;

                  // Grade determination
                  let grade = 'U';
                  let gradeColor = 'text-red-700 bg-red-50 border-red-200';
                  if (pct >= 90) {
                    grade = 'O';
                    gradeColor = 'text-emerald-800 bg-emerald-100 border-emerald-300';
                  } else if (pct >= 80) {
                    grade = 'A+';
                    gradeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                  } else if (pct >= 70) {
                    grade = 'A';
                    gradeColor = 'text-blue-700 bg-blue-50 border-blue-200';
                  } else if (pct >= 60) {
                    grade = 'B+';
                    gradeColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
                  } else if (pct >= 50) {
                    grade = 'B';
                    gradeColor = 'text-amber-700 bg-amber-50 border-amber-200';
                  }

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3 font-mono font-bold text-[#1E3A5F]">
                        {s.register_number}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">{s.student_name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {s.department || selectedDepartment}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={maxMarks}
                            step={0.5}
                            value={val}
                            onChange={(e) => handleMarkChange(s.id, e.target.value)}
                            className="w-24 px-3 py-1.5 text-center font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:bg-white"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                pct >= 75 ? 'bg-[#3F7D58]' : pct >= 50 ? 'bg-[#1E3A5F]' : 'bg-[#B94A48]'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-800">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-extrabold border ${gradeColor}`}
                        >
                          {grade}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                            isPassed
                              ? 'bg-emerald-50 text-[#3F7D58] border-emerald-200'
                              : 'bg-red-50 text-[#B94A48] border-red-200'
                          }`}
                        >
                          {isPassed ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {isPassed ? 'Passed' : 'Needs Retest'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Recorded scores are bound to faculty account <strong>{(profile as any)?.faculty_id || 'FACULTY'}</strong> and synchronized with institutional COE records.
          </div>

          <button
            onClick={handleSaveMarks}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#16304F] disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save & Publish Marks'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
