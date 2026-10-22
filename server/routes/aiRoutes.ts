import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireStudentSelfOrFaculty } from '../middleware/auth.js';
import {
  analyzeStudentAcademicIntelligence,
  generateStudentAIAnalysis,
  handleAIChat,
  retrieveRelevantRegulations,
} from '../services/geminiService.js';

export const aiRouter = Router();

/**
 * POST /api/ai/academic-intelligence/analyze
 * Master Phase 5 Endpoint: Triggers Gemini Academic Intelligence analysis
 * Validates requester role, extracts verified MySQL records, and returns structured JSON envelope.
 */
aiRouter.post('/academic-intelligence/analyze', requireAuth, requireStudentSelfOrFaculty, async (req, res) => {
  try {
    const studentId = req.body?.studentId || (req.user?.role === 'STUDENT' ? req.user.studentId : null);
    if (!studentId || typeof studentId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid studentId in request body',
      });
    }

    // Role safety: Students cannot analyze another student's record
    if (req.user?.role === 'STUDENT' && req.user.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You are not authorized to analyze other students records.',
      });
    }

    const student = await db.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student record not found in institutional database',
      });
    }

    const analysis = await analyzeStudentAcademicIntelligence(studentId);

    return res.json({
      success: true,
      engine: analysis.engine || 'Gemini Academic Intelligence Engine',
      generatedAt: analysis.generatedAt || new Date().toISOString(),
      data: {
        overallAssessment: analysis.overallAssessment,
        performanceLevel: analysis.performanceLevel,
        riskLevel: analysis.riskLevel,
        trajectoryExplanation: analysis.trajectoryExplanation,
        diagnosticRationale: analysis.diagnosticRationale,
        strengths: analysis.strengths || [],
        attentionAreas: analysis.attentionAreas || [],
        recommendations: analysis.recommendations || [],
        dataLimitations: analysis.dataLimitations || [],
      },
    });
  } catch (err: any) {
    console.error('Academic Intelligence API Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to complete Academic Intelligence analysis',
    });
  }
});

/**
 * GET /api/ai/academic-intelligence/analysis/:studentId
 * Retrieves cached academic intelligence or generates a fresh evaluation
 */
aiRouter.get('/academic-intelligence/analysis/:studentId', requireAuth, requireStudentSelfOrFaculty, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const student = await db.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const cached = await db.getAIAnalysis(studentId);
    if (cached && (cached.overallAssessment || cached.strengths)) {
      const anyCached = cached as any;
      // Re-map or format cached analysis if stored in extended format
      const structuredData = {
        overallAssessment: anyCached.overallAssessment || anyCached.summary || '',
        performanceLevel: anyCached.performanceLevel || 'Good',
        riskLevel: anyCached.riskLevel || 'Low',
        trajectoryExplanation: anyCached.trajectoryExplanation || anyCached.performanceTrendExplanation || '',
        diagnosticRationale: anyCached.diagnosticRationale || (anyCached.riskReasons ? anyCached.riskReasons.join('; ') : ''),
        strengths: Array.isArray(anyCached.strengths) && anyCached.strengths.length > 0 && typeof anyCached.strengths[0] === 'object'
          ? anyCached.strengths
          : (anyCached.strengths || []).map((s: string) => ({ title: 'Academic Strength', evidence: s })),
        attentionAreas: Array.isArray(anyCached.attentionAreas)
          ? anyCached.attentionAreas
          : (anyCached.weakSubjects || []).map((ws: string) => ({
              subject: ws,
              issue: 'Course Attention Required',
              evidence: 'Identified from marks and examination history',
              suggestedAction: 'Consult faculty mentor for remedial coursework',
            })),
        recommendations: Array.isArray(anyCached.recommendations)
          ? anyCached.recommendations
          : Array.isArray(anyCached.structuredRecommendations)
          ? anyCached.structuredRecommendations
          : (anyCached.personalizedRecommendations || []).map((r: string) => ({
              title: 'Recommended Action',
              reason: 'Academic progression support',
              action: r,
              priority: 'Medium' as const,
            })),
        dataLimitations: anyCached.dataLimitations || [],
      };

      return res.json({
        success: true,
        engine: (cached as any).engine || 'Gemini Academic Intelligence Engine',
        generatedAt: (cached as any).generatedAt || (cached as any).timestamp || new Date().toISOString(),
        data: structuredData,
      });
    }

    // Fresh generation if not cached
    const analysis = await analyzeStudentAcademicIntelligence(studentId);
    return res.json({
      success: true,
      engine: analysis.engine || 'Gemini Academic Intelligence Engine',
      generatedAt: analysis.generatedAt || new Date().toISOString(),
      data: {
        overallAssessment: analysis.overallAssessment,
        performanceLevel: analysis.performanceLevel,
        riskLevel: analysis.riskLevel,
        trajectoryExplanation: analysis.trajectoryExplanation,
        diagnosticRationale: analysis.diagnosticRationale,
        strengths: analysis.strengths || [],
        attentionAreas: analysis.attentionAreas || [],
        recommendations: analysis.recommendations || [],
        dataLimitations: analysis.dataLimitations || [],
      },
    });
  } catch (err: any) {
    console.error('Get Academic Intelligence Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to retrieve analysis' });
  }
});

// POST /api/ai/analyze/:studentId - Trigger legacy AI performance analysis
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

// GET /api/ai/analysis/:studentId - Retrieve cached or generated legacy analysis
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
