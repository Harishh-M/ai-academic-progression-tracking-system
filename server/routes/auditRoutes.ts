import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireFaculty } from '../middleware/auth.js';

export const auditRouter = Router();

// GET /api/audit-logs - Faculty view of audit trails
auditRouter.get('/', requireAuth, requireFaculty, (_req, res) => {
  const logs = db.getAllAuditLogs();
  res.json(logs);
});
