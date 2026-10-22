import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { createAuthToken, requireAuth, AuthUser } from '../middleware/auth.js';

export const authRouter = Router();

// Login endpoint - Unified for all 4 roles: STUDENT, FACULTY, COE, ADMIN
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Username or institutional email is required' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    const user = await db.getUserByUsernameOrEmail(username.trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password: password123 is accepted for all accounts, or verify hash with bcrypt
    const isStandardPassword = password === 'password123';
    const passwordMatch = isStandardPassword || (user.password_hash ? await bcrypt.compare(password, user.password_hash) : false);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ error: 'Your account is currently inactive. Contact your institutional administrator.' });
    }

    let facultyId: string | undefined;
    let studentId: string | undefined;
    let name = user.username;

    if (user.role === 'FACULTY') {
      const faculty = await db.getFacultyByUserId(user.id);
      if (faculty) {
        facultyId = faculty.id;
        name = `${faculty.first_name} ${faculty.last_name}`;
      }
    } else if (user.role === 'STUDENT') {
      const student = await db.getStudentByUserId(user.id);
      if (student) {
        studentId = student.id;
        name = student.student_name;
      }
    } else if (user.role === 'COE') {
      name = 'Controller of Examinations';
    } else if (user.role === 'ADMIN') {
      name = 'System Administrator';
    }

    const authUser: AuthUser = {
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
  } catch (err: any) {
    console.error('Login error:', err);
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED') || err.message?.includes('connect')) {
      return res.status(503).json({ error: 'Database service unavailable. Ensure MySQL server is running on localhost:3306.' });
    }
    return res.status(500).json({ error: err.message || 'Authentication failed due to internal error' });
  }
});

// Current user profile
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user.role === 'FACULTY' && req.user.facultyId) {
      const faculty = await db.getFacultyById(req.user.facultyId);
      return res.json({
        user: req.user,
        profile: faculty,
      });
    } else if (req.user.role === 'STUDENT' && req.user.studentId) {
      const student = await db.getStudentById(req.user.studentId);
      return res.json({
        user: req.user,
        profile: student,
      });
    } else if (req.user.role === 'COE') {
      return res.json({
        user: req.user,
        profile: {
          role: 'COE',
          designation: 'Controller of Examinations',
          department: 'Office of the Controller of Examinations',
          institution: 'State Technological University',
        },
      });
    } else if (req.user.role === 'ADMIN') {
      return res.json({
        user: req.user,
        profile: {
          role: 'ADMIN',
          designation: 'System Administrator',
          department: 'ERP & IT Systems Management',
          institution: 'State Technological University',
        },
      });
    }

    return res.json({ user: req.user });
  } catch (err: any) {
    console.error('Fetch me error:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Demo accounts endpoint (provides quick logins for all 4 roles)
authRouter.get('/demo-accounts', async (_req, res) => {
  try {
    const allFaculty = await db.getAllFaculty();
    const allStudents = await db.getAllStudents();

    const facultyList = allFaculty.slice(0, 5).map((f) => ({
      username: f.faculty_code || f.email.split('@')[0],
      name: `${f.first_name} ${f.last_name}`,
      department: f.department,
      designation: f.designation,
      role: 'FACULTY' as const,
      facultyId: f.id,
    }));

    const students = allStudents.slice(0, 5).map((s) => ({
      username: s.register_number,
      regNo: s.register_number,
      name: s.student_name,
      programme: s.programme,
      currentStatus: s.current_status,
      role: 'STUDENT' as const,
      studentId: s.id,
    }));

    const coeAccounts = [
      {
        username: 'coe',
        name: 'Controller of Examinations (COE)',
        department: 'Examination Cell',
        designation: 'Controller of Examinations',
        role: 'COE' as const,
      },
    ];

    const adminAccounts = [
      {
        username: 'admin',
        name: 'University ERP Administrator',
        department: 'IT Administration',
        designation: 'System Admin',
        role: 'ADMIN' as const,
      },
    ];

    res.json({
      faculty: facultyList,
      students,
      coe: coeAccounts,
      admin: adminAccounts,
    });
  } catch (err: any) {
    console.error('Demo accounts error:', err);
    return res.status(500).json({ error: 'Failed to fetch demo accounts' });
  }
});
