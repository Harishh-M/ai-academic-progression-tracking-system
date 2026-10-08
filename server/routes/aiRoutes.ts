import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireStudentSelfOrFaculty } from '../middleware/auth.js';
import { generateStudentAIAnalysis, handleAIChat, retrieveRelevantRegulations } from '../services/geminiService.js';

export const aiRouter = Router();

// POST /api/ai/analyze/:studentId - Trigger AI performance analysis
aiRouter.post('/analyze/:studentId', requireAuth, requireStudentSelfOrFaculty, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const student = await db.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const analysis = await generateStudentAIAnalysis(studentId);
    res.json(analysis);
  } catch (err: any) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate AI analysis' });
  }
});

// GET /api/ai/analysis/:studentId - Retrieve cached or generated analysis
aiRouter.get('/analysis/:studentId', requireAuth, requireStudentSelfOrFaculty, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const cached = await db.getAIAnalysis(studentId);
    if (cached) {
      return res.json(cached);
    }

    const analysis = await generateStudentAIAnalysis(studentId);
    res.json(analysis);
  } catch (err: any) {
    console.error('AI get analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve analysis' });
  }
});

// POST /api/ai/chat - AI Academic Assistant Chat with strict role & ownership enforcement
aiRouter.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message, targetStudentId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message string is required' });
    }

    const effectiveRole: 'STUDENT' | 'FACULTY' = req.user!.role === 'STUDENT' ? 'STUDENT' : 'FACULTY';
    const userEntityId = req.user!.role === 'STUDENT' ? (req.user!.studentId || req.user!.id) : (req.user!.facultyId || req.user!.id);

    const answer = await handleAIChat(message, effectiveRole, userEntityId, targetStudentId);
    res.json(answer);
  } catch (err: any) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: err.message || 'Error executing AI chat' });
  }
});

// GET /api/ai/regulations - Search & retrieve academic regulations
aiRouter.get('/regulations', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (q && typeof q === 'string') {
      const matches = await retrieveRelevantRegulations(q);
      return res.json(matches);
    }
    const all = await db.getAllRegulations();
    res.json(all);
  } catch (err: any) {
    console.error('Get regulations error:', err);
    res.status(500).json({ error: 'Failed to retrieve regulations' });
  }
});
