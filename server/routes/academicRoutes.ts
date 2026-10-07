import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireFaculty, requireStudentSelfOrFaculty } from '../middleware/auth.js';
import { calculateStudentMetrics } from '../services/academicCalculator.js';

export const academicRouter = Router();

// Courses & Semesters metadata
academicRouter.get('/courses', requireAuth, (_req, res) => {
  res.json(db.getAllCourses());
});

academicRouter.get('/semesters', requireAuth, (_req, res) => {
  res.json(db.getAllSemesters());
});

// GET /api/attendance - Query attendance
academicRouter.get('/attendance', requireAuth, (req, res) => {
  const { studentId, courseId, date } = req.query;

  if (req.user?.role === 'STUDENT') {
    // Student can only query their own attendance
    const records = db.getAttendanceByStudent(req.user.studentId!);
    return res.json(records);
  }

  // Faculty can filter by student, course, or date
  if (studentId && typeof studentId === 'string') {
    return res.json(db.getAttendanceByStudent(studentId));
  }
  if (courseId && date && typeof courseId === 'string' && typeof date === 'string') {
    return res.json(db.getAttendanceByCourseAndDate(courseId, date));
  }

  // default: return all attendance for assigned faculty's courses
  const facultyCourses = db.getFacultyCourses(req.user!.facultyId!).map((fc) => fc.course_id);
  const allStudents = db.getStudentsByFaculty(req.user!.facultyId!);
  const allAtt = allStudents.flatMap((s) => db.getAttendanceByStudent(s.id));
  res.json(allAtt.filter((a) => facultyCourses.includes(a.course_id)).slice(0, 100));
});

// POST /api/attendance - Batch mark attendance (Faculty only, rejects student with 403)
academicRouter.post('/attendance', requireAuth, requireFaculty, (req, res) => {
  const { records } = req.body; // Array of { student_id, course_id, date, status }
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Records array is required' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const updated = db.recordAttendanceBatch(records, req.user!.facultyId!, {
    id: req.user!.id,
    role: 'FACULTY',
    name: req.user!.name,
    ip,
  });

  res.json({ success: true, count: updated.length, records: updated });
});

// GET /api/marks - Query internal marks
academicRouter.get('/marks', requireAuth, (req, res) => {
  const { studentId } = req.query;

  if (req.user?.role === 'STUDENT') {
    const marks = db.getInternalMarksByStudent(req.user.studentId!);
    return res.json(marks);
  }

  if (studentId && typeof studentId === 'string') {
    return res.json(db.getInternalMarksByStudent(studentId));
  }

  const allStudents = db.getStudentsByFaculty(req.user!.facultyId!);
  const allMarks = allStudents.flatMap((s) => db.getInternalMarksByStudent(s.id));
  res.json(allMarks);
});

// POST /api/marks - Add/Update internal marks (Faculty only)
academicRouter.post('/marks', requireAuth, requireFaculty, (req, res) => {
  const { id, student_id, course_id, assessment_name, assessment_type, marks_obtained, maximum_marks } = req.body;

  if (!student_id || !course_id || !assessment_name || marks_obtained === undefined || maximum_marks === undefined) {
    return res.status(400).json({ error: 'Missing required mark record fields' });
  }

  if (Number(marks_obtained) < 0 || Number(marks_obtained) > Number(maximum_marks)) {
    return res.status(400).json({ error: 'Marks obtained must be between 0 and maximum marks' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const saved = db.saveInternalMark(
    {
      id,
      student_id,
      course_id,
      assessment_name,
      assessment_type: assessment_type || 'Internal Test',
      marks_obtained: Number(marks_obtained),
      maximum_marks: Number(maximum_marks),
      entered_by: req.user!.facultyId!,
    },
    req.user!.facultyId!,
    {
      id: req.user!.id,
      role: 'FACULTY',
      name: req.user!.name,
      ip,
    }
  );

  res.json(saved);
});

// GET /api/results - Query semester results
academicRouter.get('/results', requireAuth, (req, res) => {
  const { studentId } = req.query;

  if (req.user?.role === 'STUDENT') {
    const results = db.getSemesterResultsByStudent(req.user.studentId!);
    return res.json(results);
  }

  if (studentId && typeof studentId === 'string') {
    return res.json(db.getSemesterResultsByStudent(studentId));
  }

  const allStudents = db.getStudentsByFaculty(req.user!.facultyId!);
  const allResults = allStudents.flatMap((s) => db.getSemesterResultsByStudent(s.id));
  res.json(allResults);
});

// POST /api/results - Add/Update semester results (Faculty only)
academicRouter.post('/results', requireAuth, requireFaculty, (req, res) => {
  const { id, student_id, semester_id, course_id, grade, grade_point, credits, result_status, academic_year } = req.body;

  if (!student_id || !semester_id || !course_id || !grade || grade_point === undefined || !credits) {
    return res.status(400).json({ error: 'Missing required semester result fields' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const saved = db.saveSemesterResult(
    {
      id,
      student_id,
      semester_id,
      course_id,
      grade,
      grade_point: Number(grade_point),
      credits: Number(credits),
      result_status: result_status || (Number(grade_point) > 0 ? 'Pass' : 'Fail'),
      academic_year: academic_year || '2024-2025',
      published_date: new Date().toISOString().split('T')[0],
    },
    {
      id: req.user!.id,
      role: 'FACULTY',
      name: req.user!.name,
      ip,
    }
  );

  res.json(saved);
});

// GET /api/achievements - Query achievements
academicRouter.get('/achievements', requireAuth, (req, res) => {
  const { studentId } = req.query;

  if (req.user?.role === 'STUDENT') {
    const achievements = db.getAchievementsByStudent(req.user.studentId!);
    return res.json(achievements);
  }

  if (studentId && typeof studentId === 'string') {
    return res.json(db.getAchievementsByStudent(studentId));
  }

  const allStudents = db.getAllStudents();
  const allAch = allStudents.flatMap((s) => db.getAchievementsByStudent(s.id));
  res.json(allAch);
});

// POST /api/achievements - Create/Update achievement (Faculty only)
academicRouter.post('/achievements', requireAuth, requireFaculty, (req, res) => {
  const { id, student_id, title, category, description, achievement_date, organization, certificate_file, verification_status } = req.body;

  if (!student_id || !title || !category || !organization) {
    return res.status(400).json({ error: 'Missing required achievement fields' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const saved = db.saveAchievement(
    {
      id,
      student_id,
      title,
      category,
      description: description || '',
      achievement_date: achievement_date || new Date().toISOString().split('T')[0],
      organization,
      certificate_file,
      verification_status: verification_status || 'Verified',
    },
    req.user!.facultyId!,
    {
      id: req.user!.id,
      role: 'FACULTY',
      name: req.user!.name,
      ip,
    }
  );

  res.json(saved);
});

// GET /api/academic-progress/:studentId - Computed Progress, CGPA, SGPA, Arrears, Risk
academicRouter.get('/academic-progress/:studentId', requireAuth, requireStudentSelfOrFaculty, (req, res) => {
  const studentId = req.params.studentId;
  const student = db.getStudentById(studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const metrics = calculateStudentMetrics(studentId);
  res.json({
    student,
    metrics,
  });
});
