import { Router } from 'express';
import { db } from '../db/database.js';
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

    if (req.user?.role === 'FACULTY' && req.user.facultyId) {
      const facultyCourses = (await db.getFacultyCourses(req.user.facultyId)).map((fc) => fc.course_id);
      const allStudents = await db.getStudentsByFaculty(req.user.facultyId);
      const allAtt = (
        await Promise.all(allStudents.map((s) => db.getAttendanceByStudent(s.id)))
      ).flat();
      return res.json(allAtt.filter((a) => facultyCourses.includes(a.course_id)).slice(0, 100));
    }

    // COE or ADMIN: return top recent attendance or student filtered
    const students = await db.getAllStudents();
    const sampleAtt = (
      await Promise.all(students.slice(0, 20).map((s) => db.getAttendanceByStudent(s.id)))
    ).flat();
    res.json(sampleAtt.slice(0, 100));
  } catch (err: any) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Failed to query attendance records' });
  }
});

// POST /api/attendance - Batch mark attendance (Faculty only, strictly restricted to assigned courses/students)
academicRouter.post('/attendance', requireAuth, requireFaculty, async (req, res) => {
  try {
    const { records } = req.body; // Array of { student_id, course_id, date, status }
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records array is required' });
    }

    if (!req.user?.facultyId) {
      return res.status(403).json({ error: '403 Forbidden: No faculty ID bound to account' });
    }

    // Verify faculty is assigned to courses and students
    const facultyCourses = await db.getFacultyCourses(req.user.facultyId);
    const assignedCourseIds = new Set(facultyCourses.map((fc) => fc.course_id));
    const assignedStudents = await db.getStudentsByFaculty(req.user.facultyId);
    const assignedStudentIds = new Set(assignedStudents.map((s) => s.id));

    for (const rec of records) {
      if (!assignedCourseIds.has(rec.course_id) && !assignedStudentIds.has(rec.student_id)) {
        return res.status(403).json({
          error: `403 Forbidden: Faculty is not assigned to course ${rec.course_id} or student ${rec.student_id}. You can only record attendance for assigned courses/students.`,
        });
      }
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const updated = await db.recordAttendanceBatch(records, req.user.facultyId, {
      id: req.user.id,
      role: 'FACULTY',
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

    if (req.user?.role === 'FACULTY' && req.user.facultyId) {
      const allStudents = await db.getStudentsByFaculty(req.user.facultyId);
      const allMarks = (
        await Promise.all(allStudents.map((s) => db.getInternalMarksByStudent(s.id)))
      ).flat();
      return res.json(allMarks);
    }

    // COE or ADMIN: return internal marks across students
    const students = await db.getAllStudents();
    const marks = (
      await Promise.all(students.slice(0, 25).map((s) => db.getInternalMarksByStudent(s.id)))
    ).flat();
    res.json(marks);
  } catch (err: any) {
    console.error('Get marks error:', err);
    res.status(500).json({ error: 'Failed to query internal marks' });
  }
});

// POST /api/marks - Add/Update internal marks (Faculty only, assigned courses/students only)
academicRouter.post('/marks', requireAuth, requireFaculty, async (req, res) => {
  try {
    const { id, student_id, course_id, assessment_name, assessment_type, marks_obtained, maximum_marks } = req.body;

    if (!student_id || !course_id || !assessment_name || marks_obtained === undefined || maximum_marks === undefined) {
      return res.status(400).json({ error: 'Missing required mark record fields' });
    }

    if (Number(marks_obtained) < 0 || Number(marks_obtained) > Number(maximum_marks)) {
      return res.status(400).json({ error: 'Marks obtained must be between 0 and maximum marks' });
    }

    if (!req.user?.facultyId) {
      return res.status(403).json({ error: '403 Forbidden: No faculty ID bound to account' });
    }

    // Check assignment
    const facultyCourses = await db.getFacultyCourses(req.user.facultyId);
    const assignedCourseIds = new Set(facultyCourses.map((fc) => fc.course_id));
    const assignedStudents = await db.getStudentsByFaculty(req.user.facultyId);
    const assignedStudentIds = new Set(assignedStudents.map((s) => s.id));

    if (!assignedCourseIds.has(course_id) && !assignedStudentIds.has(student_id)) {
      return res.status(403).json({
        error: `403 Forbidden: Faculty is not assigned to course ${course_id} or student ${student_id}. You can only add/update marks for assigned courses/students.`,
      });
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
    const { studentId, semesterId } = req.query;

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

    if (req.user?.role === 'FACULTY' && req.user.facultyId) {
      const allStudents = await db.getStudentsByFaculty(req.user.facultyId);
      const allResults = (
        await Promise.all(allStudents.map((s) => db.getSemesterResultsByStudent(s.id)))
      ).flat();
      return res.json(allResults);
    }

    // COE and ADMIN: Full results view
    let results = await db.getAllSemesterResults();
    if (semesterId && typeof semesterId === 'string') {
      results = results.filter((r) => r.semester_id === semesterId);
    }
    res.json(results);
  } catch (err: any) {
    console.error('Get semester results error:', err);
    res.status(500).json({ error: 'Failed to query semester results' });
  }
});

// POST /api/results - Official Semester Results (COE or ADMIN ONLY; strictly forbidden for FACULTY and STUDENT)
academicRouter.post('/results', requireAuth, requireCOEOrAdmin, async (req, res) => {
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

    const allStudents = await db.getAllStudents();
    const allAch = (
      await Promise.all(allStudents.slice(0, 50).map((s) => db.getAchievementsByStudent(s.id)))
    ).flat();

    res.json(allAch);
  } catch (err: any) {
    console.error('Get achievements error:', err);
    res.status(500).json({ error: 'Failed to query achievements' });
  }
});

// POST /api/achievements - Create/Update achievement (Faculty or Admin only)
academicRouter.post('/achievements', requireAuth, requireFaculty, async (req, res) => {
  try {
    const { id, student_id, title, category, description, achievement_date, organization, certificate_file, verification_status } = req.body;

    if (!student_id || !title || !category || !organization) {
      return res.status(400).json({ error: 'Missing required achievement fields' });
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const saved = await db.saveAchievement(
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
      req.user!.facultyId || req.user!.id,
      {
        id: req.user!.id,
        role: 'FACULTY',
        name: req.user!.name,
        ip,
      }
    );

    res.json(saved);
  } catch (err: any) {
    console.error('Save achievement error:', err);
    res.status(500).json({ error: 'Failed to save achievement' });
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
