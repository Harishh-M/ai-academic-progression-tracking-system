import express from 'express';
import path from 'path';
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


async function startServer() {
  await db.seedIfEmpty();
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

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
  app.use('/api/faculty', (req, res, next) => {
    req.url = `/faculty${req.url === '/' ? '' : req.url}`;
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

  app.listen(PORT, () => {
    console.log(`\n  Academic ERP Server running at:`);
    console.log(`  > Local:   http://localhost:${PORT}/`);
    console.log(`  > Network: http://127.0.0.1:${PORT}/\n`);
  });

  // Optional convenience: forward requests from default Vite port 5173 if free
  if (PORT !== 5173) {
    try {
      const redirectApp = express();
      redirectApp.use((req, res) => {
        res.redirect(`http://localhost:${PORT}${req.url}`);
      });
      const redirectServer = redirectApp.listen(5173, () => {
        console.log(`  > Vite redirect (5173 -> ${PORT}): http://localhost:5173/\n`);
      });
      redirectServer.on('error', () => {
        // Silently ignore if port 5173 is already in use
      });
    } catch {
      // Ignore
    }
  }
}

startServer();
