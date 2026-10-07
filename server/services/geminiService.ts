import { GoogleGenAI, Type } from '@google/genai';
import { AIAnalysisResult, ChatMessage, InstitutionalRegulation, Student } from '../../src/types/index.js';
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

export async function generateStudentAIAnalysis(studentId: string): Promise<AIAnalysisResult> {
  const student = db.getStudentById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  const metrics = calculateStudentMetrics(studentId);
  const internalMarks = db.getInternalMarksByStudent(studentId);
  const courses = db.getAllCourses();
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // Build verified academic context string
  const marksSummary = internalMarks
    .map((im) => {
      const c = courseMap.get(im.course_id);
      return `${c?.course_name || im.course_id} (${im.assessment_name}): ${im.marks_obtained}/${im.maximum_marks}`;
    })
    .slice(0, 10)
    .join(', ');

  const semesterSummary = metrics.semesterSGPA
    .map((s) => `Semester ${s.semesterNumber}: SGPA ${s.sgpa.toFixed(2)} (${s.passedCourses} passed, ${s.failedCourses} failed)`)
    .join('; ');

  const arrearSummary =
    metrics.currentArrears > 0
      ? metrics.arrearCourses.map((a) => `${a.courseName} (${a.courseCode}) - Grade ${a.grade}`).join(', ')
      : 'None (Zero active arrears)';

  const promptContext = `
STUDENT VERIFIED ACADEMIC DOSSIER:
- Name: ${student.student_name}
- Register Number: ${student.register_number}
- Programme: ${student.programme} (${student.branch})
- Current Status: ${student.current_status}
- Academic Metrics:
  * Cumulative GPA (CGPA): ${metrics.cgpa.toFixed(2)}
  * Current Semester SGPA: ${metrics.currentSGPA.toFixed(2)}
  * Overall Attendance: ${metrics.attendancePercentage}% (${metrics.presentClasses}/${metrics.totalClasses} classes)
  * Active Arrears: ${metrics.currentArrears} [${arrearSummary}]
  * Cleared Arrears: ${metrics.clearedArrears}
  * Calculated Risk Classification: ${metrics.riskLevel}
  * Risk Trigger Reasons: ${metrics.riskReasons.join(' | ')}
  * Semester Progression: ${semesterSummary || 'First Semester'}
  * Sample Internal Assessment Scores: ${marksSummary || 'Pending entry'}
  * Total Verified Achievements: ${metrics.verifiedAchievements}

INSTRUCTIONS:
You are the institutional Academic Intelligence Advisor. You analyze verified academic facts from the ERP to provide diagnostic feedback.
Generate a structured JSON analysis strictly matching the requested format:
1. summary: A concise, professional 2-3 sentence academic appraisal.
2. strengths: An array of 3-4 specific academic and co-curricular strengths evident from data.
3. weakSubjects: An array of 2-3 courses or subject areas requiring immediate attention or remediation.
4. performanceTrendExplanation: An objective explanation of their SGPA/CGPA and attendance trajectory over time.
5. personalizedRecommendations: An array of 3-4 actionable, pragmatic study and attendance recommendations.
6. suggestedAreasForImprovement: An array of 2-3 focused actionable skill/conceptual growth areas.
`;

  const ai = getGenAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: promptContext,
        config: {
          systemInstruction: 'You are an institutional academic advisor system. You only interpret verified data. Never invent facts. Return valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weakSubjects: { type: Type.ARRAY, items: { type: Type.STRING } },
              performanceTrendExplanation: { type: Type.STRING },
              personalizedRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedAreasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'summary',
              'strengths',
              'weakSubjects',
              'performanceTrendExplanation',
              'personalizedRecommendations',
              'suggestedAreasForImprovement',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const result: AIAnalysisResult = {
        id: `ai_${studentId}_${Date.now()}`,
        studentId,
        timestamp: new Date().toISOString(),
        summary: parsed.summary || `${student.student_name} maintains a CGPA of ${metrics.cgpa.toFixed(2)} with ${metrics.attendancePercentage}% attendance.`,
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : [`Consistent participation with ${metrics.attendancePercentage}% attendance`],
        weakSubjects: Array.isArray(parsed.weakSubjects) && parsed.weakSubjects.length > 0 ? parsed.weakSubjects : (metrics.currentArrears > 0 ? metrics.arrearCourses.map((a) => a.courseName) : ['Core Problem Solving & Advanced Algorithms']),
        performanceTrendExplanation: parsed.performanceTrendExplanation || `Student demonstrates steady academic momentum with current SGPA of ${metrics.currentSGPA.toFixed(2)}.`,
        riskLevel: metrics.riskLevel,
        riskReasons: metrics.riskReasons,
        personalizedRecommendations: Array.isArray(parsed.personalizedRecommendations) && parsed.personalizedRecommendations.length > 0
          ? parsed.personalizedRecommendations
          : ['Maintain consistent lecture attendance above 85%', 'Engage in peer discussion groups for algorithmic concepts'],
        suggestedAreasForImprovement: Array.isArray(parsed.suggestedAreasForImprovement) && parsed.suggestedAreasForImprovement.length > 0
          ? parsed.suggestedAreasForImprovement
          : ['Time management during internal assessments', 'Regular revision of theoretical proof techniques'],
      };

      db.saveAIAnalysis(result);
      return result;
    } catch (err) {
      console.warn('Gemini API call encountered error, using deterministic rule-based analysis fallback:', err);
    }
  }

  // Fallback deterministic analysis
  const fallbackResult = generateDeterministicAIAnalysis(student, metrics);
  db.saveAIAnalysis(fallbackResult);
  return fallbackResult;
}

function generateDeterministicAIAnalysis(student: Student, metrics: ReturnType<typeof calculateStudentMetrics>): AIAnalysisResult {
  const isHigh = metrics.riskLevel === 'High';
  const isMed = metrics.riskLevel === 'Medium';

  let summary = '';
  let strengths: string[] = [];
  let weakSubjects: string[] = [];
  let trend = '';
  let recommendations: string[] = [];
  let improvements: string[] = [];

  if (isHigh) {
    summary = `${student.student_name} is currently identified in the High Academic Risk category with a CGPA of ${metrics.cgpa.toFixed(2)}, attendance at ${metrics.attendancePercentage}%, and ${metrics.currentArrears} unresolved arrear(s). Immediate institutional mentoring is advised.`;
    strengths = ['Enrolled in regular continuous internal assessments', 'Accessible faculty advisory support available'];
    weakSubjects = metrics.arrearCourses.length > 0 ? metrics.arrearCourses.map((a) => `${a.courseName} (${a.courseCode})`) : ['Operating Systems', 'Data Structures and Algorithms'];
    trend = 'Historical data reveals a downward trend in semester grade points combined with attendance deficit below the 75% statutory threshold.';
    recommendations = [
      'Attend mandatory remedial bridge sessions for failed subjects.',
      'Prioritize daily lecture attendance to elevate overall percentage above 75%.',
      'Meet with your assigned faculty mentor weekly for progress validation.',
      'Register for upcoming supplementary arrear examinations in the next cycle.',
    ];
    improvements = ['Core problem-solving foundation in prerequisite math', 'Exam question pattern practice with past 5-year papers'];
  } else if (isMed) {
    summary = `${student.student_name} demonstrates moderate academic performance with a CGPA of ${metrics.cgpa.toFixed(2)} and attendance of ${metrics.attendancePercentage}%. Focused attention on specific core courses will unlock higher tier grades.`;
    strengths = [
      `Satisfactory attendance compliance (${metrics.attendancePercentage}%)`,
      'Active submission of internal assignments and practical coursework',
      metrics.verifiedAchievements > 0 ? `${metrics.verifiedAchievements} verified co-curricular achievements` : 'Balanced course participation',
    ];
    weakSubjects = metrics.arrearCourses.length > 0 ? metrics.arrearCourses.map((a) => a.courseName) : ['Theory of Computation', 'Discrete Mathematics'];
    trend = 'Semester results reflect stable performance within the 6.5 - 7.5 SGPA bracket, with minor fluctuations across theoretical courses.';
    recommendations = [
      'Target scoring above 80% in remaining internal assessment tests.',
      'Form structured peer study cohorts for difficult analytical modules.',
      'Consult course faculty during office hours for complex topic clarification.',
    ];
    improvements = ['Speed and precision in numerical problem sets', 'Structured note-taking and concept mapping'];
  } else {
    summary = `${student.student_name} exhibits exemplary academic performance, achieving a high CGPA of ${metrics.cgpa.toFixed(2)} alongside an outstanding attendance record of ${metrics.attendancePercentage}% and zero arrears.`;
    strengths = [
      `Distinguished academic standing (CGPA ${metrics.cgpa.toFixed(2)})`,
      `Outstanding attendance dedication (${metrics.attendancePercentage}%)`,
      'Consistent top-bracket performance across all core and elective courses',
      metrics.verifiedAchievements > 0 ? `${metrics.verifiedAchievements} verified competitive achievements & certifications` : 'Active technical engagement',
    ];
    weakSubjects = ['Advanced Distributed Systems Optimization', 'Research Paper Publication'];
    trend = 'Consistently high upward trajectory with consecutive semester SGPAs exceeding 8.5 points.';
    recommendations = [
      'Explore undergraduate research publications and conference presentations.',
      'Pursue advanced industry certifications and lead competitive hackathons.',
      'Serve as an academic peer tutor to reinforce advanced conceptual mastery.',
    ];
    improvements = ['Applied research methodology', 'Leadership in interdisciplinary engineering projects'];
  }

  return {
    id: `ai_${student.id}_fallback`,
    studentId: student.id,
    timestamp: new Date().toISOString(),
    summary,
    strengths,
    weakSubjects,
    performanceTrendExplanation: trend,
    riskLevel: metrics.riskLevel,
    riskReasons: metrics.riskReasons,
    personalizedRecommendations: recommendations,
    suggestedAreasForImprovement: improvements,
  };
}

// RAG Retriever for Institutional Regulations
export function retrieveRelevantRegulations(query: string): InstitutionalRegulation[] {
  const all = db.getAllRegulations();
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
  const regulations = retrieveRelevantRegulations(userPrompt);
  const ragContext = regulations
    .map((r) => `[DOCUMENT: ${r.title} | Code: ${r.document_code} | Clause: ${r.clause_reference}]\n${r.content}`)
    .join('\n\n');

  let academicContext = '';

  if (userRole === 'STUDENT') {
    // Strict privacy: Student can only access their own data
    const student = db.getStudentById(userEntityId);
    if (!student) {
      return { response: 'Student academic record not found in system.' };
    }
    const metrics = calculateStudentMetrics(userEntityId);
    const marks = db.getInternalMarksByStudent(userEntityId);
    const courses = db.getAllCourses();
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
    const faculty = db.getFacultyById(userEntityId);
    const assignedStudents = db.getStudentsByFaculty(userEntityId);

    if (targetStudentId) {
      const targetStudent = db.getStudentById(targetStudentId);
      if (targetStudent) {
        const metrics = calculateStudentMetrics(targetStudentId);
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
      const atRiskStudents = assignedStudents
        .map((s) => ({ s, m: calculateStudentMetrics(s.id) }))
        .filter((item) => item.m.riskLevel === 'High' || item.m.riskLevel === 'Medium');

      const attendanceShortage = assignedStudents
        .map((s) => ({ s, m: calculateStudentMetrics(s.id) }))
        .filter((item) => item.m.attendancePercentage < 75);

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
    const student = db.getStudentById(userEntityId);
    const metrics = calculateStudentMetrics(userEntityId);
    return {
      response: `Hello ${student?.student_name}. Based on verified institutional ERP records, your current CGPA is **${metrics.cgpa.toFixed(2)}** with an overall attendance of **${metrics.attendancePercentage}%** (${metrics.presentClasses} of ${metrics.totalClasses} classes attended). You currently have **${metrics.currentArrears}** active arrear(s). ${metrics.riskReasons.join(' ')}. Under University Regulation Clause 4.2, ensure your attendance remains above 75% for end-semester exam eligibility.`,
      citations,
    };
  } else {
    const faculty = db.getFacultyById(userEntityId);
    const assignedStudents = db.getStudentsByFaculty(userEntityId);
    const atRisk = assignedStudents
      .map((s) => ({ s, m: calculateStudentMetrics(s.id) }))
      .filter((i) => i.m.riskLevel === 'High');

    return {
      response: `Dear Dr. ${faculty?.last_name || 'Faculty'}, you have ${assignedStudents.length} assigned students. Currently, ${atRisk.length} student(s) require intervention due to attendance shortages (<75%) or multiple arrears (${atRisk.map((a) => a.s.student_name).join(', ') || 'None'}). All academic data is verified under University Academic Regulations.`,
      citations,
    };
  }
}
