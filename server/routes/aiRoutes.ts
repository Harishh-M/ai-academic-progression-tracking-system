import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireStudentSelfOrFaculty } from '../middleware/auth.js';
import { generateStudentAIAnalysis, handleAIChat, retrieveRelevantRegulations } from '../services/geminiService.js';

export const aiRouter = Router();

// POST /api/ai/analyze/:studentId - Trigger AI performance analysis
aiRouter.post('/analyze/:studentId', requireAuth, requireStudentSelfOrFaculty, async (req, res) => {
  const studentId = req.params.studentId;
  const student = db.getStudentById(studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  try {
    const analysis = await generateStudentAIAnalysis(studentId);
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate AI analysis' });
  }
});

// GET /api/ai/analysis/:studentId - Retrieve cached or generated analysis
aiRouter.get('/analysis/:studentId', requireAuth, requireStudentSelfOrFaculty, async (req, res) => {
  const studentId = req.params.studentId;
  const cached = db.getAIAnalysis(studentId);
  if (cached) {
    return res.json(cached);
  }

  try {
    const analysis = await generateStudentAIAnalysis(studentId);
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve analysis' });
  }
});

// POST /api/ai/chat - AI Academic Assistant Chat with strict role & ownership enforcement
aiRouter.post('/chat', requireAuth, async (req, res) => {
  const { message, targetStudentId } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message string is required' });
  }

  const role = req.user!.role;
  const userEntityId = role === 'FACULTY' ? req.user!.facultyId! : req.user!.studentId!;

  try {
    const answer = await handleAIChat(message, role, userEntityId, targetStudentId);
    res.json(answer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error executing AI chat' });
  }
});

// GET /api/ai/regulations - Search & retrieve academic regulations
aiRouter.get('/regulations', requireAuth, (req, res) => {
  const { q } = req.query;
  if (q && typeof q === 'string') {
    const matches = retrieveRelevantRegulations(q);
    return res.json(matches);
  }
  res.json(db.getAllRegulations());
});
