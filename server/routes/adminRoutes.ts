import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { Course, Faculty, FacultyCourseMapping, Semester, StudentCourseMapping, UserRole } from '../../src/types/index.js';

export const adminRouter = Router();

// Protect ALL admin routes with requireAuth and requireAdmin (403 for non-admins)
adminRouter.use(requireAuth, requireAdmin);

// ================= USERS =================
adminRouter.get('/users', async (_req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (err: any) {
    console.error('Admin get users error:', err);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

adminRouter.post('/users', async (req, res) => {
  try {
    const { username, email, password, role, status } = req.body;
    if (!username || !email || !role) {
      return res.status(400).json({ error: 'Missing required user fields: username, email, role' });
    }

    const existing = await db.getUserByUsernameOrEmail(username);
    if (existing) {
      return res.status(409).json({ error: `User '${username}' already exists` });
    }

    const uId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const passwordHash = await bcrypt.hash(password || 'password123', 10);

    const created = await db.createUser({
      id: uId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      role: role as UserRole,
      status: status || 'Active',
    });

    res.status(201).json(created);
  } catch (err: any) {
    console.error('Admin create user error:', err);
    res.status(500).json({ error: err.message || 'Failed to create user' });
  }
});

adminRouter.put('/users/:id', async (req, res) => {
  try {
    const { username, email, password, role, status } = req.body;
    const updates: any = {};
    if (username) updates.username = username.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (password) updates.password_hash = await bcrypt.hash(password, 10);

    const updated = await db.updateUser(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updated);
  } catch (err: any) {
    console.error('Admin update user error:', err);
    res.status(500).json({ error: err.message || 'Failed to update user' });
  }
});

adminRouter.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete currently logged in administrator account' });
    }
    const success = await db.deleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'User not found or cannot be deleted' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete user' });
  }
});

// ================= FACULTY =================
adminRouter.get('/faculty', async (_req, res) => {
  try {
    const faculty = await db.getAllFaculty();
    res.json(faculty);
  } catch (err: any) {
    console.error('Admin get faculty error:', err);
    res.status(500).json({ error: 'Failed to retrieve faculty list' });
  }
});

adminRouter.post('/faculty', async (req, res) => {
  try {
    const body = req.body;
    if (!body.faculty_code || !body.first_name || !body.last_name || !body.email || !body.department) {
      return res.status(400).json({ error: 'Missing required faculty fields' });
    }

    const uId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fId = `fac_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const passwordHash = await bcrypt.hash('password123', 10);

    await db.createUser({
      id: uId,
      username: body.faculty_code,
      email: body.email.toLowerCase().trim(),
      password_hash: passwordHash,
      role: 'FACULTY',
      status: 'Active',
    });

    const now = new Date().toISOString();
    const newFaculty: Faculty = {
      id: fId,
      user_id: uId,
      faculty_code: body.faculty_code.toUpperCase().trim(),
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      email: body.email.toLowerCase().trim(),
      mobile_number: body.mobile_number || '+91 98000 00000',
      department: body.department,
      designation: body.designation || 'Assistant Professor',
      qualification: body.qualification || 'M.E. / Ph.D',
      specialization: body.specialization || 'Computer Science',
      institution: body.institution || 'State Technological University',
      university: body.university || 'State Technological University',
      date_of_joining: body.date_of_joining || '2022-06-01',
      date_of_birth: body.date_of_birth || '1985-05-15',
      address: body.address || 'University Faculty Quarters',
      working_status: body.working_status || 'Active',
      created_at: now,
      updated_at: now,
    };

    const created = await db.createFaculty(newFaculty);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('Admin create faculty error:', err);
    res.status(500).json({ error: err.message || 'Failed to create faculty' });
  }
});

adminRouter.put('/faculty/:id', async (req, res) => {
  try {
    const updated = await db.updateFaculty(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Faculty record not found' });
    }
    res.json(updated);
  } catch (err: any) {
    console.error('Admin update faculty error:', err);
    res.status(500).json({ error: err.message || 'Failed to update faculty' });
  }
});

// ================= COURSES =================
adminRouter.post('/courses', async (req, res) => {
  try {
    const { course_code, course_name, department, programme, semester_number, credits, course_type } = req.body;
    if (!course_code || !course_name || !department || !credits) {
      return res.status(400).json({ error: 'Missing required course fields' });
    }

    const cId = `crs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCourse: Course = {
      id: cId,
      course_code: course_code.toUpperCase().trim(),
      course_name: course_name.trim(),
      department,
      programme: programme || 'B.E. CSE',
      semester_number: Number(semester_number) || 1,
      credits: Number(credits),
      course_type: course_type || 'Theory',
    };

    const created = await db.createCourse(newCourse);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('Admin create course error:', err);
    res.status(500).json({ error: err.message || 'Failed to create course' });
  }
});

adminRouter.put('/courses/:id', async (req, res) => {
  try {
    const updated = await db.updateCourse(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(updated);
  } catch (err: any) {
    console.error('Admin update course error:', err);
    res.status(500).json({ error: err.message || 'Failed to update course' });
  }
});

// ================= SEMESTERS =================
adminRouter.post('/semesters', async (req, res) => {
  try {
    const { semester_number, academic_year, semester_type, start_date, end_date } = req.body;
    if (!semester_number || !academic_year || !semester_type) {
      return res.status(400).json({ error: 'Missing required semester fields' });
    }

    const sId = `sem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSemester: Semester = {
      id: sId,
      semester_number: Number(semester_number),
      academic_year,
      semester_type,
      start_date: start_date || '2026-07-01',
      end_date: end_date || '2026-12-15',
    };

    const created = await db.createSemester(newSemester);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('Admin create semester error:', err);
    res.status(500).json({ error: err.message || 'Failed to create semester' });
  }
});

// ================= MAPPINGS =================
adminRouter.get('/mappings/faculty', async (_req, res) => {
  try {
    const mappings = await db.getAllFacultyCourses();
    res.json(mappings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve faculty mappings' });
  }
});

adminRouter.post('/mappings/faculty', async (req, res) => {
  try {
    const { faculty_id, course_id, semester_id, academic_year } = req.body;
    if (!faculty_id || !course_id || !semester_id) {
      return res.status(400).json({ error: 'Missing faculty_id, course_id, or semester_id' });
    }

    const mId = `fc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const mapping: FacultyCourseMapping = {
      id: mId,
      faculty_id,
      course_id,
      semester_id,
      academic_year: academic_year || '2024-2025',
    };

    const created = await db.createFacultyCourseMapping(mapping);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create faculty course mapping' });
  }
});

adminRouter.delete('/mappings/faculty/:id', async (req, res) => {
  try {
    const success = await db.deleteFacultyCourseMapping(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete faculty mapping' });
  }
});

adminRouter.get('/mappings/student', async (_req, res) => {
  try {
    const mappings = await db.getAllStudentCourses();
    res.json(mappings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve student mappings' });
  }
});

adminRouter.post('/mappings/student', async (req, res) => {
  try {
    const { student_id, course_id, semester_id, academic_year } = req.body;
    if (!student_id || !course_id || !semester_id) {
      return res.status(400).json({ error: 'Missing student_id, course_id, or semester_id' });
    }

    const mId = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const mapping: StudentCourseMapping = {
      id: mId,
      student_id,
      course_id,
      semester_id,
      academic_year: academic_year || '2024-2025',
    };

    const created = await db.createStudentCourseMapping(mapping);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create student course mapping' });
  }
});

adminRouter.delete('/mappings/student/:id', async (req, res) => {
  try {
    const success = await db.deleteStudentCourseMapping(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete student mapping' });
  }
});
