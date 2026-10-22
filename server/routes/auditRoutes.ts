import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireFacultyOrCOEOrAdmin } from '../middleware/auth.js';

export const auditRouter = Router();

// GET /api/audit-logs - Accessible to Faculty, COE, and Admin
auditRouter.get('/', requireAuth, requireFacultyOrCOEOrAdmin, async (_req, res) => {
  try {
    const logs = await db.getAllAuditLogs();
    res.json(logs);
  } catch (err: any) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});
