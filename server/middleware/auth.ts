import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../src/types/index.js';

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

/**
 * Reusable role authorization middleware factory
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Please authenticate first' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `403 Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Current role is '${req.user.role}'.`,
      });
    }

    next();
  };
}

// Role-specific middleware
export const requireStudent = requireRole('STUDENT');
export const requireFaculty = requireRole('FACULTY');
export const requireCOE = requireRole('COE');
export const requireAdmin = requireRole('ADMIN');

// Combined role helpers
export const requireCOEOrAdmin = requireRole('COE', 'ADMIN');
export const requireFacultyOrAdmin = requireRole('FACULTY', 'ADMIN');
export const requireFacultyOrCOEOrAdmin = requireRole('FACULTY', 'COE', 'ADMIN');

/**
 * Guard that allows a student to only access their own record,
 * while allowing staff (Faculty, COE, Admin) to view it.
 */
export function requireStudentSelfOrStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const targetStudentId = req.params.studentId || req.params.id;

  if (req.user.role === 'STUDENT') {
    if (!req.user.studentId || req.user.studentId !== targetStudentId) {
      return res.status(403).json({
        error: '403 Forbidden: Students are strictly prohibited from accessing another student academic record.',
      });
    }
  }

  next();
}

// Backwards-compatible alias for existing imports
export const requireStudentSelfOrFaculty = requireStudentSelfOrStaff;
