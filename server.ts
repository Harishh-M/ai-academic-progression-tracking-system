import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './server/routes/authRoutes.js';
import { studentRouter } from './server/routes/studentRoutes.js';
import { academicRouter } from './server/routes/academicRoutes.js';
import { aiRouter } from './server/routes/aiRoutes.js';
import { reportRouter } from './server/routes/reportRoutes.js';
import { auditRouter } from './server/routes/auditRoutes.js';
import { adminRouter } from './server/routes/adminRoutes.js';
import { db } from './server/db/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await db.seedIfEmpty();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Academic Progress and Achievement Tracking System' });
  });

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/students', studentRouter);
  app.use('/api/academic', academicRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/audit-logs', auditRouter);
  app.use('/api/admin', adminRouter);

  // Direct aliases to match requested REST routes
  app.use('/api/courses', (req, res, next) => {
    req.url = `/courses${req.url === '/' ? '' : req.url}`;
    academicRouter(req, res, next);
  });
  app.use('/api/semesters', (req, res, next) => {
    req.url = `/semesters${req.url === '/' ? '' : req.url}`;
    academicRouter(req, res, next);
  });
  app.use('/api/attendance', (req, res, next) => {
    req.url = `/attendance${req.url === '/' ? '' : req.url}`;
    academicRouter(req, res, next);
  });
  app.use('/api/marks', (req, res, next) => {
    req.url = `/marks${req.url === '/' ? '' : req.url}`;
    academicRouter(req, res, next);
  });
  app.use('/api/results', (req, res, next) => {
    req.url = `/results${req.url === '/' ? '' : req.url}`;
    academicRouter(req, res, next);
  });
  app.use('/api/achievements', (req, res, next) => {
    req.url = `/achievements${req.url === '/' ? '' : req.url}`;
    academicRouter(req, res, next);
  });
  app.use('/api/academic-progress', (req, res, next) => {
    req.url = `/academic-progress${req.url}`;
    academicRouter(req, res, next);
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Academic ERP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
