import { Router } from 'express';
import { db } from '../db/database.js';
import { createAuthToken, requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

// Login endpoint
authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username or email is required' });
  }

  const user = db.getUserByUsernameOrEmail(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  let facultyId: string | undefined;
  let studentId: string | undefined;
  let name = user.username;

  if (user.role === 'FACULTY') {
    const faculty = db.getFacultyByUserId(user.id);
    if (faculty) {
      facultyId = faculty.id;
      name = `${faculty.first_name} ${faculty.last_name}`;
    }
  } else if (user.role === 'STUDENT') {
    const student = db.getStudentByUserId(user.id);
    if (student) {
      studentId = student.id;
      name = student.student_name;
    }
  }

  const authUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    facultyId,
    studentId,
    name,
  };

  const token = createAuthToken(authUser);

  return res.json({
    token,
    user: authUser,
    role: user.role,
  });
});

// Current user profile
authRouter.get('/me', requireAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.user.role === 'FACULTY' && req.user.facultyId) {
    const faculty = db.getFacultyById(req.user.facultyId);
    return res.json({
      user: req.user,
      profile: faculty,
    });
  } else if (req.user.role === 'STUDENT' && req.user.studentId) {
    const student = db.getStudentById(req.user.studentId);
    return res.json({
      user: req.user,
      profile: student,
    });
  }

  return res.json({ user: req.user });
});

// Demo accounts endpoint (enables seamless 1-click test switching between Faculty and diverse Student scenarios)
authRouter.get('/demo-accounts', (_req, res) => {
  const facultyList = db.getAllFaculty().map((f) => ({
    username: f.email.split('@')[0],
    name: `${f.first_name} ${f.last_name}`,
    department: f.department,
    designation: f.designation,
    role: 'FACULTY' as const,
    facultyId: f.id,
  }));

  const students = db.getAllStudents().map((s) => ({
    username: s.register_number.toLowerCase(),
    regNo: s.register_number,
    name: s.student_name,
    programme: s.programme,
    currentStatus: s.current_status,
    role: 'STUDENT' as const,
    studentId: s.id,
  }));

  res.json({
    faculty: facultyList,
    students,
  });
});
