import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { InternalMarkRecord, Course } from '../../types/index.js';
import { ClipboardList, ShieldCheck, Award, BookOpen, Percent } from 'lucide-react';

export const StudentMarksView: React.FC = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState<InternalMarkRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.studentId) {
      setLoading(true);
      Promise.all([api.getMarks(user.studentId), api.getCourses()])
        .then(([marksList, courseList]) => {
          setMarks(marksList);
          setCourses(courseList);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const courseMap = new Map<string, Course>(courses.map((c) => [c.id, c]));

  // Group marks by course
  const groupedMarks: Record<string, InternalMarkRecord[]> = {};
  marks.forEach((m) => {
    if (!groupedMarks[m.course_id]) {
      groupedMarks[m.course_id] = [];
    }
    groupedMarks[m.course_id].push(m);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Continuous Internal Assessment (CIA) Marks</h1>
          <p className="text-xs text-slate-500">
            Internal test assessments, lab evaluations, and continuous performance scores
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Faculty Certified Internal Scores</span>
        </div>
      </div>

      {/* Course-Wise Internal Marks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(groupedMarks).map(([courseId, courseMarks]) => {
          const c = courseMap.get(courseId);
          const totalObtained = courseMarks.reduce((acc, m) => acc + m.marks_obtained, 0);
          const totalMax = courseMarks.reduce((acc, m) => acc + m.maximum_marks, 0);
          const totalPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;

          return (
            <div key={courseId} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                    {c?.course_code || courseId}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{c?.course_name || 'Course Assessment'}</h3>
                  <span className="text-[11px] text-slate-500">{c?.department} • {c?.credits} Credits</span>
                </div>

                <div className="text-right">
                  <div className="text-lg font-extrabold text-slate-900">{totalPct}%</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{totalObtained} / {totalMax} Total</div>
                </div>
              </div>

              {/* Individual Assessment Rows */}
              <div className="space-y-2 text-xs">
                {courseMarks.map((m) => {
                  const pct = Math.round((m.marks_obtained / m.maximum_marks) * 100);
                  const isHigh = pct >= 80;
                  const isMid = pct >= 60 && pct < 80;

                  return (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900">{m.assessment_name}</div>
                        <div className="text-[11px] text-slate-500">{m.assessment_type}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {m.marks_obtained}
                          </span>
                          <span className="text-slate-400 font-mono text-xs"> / {m.maximum_marks}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isHigh
                              ? 'bg-emerald-100 text-emerald-800'
                              : isMid
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
