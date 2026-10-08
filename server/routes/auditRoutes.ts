import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireFaculty } from '../middleware/auth.js';

export const auditRouter = Router();

// GET /api/audit-logs - Faculty view of audit trails
auditRouter.get('/', requireAuth, requireFaculty, async (_req, res) => {
  try {
    const logs = await db.getAllAuditLogs();
    res.json(logs);
  } catch (err: any) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});
