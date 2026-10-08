import { Router } from 'express';
import { db } from '../db/database.js';
import {
  requireAuth,
  requireFaculty,
  requireFacultyOrCOEOrAdmin,
  requireRole,
  requireStudentSelfOrStaff,
} from '../middleware/auth.js';
import { calculateStudentMetrics } from '../services/academicCalculator.js';
import { Student } from '../../src/types/index.js';

export const studentRouter = Router();

// GET /api/students - List students (Faculty, COE, Admin only; strictly forbidden for STUDENT)
studentRouter.get('/', requireAuth, requireFacultyOrCOEOrAdmin, async (req, res) => {
  try {
    const { search, programme, department, batch, status, risk } = req.query;
    let students = await db.getAllStudents();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      students = students.filter(
        (s) =>
          s.student_name.toLowerCase().includes(q) ||
          s.register_number.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.abc_id && s.abc_id.toLowerCase().includes(q))
      );
    }

    if (programme && typeof programme === 'string') {
      students = students.filter((s) => s.programme === programme);
    }

    if (department && typeof department === 'string') {
      students = students.filter((s) => s.department === department);
    }

    if (batch && typeof batch === 'string') {
      students = students.filter((s) => s.batch === batch);
    }

    if (status && typeof status === 'string') {
      students = students.filter((s) => s.current_status === status);
    }

    // Attach calculated summary metrics to each student for the management table
    const enriched = await Promise.all(
      students.map(async (s) => {
        const metrics = await calculateStudentMetrics(s.id);
        return {
          ...s,
          cgpa: metrics.cgpa,
          currentSGPA: metrics.currentSGPA,
          attendancePercentage: metrics.attendancePercentage,
          currentArrears: metrics.currentArrears,
          riskLevel: metrics.riskLevel,
          performanceStatus: metrics.performanceStatus,
        };
      })
    );

    if (risk && typeof risk === 'string') {
      const filteredByRisk = enriched.filter((s) => s.riskLevel.toLowerCase() === (risk as string).toLowerCase());
      return res.json(filteredByRisk);
    }

    res.json(enriched);
  } catch (err: any) {
    console.error('List students error:', err);
    res.status(500).json({ error: 'Failed to retrieve students from database' });
  }
});

// GET /api/students/assigned - Get students assigned to logged-in faculty
studentRouter.get('/assigned', requireAuth, requireFaculty, async (req, res) => {
  try {
    if (!req.user?.facultyId) {
      return res.status(400).json({ error: 'Faculty ID not associated with account' });
    }

    const students = await db.getStudentsByFaculty(req.user.facultyId);
    const enriched = await Promise.all(
      students.map(async (s) => {
        const metrics = await calculateStudentMetrics(s.id);
        return {
          ...s,
          cgpa: metrics.cgpa,
          currentSGPA: metrics.currentSGPA,
          attendancePercentage: metrics.attendancePercentage,
          currentArrears: metrics.currentArrears,
          riskLevel: metrics.riskLevel,
          performanceStatus: metrics.performanceStatus,
        };
      })
    );

    res.json(enriched);
  } catch (err: any) {
    console.error('List assigned students error:', err);
    res.status(500).json({ error: 'Failed to retrieve assigned students' });
  }
});

// GET /api/students/:id - Get specific student details (Strict student self-view guard)
studentRouter.get('/:id', requireAuth, requireStudentSelfOrStaff, async (req, res) => {
  try {
    const student = await db.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const metrics = await calculateStudentMetrics(student.id);
    const attendance = await db.getAttendanceByStudent(student.id);
    const marks = await db.getInternalMarksByStudent(student.id);
    const results = await db.getSemesterResultsByStudent(student.id);
    const achievements = await db.getAchievementsByStudent(student.id);

    res.json({
      student,
      metrics,
      attendance,
      internalMarks: marks,
      semesterResults: results,
      achievements,
    });
  } catch (err: any) {
    console.error('Get student details error:', err);
    res.status(500).json({ error: 'Failed to retrieve student details' });
  }
});

// POST /api/students - Add new student (Faculty or Admin only)
studentRouter.post('/', requireAuth, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const body = req.body;

    // Validation
    if (!body.register_number || !body.student_name || !body.email || !body.programme) {
      return res.status(400).json({ error: 'Missing required fields: register_number, student_name, email, programme' });
    }

    // Check unique register number
    const existing = await db.getStudentByRegisterNumber(body.register_number);
    if (existing) {
      return res.status(409).json({ error: `Student with Register Number ${body.register_number} already exists.` });
    }

    const sId = `stu_${Date.now()}`;
    const uId = `usr_${Date.now()}`;
    const now = new Date().toISOString();

    const newUser = {
      id: uId,
      username: body.register_number.toLowerCase(),
      email: body.email,
      role: 'STUDENT' as const,
      status: 'Active' as const,
      created_at: now,
      updated_at: now,
    };

    const newStudent: Student = {
      id: sId,
      user_id: uId,
      register_number: body.register_number.toUpperCase().trim(),
      admission_number: body.admission_number || `ADM${Date.now().toString().slice(-6)}`,
      student_name: body.student_name.trim(),
      date_of_birth: body.date_of_birth || '2004-01-01',
      gender: body.gender || 'Male',
      abc_id: body.abc_id || `ABC-${Date.now().toString().slice(-12)}`,
      umis_number: body.umis_number || `UMIS${Date.now().toString().slice(-10)}`,
      email: body.email.toLowerCase().trim(),
      mobile_number: body.mobile_number || '+91 90000 00000',
      admission_type: body.admission_type || 'Regular',
      programme: body.programme,
      programme_short_name: body.programme_short_name || 'B.E. CSE',
      branch: body.branch || 'Computer Science and Engineering',
      branch_code: body.branch_code || 'CSE',
      department: body.department || 'Computer Science and Engineering',
      batch: body.batch || '2023-2027',
      year_of_admission: Number(body.year_of_admission) || 2023,
      current_status: body.current_status || 'Continuing',
      programme_status: body.programme_status || 'Active',
      degree_awarded_month_year: body.degree_awarded_month_year,
      student_fees_status: body.student_fees_status || 'Paid',
      readmitted_category: body.readmitted_category || 'No',
      readmitted_year: body.readmitted_year ? Number(body.readmitted_year) : undefined,
      readmitted_batch: body.readmitted_batch,
      address: body.address || 'University Residential Campus',
      assigned_faculty_id: req.user?.facultyId,
      created_at: now,
      updated_at: now,
    };

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const created = await db.createStudent(newStudent, newUser, {
      id: req.user!.id,
      role: req.user!.role,
      name: req.user!.name,
      ip,
    });

    res.status(201).json(created);
  } catch (err: any) {
    console.error('Create student error:', err);
    res.status(500).json({ error: err.message || 'Failed to create student' });
  }
});

// PUT /api/students/:id - Update student (Faculty or Admin only, strictly rejected for students)
studentRouter.put('/:id', requireAuth, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const studentId = req.params.id;
    const updates = req.body;

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const updated = await db.updateStudent(studentId, updates, {
      id: req.user!.id,
      role: 'FACULTY',
      name: req.user!.name,
      ip,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(updated);
  } catch (err: any) {
    console.error('Update student error:', err);
    res.status(500).json({ error: err.message || 'Failed to update student' });
  }
});
