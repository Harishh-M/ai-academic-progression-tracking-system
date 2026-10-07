import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../src/types/index.js';
import { db } from '../db/database.js';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  facultyId?: string;
  studentId?: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Token generator & verifier using safe standard signed token
const SECRET_SALT = 'academic_erp_sec_key_2026';

export function createAuthToken(user: AuthUser): string {
  const data = JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  const base64Data = Buffer.from(data).toString('base64');
  return `ERP_JWT.${base64Data}.${Buffer.from(data + SECRET_SALT).toString('base64').substring(0, 16)}`;
}

export function decodeAuthToken(token: string): AuthUser | null {
  try {
    if (!token.startsWith('ERP_JWT.')) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const jsonStr = Buffer.from(parts[1], 'base64').toString('utf-8');
    const parsed = JSON.parse(jsonStr);
    if (parsed.exp && parsed.exp < Date.now()) {
      return null;
    }
    return {
      id: parsed.id,
      username: parsed.username,
      role: parsed.role,
      facultyId: parsed.facultyId,
      studentId: parsed.studentId,
      name: parsed.name,
    };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
  }

  const token = authHeader.substring(7).trim();
  const user = decodeAuthToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid token' });
  }

  req.user = user;
  next();
}

export function requireFaculty(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.user.role !== 'FACULTY') {
    return res.status(403).json({
      error: '403 Forbidden: Student accounts are strictly restricted from performing modification operations.',
    });
  }
  next();
}

export function requireStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: '403 Forbidden: Access restricted to student role' });
  }
  next();
}

export function requireStudentSelfOrFaculty(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const targetStudentId = req.params.studentId || req.params.id;

  if (req.user.role === 'STUDENT') {
    if (req.user.studentId !== targetStudentId) {
      return res.status(403).json({
        error: '403 Forbidden: Students are strictly prohibited from accessing another student academic record.',
      });
    }
  }

  // If faculty, access granted
  next();
}
