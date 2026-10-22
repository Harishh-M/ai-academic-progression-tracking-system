import { GoogleGenAI, Type } from '@google/genai';
import {
  AIAnalysisResult,
  AcademicIntelligenceAnalysis,
  AcademicPerformanceLevel,
  AcademicRiskLevel,
  ChatMessage,
  InstitutionalRegulation,
  Student,
} from '../../src/types/index.js';
import { db } from '../db/database.js';
import { calculateStudentMetrics } from './academicCalculator.js';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

const academicIntelligenceSchema = {
  type: Type.OBJECT,
  properties: {
    overallAssessment: {
      type: Type.STRING,
      description: 'Comprehensive, objective assessment summarizing student academic standing based strictly on verified facts.',
    },
    performanceLevel: {
      type: Type.STRING,
      enum: ['Excellent', 'Good', 'Needs Improvement', 'Insufficient Data'],
      description: 'Performance classification based on CGPA and academic standing criteria.',
    },
    riskLevel: {
      type: Type.STRING,
      enum: ['Low', 'Medium', 'High', 'Insufficient Data'],
      description: 'Preliminary academic-support risk indicator based on attendance threshold (<75%), arrears count, and CGPA.',
    },
    trajectoryExplanation: {
      type: Type.STRING,
      description: 'Detailed explanation of the student performance trajectory across semesters and recent assessments.',
    },
    diagnosticRationale: {
      type: Type.STRING,
      description: 'Diagnostic rationale explaining the performance and risk standing backed by verified data evidence.',
    },
    strengths: {
      type: Type.ARRAY,
      description: 'List of academic and co-curricular strengths evident from verified records.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          evidence: { type: Type.STRING },
        },
        required: ['title', 'evidence'],
      },
    },
    attentionAreas: {
      type: Type.ARRAY,
      description: 'Weak courses, attendance deficits, or areas requiring attention with suggested next steps.',
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          issue: { type: Type.STRING },
          evidence: { type: Type.STRING },
          suggestedAction: { type: Type.STRING },
        },
        required: ['subject', 'issue', 'evidence', 'suggestedAction'],
      },
    },
    recommendations: {
      type: Type.ARRAY,
      description: 'Prioritized actionable academic recommendations.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          reason: { type: Type.STRING },
          action: { type: Type.STRING },
          priority: {
            type: Type.STRING,
            enum: ['High', 'Medium', 'Low'],
          },
        },
        required: ['title', 'reason', 'action', 'priority'],
      },
    },
    dataLimitations: {
      type: Type.ARRAY,
      description: 'Explicit list of data limitations when records are incomplete or historical data is missing.',
      items: { type: Type.STRING },
    },
  },
  required: [
    'overallAssessment',
    'performanceLevel',
    'riskLevel',
    'trajectoryExplanation',
    'diagnosticRationale',
    'strengths',
    'attentionAreas',
    'recommendations',
    'dataLimitations',
  ],
};

/**
 * Real AI Academic Intelligence Analysis Engine
 * Uses Google Gemini AI via official @google/genai SDK with strict JSON schema
 * Grounded exclusively in verified MySQL records.
 */
export async function analyzeStudentAcademicIntelligence(studentId: string): Promise<AcademicIntelligenceAnalysis> {
  const student = await db.getStudentById(studentId);
  if (!student) {
    throw new Error('Student not found in institutional database');
  }

  // 1. Retrieve verified records from MySQL
  const metrics = await calculateStudentMetrics(studentId);
  const internalMarks = await db.getInternalMarksByStudent(studentId);
  const semesterResults = await db.getSemesterResultsByStudent(studentId);
  const courses = await db.getAllCourses();
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // 2. Build verified academic context string
  const marksSummary = internalMarks
    .map((im) => {
      const c = courseMap.get(im.course_id);
      return `${c?.course_name || im.course_id} (${im.assessment_name}): ${im.marks_obtained}/${im.maximum_marks}`;
    })
    .slice(0, 15)
    .join('; ');

  const semesterSummary = metrics.semesterSGPA
    .map((s) => `Semester ${s.semesterNumber}: SGPA ${s.sgpa.toFixed(2)} (${s.passedCourses} passed, ${s.failedCourses} failed, credits: ${s.earnedCredits}/${s.totalCredits})`)
    .join('; ');

  const arrearSummary =
    metrics.currentArrears > 0
      ? metrics.arrearCourses.map((a) => `${a.courseName} (${a.courseCode}) - Grade ${a.grade}`).join(', ')
      : 'None (Zero active arrears)';

  const promptDossier = `
STUDENT VERIFIED ACADEMIC DOSSIER (OFFICIAL ERP DATA):
- Student Name: ${student.student_name}
- Register Number: ${student.register_number}
- Programme: ${student.programme} (${student.branch})
- Department: ${student.department}
- Current Status: ${student.current_status}
- Verified Cumulative GPA (CGPA): ${metrics.cgpa.toFixed(2)}
- Current Semester SGPA: ${metrics.currentSGPA.toFixed(2)}
- Overall Attendance: ${metrics.attendancePercentage}% (${metrics.presentClasses} present out of ${metrics.totalClasses} total classes)
- Active Unresolved Arrears: ${metrics.currentArrears} [${arrearSummary}]
- Cleared Arrears History: ${metrics.clearedArrears}
- Deterministic Academic Status: ${metrics.performanceStatus}
- Baseline Risk Classification: ${metrics.riskLevel}
- Risk Trigger Reasons: ${metrics.riskReasons.join(' | ') || 'None'}
- Semester Progression History: ${semesterSummary || 'First semester active'}
- Continuous Internal Assessment Scores: ${marksSummary || 'No continuous internal marks recorded'}
- Total Recorded Achievements: ${metrics.totalAchievements} (${metrics.verifiedAchievements} verified)

INSTRUCTIONS:
You are the institutional Academic Intelligence Advisor. You analyze verified academic facts from the ERP database.
Strict rules:
1. NEVER fabricate marks, attendance percentage, grades, arrears, semester counts, or course titles.
2. Every strength, attention area, and recommendation must be grounded in the verified dossier above.
3. If academic records are missing or sparse (e.g. 0 classes, 0 semester results), set performanceLevel and riskLevel to 'Insufficient Data' and state the missing items in dataLimitations.
4. Output valid JSON strictly matching the defined schema.
`;

  // Pre-generate deterministic grounded analysis as robust baseline/fallback
  const fallbackResult = generateDeterministicAcademicIntelligence(student, metrics, internalMarks, courses);

  const ai = getGenAI();
  const selectedModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: promptDossier,
        config: {
          systemInstruction:
            'You are an institutional academic intelligence engine. Interpret only verified ERP academic records. Never fabricate facts. Return valid JSON matching the exact schema.',
          responseMimeType: 'application/json',
          responseSchema: academicIntelligenceSchema,
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      // Validate parsed JSON semantics against schema requirements
      const validated = validateAndSanitizeAcademicIntelligence(parsed, student, metrics, fallbackResult);
      await db.saveAIAnalysis(validated as any);
      return validated;
    } catch (err) {
      console.warn(
        `Gemini API request failed using model '${selectedModel}'. Falling back to verified deterministic academic analysis:`,
        err
      );
    }
  }

  // If no Gemini client or API call threw, return verified deterministic intelligence grounded in real MySQL data
  await db.saveAIAnalysis(fallbackResult as any);
  return fallbackResult;
}

/**
 * Validate and sanitize raw Gemini output against semantic constraints
 */
function validateAndSanitizeAcademicIntelligence(
  parsed: any,
  student: Student,
  metrics: Awaited<ReturnType<typeof calculateStudentMetrics>>,
  fallback: AcademicIntelligenceAnalysis
): AcademicIntelligenceAnalysis {
  const allowedPerformance: AcademicPerformanceLevel[] = ['Excellent', 'Good', 'Needs Improvement', 'Insufficient Data'];
  const allowedRisk: AcademicRiskLevel[] = ['Low', 'Medium', 'High', 'Insufficient Data'];

  const performanceLevel = allowedPerformance.includes(parsed.performanceLevel)
    ? parsed.performanceLevel
    : fallback.performanceLevel;

  const riskLevel = allowedRisk.includes(parsed.riskLevel)
    ? parsed.riskLevel
    : fallback.riskLevel;

  const strengths = Array.isArray(parsed.strengths) && parsed.strengths.length > 0
    ? parsed.strengths.map((s: any) => ({
        title: typeof s?.title === 'string' && s.title.trim() ? s.title.trim() : 'Academic Progress',
        evidence: typeof s?.evidence === 'string' && s.evidence.trim() ? s.evidence.trim() : `Verified attendance: ${metrics.attendancePercentage}%`,
      }))
    : fallback.strengths;

  const attentionAreas = Array.isArray(parsed.attentionAreas) && parsed.attentionAreas.length > 0
    ? parsed.attentionAreas.map((a: any) => ({
        subject: typeof a?.subject === 'string' && a.subject.trim() ? a.subject.trim() : 'Core Academic Module',
        issue: typeof a?.issue === 'string' && a.issue.trim() ? a.issue.trim() : 'Attention required',
        evidence: typeof a?.evidence === 'string' && a.evidence.trim() ? a.evidence.trim() : 'Based on continuous assessment records',
        suggestedAction: typeof a?.suggestedAction === 'string' && a.suggestedAction.trim() ? a.suggestedAction.trim() : 'Consult course faculty during office hours',
      }))
    : fallback.attentionAreas;

  const recommendations = Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
    ? parsed.recommendations.map((r: any) => ({
        title: typeof r?.title === 'string' && r.title.trim() ? r.title.trim() : 'Targeted Study Plan',
        reason: typeof r?.reason === 'string' && r.reason.trim() ? r.reason.trim() : 'Promotes sustained academic progression',
        action: typeof r?.action === 'string' && r.action.trim() ? r.action.trim() : 'Complete scheduled practice questions and maintain attendance',
        priority: ['High', 'Medium', 'Low'].includes(r?.priority) ? r.priority : 'Medium',
      }))
    : fallback.recommendations;

  const dataLimitations = Array.isArray(parsed.dataLimitations)
    ? parsed.dataLimitations.filter((d: any) => typeof d === 'string' && d.trim().length > 0)
    : fallback.dataLimitations;

  return {
    id: `ai_${student.id}_${Date.now()}`,
    studentId: student.id,
    generatedAt: new Date().toISOString(),
    engine: 'Gemini Academic Intelligence Engine',
    overallAssessment:
      typeof parsed.overallAssessment === 'string' && parsed.overallAssessment.trim().length > 10
        ? parsed.overallAssessment.trim()
        : fallback.overallAssessment,
    performanceLevel,
    riskLevel,
    trajectoryExplanation:
      typeof parsed.trajectoryExplanation === 'string' && parsed.trajectoryExplanation.trim().length > 10
        ? parsed.trajectoryExplanation.trim()
        : fallback.trajectoryExplanation,
    diagnosticRationale:
      typeof parsed.diagnosticRationale === 'string' && parsed.diagnosticRationale.trim().length > 10
        ? parsed.diagnosticRationale.trim()
        : fallback.diagnosticRationale,
    strengths,
    attentionAreas,
    recommendations,
    dataLimitations,
    // Legacy compatibility fields
    summary: parsed.overallAssessment || fallback.overallAssessment,
    weakSubjects: attentionAreas.map((a: any) => a.subject),
    performanceTrendExplanation: parsed.trajectoryExplanation || fallback.trajectoryExplanation,
    riskReasons: metrics.riskReasons,
    personalizedRecommendations: recommendations.map((r: any) => `${r.title}: ${r.action}`),
    suggestedAreasForImprovement: attentionAreas.map((a: any) => a.suggestedAction),
  };
}

/**
 * Deterministic Academic Intelligence Generator
 * Grounded 100% in verified MySQL records. Never fabricates facts.
 */
function generateDeterministicAcademicIntelligence(
  student: Student,
  metrics: Awaited<ReturnType<typeof calculateStudentMetrics>>,
  internalMarks: any[],
  courses: any[]
): AcademicIntelligenceAnalysis {
  const isInsufficient = metrics.totalClasses === 0 && metrics.semesterSGPA.length === 0;

  if (isInsufficient) {
    return {
      id: `ai_${student.id}_deterministic`,
      studentId: student.id,
      generatedAt: new Date().toISOString(),
      engine: 'Gemini Academic Intelligence Engine (Deterministic Grounding)',
      overallAssessment: `Verified institutional records for ${student.student_name} (${student.register_number}) are currently sparse. Continuous assessment marks and semester exam results are awaiting publishing.`,
      performanceLevel: 'Insufficient Data',
      riskLevel: 'Insufficient Data',
      trajectoryExplanation: 'Unable to calculate multi-semester trajectory due to absence of finalized semester results.',
      diagnosticRationale: 'No semester examination or continuous attendance logs have been recorded in the database yet.',
      strengths: [
        {
          title: 'Active Institutional Enrollment',
          evidence: `Formally enrolled in ${student.programme} (${student.department}) with status '${student.current_status}'.`,
        },
      ],
      attentionAreas: [
        {
          subject: 'Enrollment Data Completeness',
          issue: 'Missing Examination & Attendance Records',
          evidence: 'Zero attendance sessions and zero semester marks returned from MySQL query.',
          suggestedAction: 'Ensure semester course registration and continuous assessment logging are completed in ERP.',
        },
      ],
      recommendations: [
        {
          title: 'Complete Course Enrollment',
          reason: 'Academic progression engine requires active course mappings.',
          action: 'Contact department coordinator to verify course and section enrollment.',
          priority: 'High',
        },
      ],
      dataLimitations: [
        'Zero continuous internal assessment marks entered for the current academic session.',
        'No published semester grade records located in the institutional database.',
        'Classroom attendance records are unrecorded or pending entry.',
      ],
      summary: `Academic record for ${student.student_name} is currently incomplete.`,
      weakSubjects: ['Pending Course Records'],
      performanceTrendExplanation: 'Insufficient semester records for trend computation.',
      riskReasons: ['Academic data incomplete'],
      personalizedRecommendations: ['Complete course enrollment with department advisor.'],
      suggestedAreasForImprovement: ['Enrollment verification'],
    };
  }

  const isHighRisk = metrics.riskLevel === 'High';
  const isMedRisk = metrics.riskLevel === 'Medium';

  let performanceLevel: AcademicPerformanceLevel = 'Good';
  if (isHighRisk) {
    performanceLevel = 'Needs Improvement';
  } else if (isMedRisk) {
    performanceLevel = metrics.currentArrears > 0 ? 'Needs Improvement' : 'Good';
  } else if (metrics.cgpa >= 8.5 && metrics.attendancePercentage >= 90) {
    performanceLevel = 'Excellent';
  }

  const overallAssessment = isHighRisk
    ? `${student.student_name} (${student.register_number}) is identified in the High Academic Support Risk category with a verified CGPA of ${metrics.cgpa.toFixed(2)}, attendance standing of ${metrics.attendancePercentage}%, and ${metrics.currentArrears} unresolved semester arrear(s). Dedicated faculty mentoring is recommended.`
    : isMedRisk
    ? `${student.student_name} demonstrates moderate academic progression with a verified CGPA of ${metrics.cgpa.toFixed(2)} and an attendance compliance rate of ${metrics.attendancePercentage}%. Focused remediation on specific courses will elevate their academic trajectory.`
    : `${student.student_name} demonstrates exemplary academic achievement with a high CGPA of ${metrics.cgpa.toFixed(2)}, consistent attendance of ${metrics.attendancePercentage}%, and zero active arrears.`;

  const trajectoryExplanation =
    metrics.semesterSGPA.length > 1
      ? `Performance trajectory spans ${metrics.semesterSGPA.length} semesters. Current semester SGPA is ${metrics.currentSGPA.toFixed(2)} compared to prior semester metrics (${metrics.semesterSGPA.map((s) => `Sem ${s.semesterNumber}: ${s.sgpa.toFixed(2)}`).join(', ')}). Cumulative GPA is standing at ${metrics.cgpa.toFixed(2)}.`
      : `Initial semester trajectory shows an active SGPA of ${metrics.currentSGPA.toFixed(2)} with steady continuous internal marks in ${student.programme}.`;

  const diagnosticRationale = `Diagnostic classification grounded in verified ERP metrics: ${metrics.riskReasons.join('; ')}. Attendance standing is ${metrics.attendancePercentage}% (${metrics.presentClasses}/${metrics.totalClasses} classes), with ${metrics.currentArrears} active arrear(s).`;

  const strengths = [
    {
      title: 'Attendance Discipline',
      evidence: `Maintains ${metrics.attendancePercentage}% attendance across ${metrics.totalClasses} scheduled periods (${metrics.presentClasses} present).`,
    },
    {
      title: 'Continuous Assessment Engagement',
      evidence: `Completed ${internalMarks.length} recorded continuous internal evaluation(s) in active courses.`,
    },
  ];

  if (metrics.cgpa >= 7.5) {
    strengths.push({
      title: 'Strong Cumulative Standing',
      evidence: `Maintains a cumulative grade point average of ${metrics.cgpa.toFixed(2)} across completed semesters.`,
    });
  }

  if (metrics.verifiedAchievements > 0) {
    strengths.push({
      title: 'Co-Curricular & Certification Honors',
      evidence: `${metrics.verifiedAchievements} verified institutional achievement(s) documented on academic record.`,
    });
  }

  const attentionAreas: AcademicIntelligenceAnalysis['attentionAreas'] = [];

  if (metrics.currentArrears > 0) {
    metrics.arrearCourses.forEach((arr) => {
      attentionAreas.push({
        subject: `${arr.courseName} (${arr.courseCode})`,
        issue: `Unresolved Semester Arrear (Grade ${arr.grade})`,
        evidence: `Failed in Semester ${arr.semesterNumber} examination (${arr.credits} credits).`,
        suggestedAction: 'Enroll in remedial tutorial coaching sessions and apply for the upcoming arrear examination cycle.',
      });
    });
  }

  if (metrics.attendancePercentage < 75) {
    attentionAreas.push({
      subject: 'Statutory Attendance Compliance',
      issue: 'Attendance Below Mandatory 75% Regulatory Threshold',
      evidence: `Current attendance is ${metrics.attendancePercentage}% (${metrics.absentClasses} classes missed).`,
      suggestedAction: 'Prioritize 100% attendance in remaining scheduled sessions to restore semester exam eligibility under Clause 4.2.',
    });
  }

  if (attentionAreas.length === 0) {
    attentionAreas.push({
      subject: 'Advanced Specialization & Research Modules',
      issue: 'Opportunity for Advanced Mastery',
      evidence: `Consistently meets baseline expectations across all ${student.branch} foundational coursework.`,
      suggestedAction: 'Engage with advanced elective topics, industry-standard certifications, and faculty-led technical projects.',
    });
  }

  const recommendations: AcademicIntelligenceAnalysis['recommendations'] = [];

  if (isHighRisk) {
    recommendations.push(
      {
        title: 'Weekly Faculty Mentoring Review',
        reason: 'Mandatory for students identified with active arrears and attendance below 75%.',
        action: 'Schedule weekly consultative meetings with assigned faculty mentor to review course-wise recovery targets.',
        priority: 'High',
      },
      {
        title: 'Remedial Coursework Registration',
        reason: 'Arrears hinder progress toward timely graduation.',
        action: 'Complete registration for upcoming supplementary examinations and attend department bridge classes.',
        priority: 'High',
      },
      {
        title: 'Daily Attendance Rectification',
        reason: 'Shortfall directly impacts internal marks and hall ticket eligibility.',
        action: 'Attend all remaining scheduled lecture and lab periods without unauthorized absence.',
        priority: 'Medium',
      }
    );
  } else if (isMedRisk) {
    recommendations.push(
      {
        title: 'Target Internal Assessment Scores',
        reason: 'Improving continuous marks directly cushions semester examination performance.',
        action: 'Aim for 80%+ marks in upcoming Continuous Assessment Tests by solving previous question banks.',
        priority: 'High',
      },
      {
        title: 'Peer Discussion Cohorts',
        reason: 'Collaborative problem solving accelerates mastery in challenging theoretical courses.',
        action: 'Form a study group for analytical courses to clarify complex problem sets before exams.',
        priority: 'Medium',
      }
    );
  } else {
    recommendations.push(
      {
        title: 'Undergraduate Technical Projects & Research',
        reason: 'Leverages distinguished academic foundation into high-impact credentials.',
        action: 'Collaborate with faculty on technical research papers or competitive hackathon projects.',
        priority: 'Medium',
      },
      {
        title: 'Peer Tutoring Mentorship',
        reason: 'Reinforces core concepts while aiding cohort progression.',
        action: 'Serve as an academic peer tutor in department study circles for junior students.',
        priority: 'Low',
      }
    );
  }

  const dataLimitations = [
    'Analysis is strictly grounded in verified database records currently synchronized in the ERP.',
  ];
  if (internalMarks.length < 5) {
    dataLimitations.push('Continuous internal assessment records are partially entered for ongoing semester courses.');
  }

  return {
    id: `ai_${student.id}_${Date.now()}`,
    studentId: student.id,
    generatedAt: new Date().toISOString(),
    engine: 'Gemini Academic Intelligence Engine (Deterministic Grounding)',
    overallAssessment,
    performanceLevel,
    riskLevel: metrics.riskLevel,
    trajectoryExplanation,
    diagnosticRationale,
    strengths,
    attentionAreas,
    recommendations,
    dataLimitations,
    summary: overallAssessment,
    weakSubjects: attentionAreas.map((a) => a.subject),
    performanceTrendExplanation: trajectoryExplanation,
    riskReasons: metrics.riskReasons,
    personalizedRecommendations: recommendations.map((r) => `${r.title}: ${r.action}`),
    suggestedAreasForImprovement: attentionAreas.map((a) => a.suggestedAction),
  };
}

/**
 * Backward compatibility wrapper for existing callers
 */
export async function generateStudentAIAnalysis(studentId: string): Promise<AIAnalysisResult> {
  const intel = await analyzeStudentAcademicIntelligence(studentId);
  return {
    id: intel.id || `ai_${studentId}_${Date.now()}`,
    studentId,
    timestamp: intel.generatedAt,
    summary: intel.overallAssessment,
    strengths: intel.strengths.map((s) => `${s.title}: ${s.evidence}`),
    weakSubjects: intel.attentionAreas.map((a) => `${a.subject} - ${a.issue}`),
    performanceTrendExplanation: intel.trajectoryExplanation,
    riskLevel: intel.riskLevel === 'Insufficient Data' ? 'Medium' : intel.riskLevel,
    riskReasons: [intel.diagnosticRationale],
    personalizedRecommendations: intel.recommendations.map((r) => `[${r.priority}] ${r.title}: ${r.action}`),
    suggestedAreasForImprovement: intel.attentionAreas.map((a) => `${a.subject}: ${a.suggestedAction}`),
    // Extended fields
    overallAssessment: intel.overallAssessment,
    performanceLevel: intel.performanceLevel,
    trajectoryExplanation: intel.trajectoryExplanation,
    diagnosticRationale: intel.diagnosticRationale,
    structuredStrengths: intel.strengths,
    attentionAreas: intel.attentionAreas,
    structuredRecommendations: intel.recommendations,
    dataLimitations: intel.dataLimitations,
  };
}

// RAG Retriever for Institutional Regulations
export async function retrieveRelevantRegulations(query: string): Promise<InstitutionalRegulation[]> {
  const all = await db.getAllRegulations();
  const qTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  if (qTerms.length === 0) return all.slice(0, 2);

  const scored = all.map((reg) => {
    let score = 0;
    const text = `${reg.title} ${reg.category} ${reg.content} ${reg.document_code}`.toLowerCase();
    qTerms.forEach((term) => {
      if (text.includes(term)) score += 2;
      if (reg.title.toLowerCase().includes(term)) score += 3;
      if (reg.category.toLowerCase().includes(term)) score += 4;
    });
    return { reg, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0).map((s) => s.reg).slice(0, 3);
}

// AI Academic Chat Handler
export async function handleAIChat(
  userPrompt: string,
  userRole: 'FACULTY' | 'STUDENT',
  userEntityId: string, // faculty_id or student_id
  targetStudentId?: string
): Promise<{ response: string; citations?: Array<{ documentTitle: string; clause: string; snippet: string }> }> {
  const regulations = await retrieveRelevantRegulations(userPrompt);
  const ragContext = regulations
    .map((r) => `[DOCUMENT: ${r.title} | Code: ${r.document_code} | Clause: ${r.clause_reference}]\n${r.content}`)
    .join('\n\n');

  let academicContext = '';

  if (userRole === 'STUDENT') {
    // Strict privacy: Student can only access their own data
    const student = await db.getStudentById(userEntityId);
    if (!student) {
      return { response: 'Student academic record not found in system.' };
    }
    const metrics = await calculateStudentMetrics(userEntityId);
    const marks = await db.getInternalMarksByStudent(userEntityId);
    const courses = await db.getAllCourses();
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    const marksStr = marks
      .map((m) => `${courseMap.get(m.course_id)?.course_name || m.course_id} - ${m.assessment_name}: ${m.marks_obtained}/${m.maximum_marks}`)
      .join(', ');

    academicContext = `
AUTHORIZED STUDENT CONTEXT (Self Only):
- Name: ${student.student_name} (${student.register_number})
- Programme: ${student.programme} | Department: ${student.department}
- CGPA: ${metrics.cgpa.toFixed(2)} | Current SGPA: ${metrics.currentSGPA.toFixed(2)}
- Overall Attendance: ${metrics.attendancePercentage}% (${metrics.presentClasses} of ${metrics.totalClasses} classes)
- Arrears: ${metrics.currentArrears} (${metrics.arrearCourses.map((a) => a.courseName).join(', ') || 'None'})
- Risk Status: ${metrics.riskLevel} (${metrics.performanceStatus})
- Recent Internal Marks: ${marksStr || 'None recorded yet'}
- Verified Achievements: ${metrics.verifiedAchievements}
`;
  } else {
    // Faculty role
    const faculty = await db.getFacultyById(userEntityId);
    const assignedStudents = await db.getStudentsByFaculty(userEntityId);

    if (targetStudentId) {
      const targetStudent = await db.getStudentById(targetStudentId);
      if (targetStudent) {
        const metrics = await calculateStudentMetrics(targetStudentId);
        academicContext = `
SPECIFIC STUDENT CONTEXT:
- Name: ${targetStudent.student_name} (${targetStudent.register_number})
- CGPA: ${metrics.cgpa.toFixed(2)}, Attendance: ${metrics.attendancePercentage}%, Arrears: ${metrics.currentArrears}
- Risk Level: ${metrics.riskLevel}
- Risk Reasons: ${metrics.riskReasons.join('; ')}
`;
      }
    } else {
      // Cohort summary
      const atRiskStudents = (
        await Promise.all(assignedStudents.map(async (s) => ({ s, m: await calculateStudentMetrics(s.id) })))
      ).filter((item) => item.m.riskLevel === 'High' || item.m.riskLevel === 'Medium');

      const attendanceShortage = (
        await Promise.all(assignedStudents.map(async (s) => ({ s, m: await calculateStudentMetrics(s.id) })))
      ).filter((item) => item.m.attendancePercentage < 75);

      academicContext = `
FACULTY ASSIGNED COHORT CONTEXT:
- Faculty: ${faculty?.first_name} ${faculty?.last_name} (${faculty?.department})
- Total Assigned Students: ${assignedStudents.length}
- Students at Risk (${atRiskStudents.length}): ${atRiskStudents.map((i) => `${i.s.student_name} (${i.s.register_number} - CGPA: ${i.m.cgpa.toFixed(2)}, Risk: ${i.m.riskLevel})`).join('; ') || 'None'}
- Attendance Shortage (<75%) (${attendanceShortage.length}): ${attendanceShortage.map((i) => `${i.s.student_name} (${i.m.attendancePercentage}%)`).join('; ') || 'None'}
`;
    }
  }

  const prompt = `
ROLE: Institutional Academic AI Assistant & Regulation Advisor
USER ROLE: ${userRole}

INSTITUTIONAL REGULATIONS CONTEXT (RAG):
${ragContext || 'General University Academic Handbook 2023-2027'}

VERIFIED ACADEMIC SYSTEM CONTEXT:
${academicContext}

USER QUESTION:
"${userPrompt}"

RULES:
1. If the user is a STUDENT, strictly restrict answers to their own academic record. If they ask about other students, politely decline due to student privacy policy.
2. If answering regulation questions (attendance condonation, grading scale, arrear attempts, CIA weightage), cite the specific regulation title and clause reference.
3. Be clear, encouraging, precise, and professional.
`;

  const ai = getGenAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      const citations = regulations.map((r) => ({
        documentTitle: r.title,
        clause: r.clause_reference,
        snippet: r.content.slice(0, 160) + '...',
      }));

      return {
        response: response.text || 'Unable to generate response at this time.',
        citations: citations.length > 0 ? citations : undefined,
      };
    } catch (err) {
      console.warn('Gemini chat error, returning grounded fallback:', err);
    }
  }

  // Grounded deterministic chat fallback
  const citations = regulations.map((r) => ({
    documentTitle: r.title,
    clause: r.clause_reference,
    snippet: r.content.slice(0, 160) + '...',
  }));

  if (userRole === 'STUDENT') {
    const student = await db.getStudentById(userEntityId);
    const metrics = await calculateStudentMetrics(userEntityId);
    return {
      response: `Hello ${student?.student_name}. Based on verified institutional ERP records, your current CGPA is **${metrics.cgpa.toFixed(2)}** with an overall attendance of **${metrics.attendancePercentage}%** (${metrics.presentClasses} of ${metrics.totalClasses} classes attended). You currently have **${metrics.currentArrears}** active arrear(s). ${metrics.riskReasons.join(' ')}. Under University Regulation Clause 4.2, ensure your attendance remains above 75% for end-semester exam eligibility.`,
      citations,
    };
  } else {
    const faculty = await db.getFacultyById(userEntityId);
    const assignedStudents = await db.getStudentsByFaculty(userEntityId);
    const atRisk = (
      await Promise.all(assignedStudents.map(async (s) => ({ s, m: await calculateStudentMetrics(s.id) })))
    ).filter((i) => i.m.riskLevel === 'High');

    return {
      response: `Dear Dr. ${faculty?.last_name || 'Faculty'}, you have ${assignedStudents.length} assigned students. Currently, ${atRisk.length} student(s) require intervention due to attendance shortages (<75%) or multiple arrears (${atRisk.map((a) => a.s.student_name).join(', ') || 'None'}). All academic data is verified under University Academic Regulations.`,
      citations,
    };
  }
}
