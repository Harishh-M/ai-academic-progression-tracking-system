import { Router } from 'express';
import { db } from '../db/database.js';
import { pool } from '../db/mysql.js';
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
    let facultyId = req.user?.facultyId;
    let faculty = facultyId ? await db.getFacultyById(facultyId) : null;
    if (!faculty && req.user?.id) {
      faculty = (await db.getFacultyByUserId(req.user.id)) || (await db.getFacultyById(req.user.id));
      if (faculty) facultyId = String(faculty.id);
    }

    let assignedStudents = facultyId ? await db.getStudentsByFaculty(facultyId) : [];
    if (assignedStudents.length === 0 && faculty?.department) {
      const all = await db.getAllStudents();
      assignedStudents = all.filter((s) => s.department === faculty.department);
    }
    if (assignedStudents.length === 0) {
      assignedStudents = await db.getAllStudents();
    }

    const [attRows]: any = await pool.query(
      "SELECT student_id, COUNT(*) as total, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present FROM attendance GROUP BY student_id"
    );
    const [resRows]: any = await pool.query(
      "SELECT student_id, SUM(credits * grade_point) as weighted_points, SUM(credits) as total_credits, SUM(CASE WHEN result_status = 'Fail' THEN 1 ELSE 0 END) as arrears FROM semester_results GROUP BY student_id"
    );

    const attMap = new Map<string, any>();
    for (const r of attRows) {
      if (r.student_id !== undefined && r.student_id !== null) {
        attMap.set(String(r.student_id), r);
      }
    }
    const resMap = new Map<string, any>();
    for (const r of resRows) {
      if (r.student_id !== undefined && r.student_id !== null) {
        resMap.set(String(r.student_id), r);
      }
    }

    const studentSummaries = assignedStudents.map((s) => {
      const sId = String(s.id);
      const regNo = s.register_number ? String(s.register_number) : '';
      const att = attMap.get(sId) || (regNo ? attMap.get(regNo) : null);
      const res = resMap.get(sId) || (regNo ? resMap.get(regNo) : null);

      const totalClasses = att ? Number(att.total) : 0;
      const presentClasses = att ? Number(att.present) : 0;
      const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 1000) / 10 : 0;

      const weightedPoints = res ? Number(res.weighted_points) : 0;
      const totalCredits = res ? Number(res.total_credits) : 0;
      const cgpa = totalCredits > 0 ? Math.round((weightedPoints / totalCredits) * 100) / 100 : 0;
      const currentArrears = res ? Number(res.arrears) : 0;

      let riskLevel = 'Low';
      if (attendancePercentage < 75 || currentArrears >= 2 || (cgpa > 0 && cgpa < 5.0)) riskLevel = 'High';
      else if (attendancePercentage < 80 || currentArrears === 1 || (cgpa > 0 && cgpa < 6.5)) riskLevel = 'Medium';

      let performanceStatus = 'Average';
      if (cgpa >= 8.5) performanceStatus = 'Excellent';
      else if (cgpa >= 7.0) performanceStatus = 'Good';
      else if (cgpa >= 6.0) performanceStatus = 'Average';
      else performanceStatus = 'Needs Improvement';

      return {
        id: s.id,
        regNo: s.register_number,
        name: s.student_name,
        programme: s.programme,
        batch: s.batch,
        cgpa,
        currentSGPA: cgpa,
        attendancePercentage,
        currentArrears,
        riskLevel,
        performanceStatus,
      };
    });

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
