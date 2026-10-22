import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireFaculty, requireStudentSelfOrFaculty } from '../middleware/auth.js';
import { calculateStudentMetrics } from '../services/academicCalculator.js';

export const reportRouter = Router();

// GET /api/reports/student/:studentId - Comprehensive official academic report
reportRouter.get('/student/:studentId', requireAuth, requireStudentSelfOrFaculty, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const student = await db.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const metrics = await calculateStudentMetrics(studentId);
    const attendance = await db.getAttendanceByStudent(studentId);
    const internalMarks = await db.getInternalMarksByStudent(studentId);
    const semesterResults = await db.getSemesterResultsByStudent(studentId);
    const achievements = await db.getAchievementsByStudent(studentId);
    const aiAnalysis = await db.getAIAnalysis(studentId);
    const courses = await db.getAllCourses();
    const allSemesters = await db.getAllSemesters();
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    res.json({
      generatedAt: new Date().toISOString(),
      institution: 'University College of Engineering',
      university: 'State Technological University',
      reportTitle: 'Official Student Academic Progress & Achievement Transcript',
      student,
      metrics,
      semesters: allSemesters,
      currentSemesterNumber: 4,
      courseWiseAttendance: metrics.courseWiseAttendance,
      internalMarks: internalMarks.map((im) => ({
        ...im,
        courseCode: courseMap.get(im.course_id)?.course_code || im.course_id,
        courseName: courseMap.get(im.course_id)?.course_name || 'Course',
      })),
      semesterResults: semesterResults.map((sr) => ({
        ...sr,
        courseCode: courseMap.get(sr.course_id)?.course_code || sr.course_id,
        courseName: courseMap.get(sr.course_id)?.course_name || 'Course',
      })),
      achievements,
      aiAnalysis,
    });
  } catch (err: any) {
    console.error('Generate student report error:', err);
    res.status(500).json({ error: 'Failed to generate student report' });
  }
});

// GET /api/reports/faculty - Faculty cohort analysis report
reportRouter.get('/faculty', requireAuth, requireFaculty, async (req, res) => {
  try {
    const facultyId = req.user!.facultyId!;
    const faculty = await db.getFacultyById(facultyId);
    const assignedStudents = await db.getStudentsByFaculty(facultyId);

    const studentSummaries = await Promise.all(
      assignedStudents.map(async (s) => {
        const m = await calculateStudentMetrics(s.id);
        return {
          id: s.id,
          regNo: s.register_number,
          name: s.student_name,
          programme: s.programme,
          batch: s.batch,
          cgpa: m.cgpa,
          currentSGPA: m.currentSGPA,
          attendancePercentage: m.attendancePercentage,
          currentArrears: m.currentArrears,
          riskLevel: m.riskLevel,
          performanceStatus: m.performanceStatus,
        };
      })
    );

    const total = studentSummaries.length;
    const avgCgpa = total > 0 ? Math.round((studentSummaries.reduce((acc, s) => acc + s.cgpa, 0) / total) * 100) / 100 : 0;
    const avgAtt = total > 0 ? Math.round((studentSummaries.reduce((acc, s) => acc + s.attendancePercentage, 0) / total) * 10) / 10 : 0;
    const atRiskCount = studentSummaries.filter((s) => s.riskLevel === 'High').length;
    const attendanceShortageCount = studentSummaries.filter((s) => s.attendancePercentage < 75).length;
    const arrearStudentsCount = studentSummaries.filter((s) => s.currentArrears > 0).length;

    res.json({
      generatedAt: new Date().toISOString(),
      faculty,
      cohortMetrics: {
        totalAssignedStudents: total,
        averageCGPA: avgCgpa,
        averageAttendance: avgAtt,
        atRiskCount,
        attendanceShortageCount,
        arrearStudentsCount,
      },
      students: studentSummaries,
    });
  } catch (err: any) {
    console.error('Generate faculty cohort report error:', err);
    res.status(500).json({ error: 'Failed to generate faculty cohort report' });
  }
});
