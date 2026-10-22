import { Router } from 'express';
import { db } from '../db/database.js';
import { pool } from '../db/mysql.js';
import {
  requireAuth,
  requireFaculty,
  requireCOEOrAdmin,
  requireStudentSelfOrStaff,
} from '../middleware/auth.js';
import { calculateStudentMetrics } from '../services/academicCalculator.js';

export const academicRouter = Router();

// Courses & Semesters metadata
academicRouter.get('/courses', requireAuth, async (_req, res) => {
  try {
    const courses = await db.getAllCourses();
    res.json(courses);
  } catch (err: any) {
    console.error('Get courses error:', err);
    res.status(500).json({ error: 'Failed to retrieve courses' });
  }
});

academicRouter.get('/semesters', requireAuth, async (_req, res) => {
  try {
    const semesters = await db.getAllSemesters();
    res.json(semesters);
  } catch (err: any) {
    console.error('Get semesters error:', err);
    res.status(500).json({ error: 'Failed to retrieve semesters' });
  }
});

academicRouter.get('/faculty', requireAuth, async (_req, res) => {
  try {
    const faculty = await db.getAllFaculty();
    res.json(faculty);
  } catch (err: any) {
    console.error('Get faculty error:', err);
    res.status(500).json({ error: 'Failed to retrieve faculty list' });
  }
});

// GET /api/attendance - Query attendance
academicRouter.get('/attendance', requireAuth, async (req, res) => {
  try {
    const { studentId, courseId, date } = req.query;

    if (req.user?.role === 'STUDENT') {
      // Student can only query their own attendance
      if (!req.user.studentId) {
        return res.status(403).json({ error: 'Student ID not associated with account' });
      }
      const records = await db.getAttendanceByStudent(req.user.studentId);
      return res.json(records);
    }

    if (studentId && typeof studentId === 'string') {
      return res.json(await db.getAttendanceByStudent(studentId));
    }

    if (courseId && date && typeof courseId === 'string' && typeof date === 'string') {
      return res.json(await db.getAttendanceByCourseAndDate(courseId, date));
    }

    if (courseId && typeof courseId === 'string' && !date) {
      const records = await db.getAttendanceByCourseAndDate ? await db.getAttendanceByCourse(courseId) : [];
      return res.json(records);
    }

    if (req.user?.role === 'FACULTY') {
      let facultyId = req.user.facultyId;
      if (!facultyId && req.user.id) {
        const fac = (await db.getFacultyByUserId(req.user.id)) || (await db.getFacultyById(req.user.id));
        if (fac) facultyId = String(fac.id);
      }
      const facultyCourses = facultyId ? (await db.getFacultyCourses(facultyId)).map((fc) => fc.course_id) : [];
      if (facultyCourses.length > 0) {
        const placeholders = facultyCourses.map(() => '?').join(', ');
        const [rows]: any = await pool.query(
          `SELECT * FROM attendance WHERE course_id IN (${placeholders}) ORDER BY date DESC LIMIT 200`,
          facultyCourses
        );
        return res.json(rows);
      }
      const [rows]: any = await pool.query('SELECT * FROM attendance ORDER BY date DESC LIMIT 100');
      return res.json(rows);
    }

    // COE or ADMIN: return top recent attendance or student filtered
    const [sampleAtt]: any = await pool.query('SELECT * FROM attendance ORDER BY date DESC LIMIT 200');
    res.json(sampleAtt);
  } catch (err: any) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Failed to query attendance records' });
  }
});

// POST /api/attendance - Batch mark attendance (Admin & Faculty authorized)
academicRouter.post('/attendance', requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'FACULTY') {
      return res.status(403).json({
        error:
          '403 Forbidden: Only Faculty and Administration are authorized to mark or alter attendance.',
      });
    }

    const { records } = req.body; // Array of { student_id, course_id, date, status }
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records array is required' });
    }

    const allFaculty = await db.getAllFaculty();
    const markedByFacultyId = req.user.facultyId || (allFaculty.length > 0 ? allFaculty[0].id : '1');

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const updated = await db.recordAttendanceBatch(records, markedByFacultyId, {
      id: req.user.id,
      role: req.user.role as 'ADMIN' | 'FACULTY',
      name: req.user.name,
      ip,
    });

    res.json({ success: true, count: updated.length, records: updated });
  } catch (err: any) {
    console.error('Batch attendance error:', err);
    res.status(500).json({ error: 'Failed to save attendance batch' });
  }
});

// GET /api/marks - Query internal marks
academicRouter.get('/marks', requireAuth, async (req, res) => {
  try {
    const { studentId } = req.query;

    if (req.user?.role === 'STUDENT') {
      if (!req.user.studentId) {
        return res.status(403).json({ error: 'Student ID not associated with account' });
      }
      const marks = await db.getInternalMarksByStudent(req.user.studentId);
      return res.json(marks);
    }

    if (studentId && typeof studentId === 'string') {
      return res.json(await db.getInternalMarksByStudent(studentId));
    }

    if (req.user?.role === 'FACULTY') {
      let facultyId = req.user.facultyId;
      if (!facultyId && req.user.id) {
        const fac = (await db.getFacultyByUserId(req.user.id)) || (await db.getFacultyById(req.user.id));
        if (fac) facultyId = String(fac.id);
      }
      const allStudents = facultyId ? await db.getStudentsByFaculty(facultyId) : [];
      if (allStudents.length > 0) {
        const sIds = allStudents.map((s) => s.id);
        const placeholders = sIds.map(() => '?').join(', ');
        const [rows]: any = await pool.query(
          `SELECT * FROM internal_marks WHERE student_id IN (${placeholders}) ORDER BY created_at DESC LIMIT 300`,
          sIds
        );
        return res.json(rows);
      }
      const [rows]: any = await pool.query('SELECT * FROM internal_marks ORDER BY created_at DESC LIMIT 100');
      return res.json(rows);
    }

    // COE or ADMIN: return internal marks across students
    const [marks]: any = await pool.query('SELECT * FROM internal_marks ORDER BY created_at DESC LIMIT 300');
    res.json(marks);
  } catch (err: any) {
    console.error('Get marks error:', err);
    res.status(500).json({ error: 'Failed to query internal marks' });
  }
});

// POST /api/marks - Add/Update internal marks (Faculty & Admin)
academicRouter.post('/marks', requireAuth, async (req, res) => {
  try {
    const { id, student_id, course_id, assessment_name, assessment_type, marks_obtained, maximum_marks } = req.body;

    if (!student_id || !course_id || !assessment_name || marks_obtained === undefined || maximum_marks === undefined) {
      return res.status(400).json({ error: 'Missing required mark record fields' });
    }

    if (Number(marks_obtained) < 0 || Number(marks_obtained) > Number(maximum_marks)) {
      return res.status(400).json({ error: 'Marks obtained must be between 0 and maximum marks' });
    }

    if (req.user?.role !== 'FACULTY' && req.user?.role !== 'ADMIN' && req.user?.role !== 'COE') {
      return res.status(403).json({ error: '403 Forbidden: Insufficient privileges to enter marks' });
    }

    // If faculty, verify either course assignment, faculty assignment, or departmental match
    if (req.user?.role === 'FACULTY') {
      if (!req.user.facultyId) {
        return res.status(403).json({ error: '403 Forbidden: No faculty ID bound to account' });
      }

      const faculty = await db.getFacultyById(req.user.facultyId);
      const facultyCourses = await db.getFacultyCourses(req.user.facultyId);
      const assignedCourseIds = new Set(facultyCourses.map((fc) => fc.course_id));
      const assignedStudents = await db.getStudentsByFaculty(req.user.facultyId);
      const assignedStudentIds = new Set(assignedStudents.map((s) => s.id));
      const targetStudent = await db.getStudentById(student_id);

      const isDirectlyAssigned = assignedCourseIds.has(course_id) || assignedStudentIds.has(student_id);
      const isSameDept = faculty?.department && targetStudent?.department && faculty.department === targetStudent.department;

      if (!isDirectlyAssigned && !isSameDept) {
        // Faculty can grade their assigned students or department students
        return res.status(403).json({
          error: `403 Forbidden: You can only record marks for students in your department (${faculty?.department}) or assigned courses.`,
        });
      }
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const saved = await db.saveInternalMark(
      {
        id,
        student_id,
        course_id,
        assessment_name,
        assessment_type: assessment_type || 'Internal Test',
        marks_obtained: Number(marks_obtained),
        maximum_marks: Number(maximum_marks),
        entered_by: req.user.facultyId,
      },
      req.user.facultyId,
      {
        id: req.user.id,
        role: 'FACULTY',
        name: req.user.name,
        ip,
      }
    );

    res.json(saved);
  } catch (err: any) {
    console.error('Save internal mark error:', err);
    res.status(500).json({ error: 'Failed to save internal mark' });
  }
});

// GET /api/results - Query semester results
academicRouter.get('/results', requireAuth, async (req, res) => {
  try {
    const { studentId, semesterId, courseId } = req.query;

    if (req.user?.role === 'STUDENT') {
      if (!req.user.studentId) {
        return res.status(403).json({ error: 'Student ID not associated with account' });
      }
      const results = await db.getSemesterResultsByStudent(req.user.studentId);
      return res.json(results);
    }

    if (studentId && typeof studentId === 'string') {
      return res.json(await db.getSemesterResultsByStudent(studentId));
    }

    // Faculty, COE, and ADMIN: Full results query across all historical semesters in read-only mode
    const results = await db.getAllSemesterResults({
      semesterId: typeof semesterId === 'string' && semesterId !== 'all' ? semesterId : undefined,
      courseId: typeof courseId === 'string' && courseId !== 'all' ? courseId : undefined,
      studentId: typeof studentId === 'string' ? studentId : undefined,
      limit: 10000,
    });
    res.json(results);
  } catch (err: any) {
    console.error('Get semester results error:', err);
    res.status(500).json({ error: 'Failed to query semester results' });
  }
});

// POST /api/results - Official Semester Results (COE ONLY; strictly forbidden for FACULTY and STUDENT)
academicRouter.post('/results', requireAuth, async (req, res) => {
  if (req.user?.role !== 'COE' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      error: '403 Forbidden: Teaching staff and faculty are not permitted to alter semester end marks. Only the Controller of Examinations (COE) has authority to change semester marks.',
    });
  }

  try {
    const { id, student_id, semester_id, course_id, grade, grade_point, credits, result_status, academic_year, published_date } = req.body;

    if (!student_id || !semester_id || !course_id || !grade || grade_point === undefined || !credits) {
      return res.status(400).json({ error: 'Missing required semester result fields' });
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const saved = await db.saveSemesterResult(
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
        published_date: published_date || new Date().toISOString().split('T')[0],
      },
      {
        id: req.user!.id,
        role: req.user!.role,
        name: req.user!.name,
        ip,
      }
    );

    res.json(saved);
  } catch (err: any) {
    console.error('Save semester result error:', err);
    res.status(500).json({ error: 'Failed to save semester result' });
  }
});

// PUT /api/results/:id - Alter specific semester result (COE ONLY; forbidden for FACULTY)
academicRouter.put('/results/:id', requireAuth, async (req, res) => {
  if (req.user?.role !== 'COE' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      error: '403 Forbidden: Teaching staff and faculty are not permitted to alter semester end marks. Only the Controller of Examinations (COE) has authority to change semester marks.',
    });
  }

  try {
    const { id } = req.params;
    const body = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const saved = await db.saveSemesterResult(
      {
        ...body,
        id,
      },
      {
        id: req.user!.id,
        role: req.user!.role,
        name: req.user!.name,
        ip,
      }
    );

    res.json(saved);
  } catch (err: any) {
    console.error('Alter semester result error:', err);
    res.status(500).json({ error: 'Failed to alter semester result' });
  }
});

// POST /api/results/publish - Publish/Approve batch results (COE or ADMIN only)
academicRouter.post('/results/publish', requireAuth, requireCOEOrAdmin, async (req, res) => {
  try {
    const { resultIds, publishedDate } = req.body;
    if (!Array.isArray(resultIds) || resultIds.length === 0) {
      return res.status(400).json({ error: 'Array of resultIds is required' });
    }

    const dateStr = publishedDate || new Date().toISOString().split('T')[0];
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const count = await db.publishSemesterResultsBatch(resultIds, dateStr, {
      id: req.user!.id,
      role: req.user!.role,
      name: req.user!.name,
      ip,
    });

    res.json({
      success: true,
      message: `Successfully approved and published ${count} official semester results.`,
      count,
      publishedDate: dateStr,
    });
  } catch (err: any) {
    console.error('Publish results error:', err);
    res.status(500).json({ error: 'Failed to publish results' });
  }
});

// GET /api/achievements - Query achievements
academicRouter.get('/achievements', requireAuth, async (req, res) => {
  try {
    const { studentId } = req.query;

    if (req.user?.role === 'STUDENT') {
      if (!req.user.studentId) {
        return res.status(403).json({ error: 'Student ID not associated with account' });
      }
      const achievements = await db.getAchievementsByStudent(req.user.studentId);
      return res.json(achievements);
    }

    if (studentId && typeof studentId === 'string') {
      return res.json(await db.getAchievementsByStudent(studentId));
    }

    const allAch = await db.getAllAchievements();
    res.json(allAch);
  } catch (err: any) {
    console.error('Get achievements error:', err);
    res.status(500).json({ error: 'Failed to query achievements' });
  }
});

// POST /api/achievements - Create/Update achievement (Students submit Pending, Faculty/Admin verify or edit)
academicRouter.post('/achievements', requireAuth, async (req, res) => {
  try {
    const {
      id,
      student_id,
      title,
      category,
      description,
      achievement_date,
      organization,
      certificate_file,
      verification_status,
      dynamic_fields,
      verification_links,
    } = req.body;

    const isStudent = req.user?.role === 'STUDENT';
    const targetStudentId = isStudent ? req.user!.studentId : student_id;

    if (!targetStudentId || !title || !category || !organization) {
      return res.status(400).json({ error: 'Missing required achievement fields' });
    }

    // Students can only submit with 'Pending' verification status
    const finalStatus: 'Verified' | 'Pending' | 'Rejected' = isStudent
      ? 'Pending'
      : (verification_status || 'Verified');

    const facultyVerifier = isStudent ? null : (req.user!.facultyId || req.user!.id);
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const saved = await db.saveAchievement(
      {
        id,
        student_id: targetStudentId,
        title,
        category,
        description: description || '',
        achievement_date: achievement_date || new Date().toISOString().split('T')[0],
        organization,
        certificate_file,
        verification_status: finalStatus,
        dynamic_fields,
        verification_links,
      },
      facultyVerifier,
      {
        id: req.user!.id,
        role: req.user!.role,
        name: req.user!.name,
        ip,
      }
    );

    res.json(saved);
  } catch (err: any) {
    console.error('Save achievement error:', err);
    res.status(500).json({ error: err.message || 'Failed to save achievement' });
  }
});

// GET /api/academic-progress/:studentId - Computed Progress, CGPA, SGPA, Arrears, Risk
academicRouter.get('/academic-progress/:studentId', requireAuth, requireStudentSelfOrStaff, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const student = await db.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const metrics = await calculateStudentMetrics(studentId);
    res.json({
      student,
      metrics,
    });
  } catch (err: any) {
    console.error('Get academic progress error:', err);
    res.status(500).json({ error: 'Failed to calculate academic progress' });
  }
});
