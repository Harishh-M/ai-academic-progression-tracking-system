import {
  CalculatedAcademicMetrics,
  PerformanceStatus,
  RiskLevel,
  Student,
} from '../../src/types/index.js';
import { db } from '../db/database.js';

export async function calculateStudentMetrics(studentId: string): Promise<CalculatedAcademicMetrics> {
  const student = await db.getStudentById(studentId);
  const attendanceRecords = await db.getAttendanceByStudent(studentId);
  const semesterResults = await db.getSemesterResultsByStudent(studentId);
  const achievements = await db.getAchievementsByStudent(studentId);
  const courses = await db.getAllCourses();
  const semesters = await db.getAllSemesters();

  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const semesterMap = new Map(semesters.map((s) => [s.id, s]));

  // 1. Attendance Calculation
  const totalClasses = attendanceRecords.length;
  const presentClasses = attendanceRecords.filter((a) => a.status === 'Present').length;
  const absentClasses = totalClasses - presentClasses;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 1000) / 10 : 0;

  // Course-wise attendance
  const courseAttGroups: Record<string, { total: number; present: number; absent: number }> = {};
  attendanceRecords.forEach((a) => {
    if (!courseAttGroups[a.course_id]) {
      courseAttGroups[a.course_id] = { total: 0, present: 0, absent: 0 };
    }
    courseAttGroups[a.course_id].total++;
    if (a.status === 'Present') courseAttGroups[a.course_id].present++;
    else courseAttGroups[a.course_id].absent++;
  });

  const courseWiseAttendance = Object.entries(courseAttGroups).map(([courseId, stats]) => {
    const c = courseMap.get(courseId);
    const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 1000) / 10 : 0;
    return {
      courseId,
      courseCode: c ? c.course_code : courseId,
      courseName: c ? c.course_name : 'Unknown Course',
      total: stats.total,
      present: stats.present,
      absent: stats.absent,
      percentage,
    };
  });

  // 2. SGPA & Semester Calculation
  const semResultsGroup: Record<string, typeof semesterResults> = {};
  semesterResults.forEach((sr) => {
    if (!semResultsGroup[sr.semester_id]) {
      semResultsGroup[sr.semester_id] = [];
    }
    semResultsGroup[sr.semester_id].push(sr);
  });

  // Sort semesters by semester_number
  const sortedSemIds = Object.keys(semResultsGroup).sort((a, b) => {
    const semA = semesterMap.get(a)?.semester_number || 0;
    const semB = semesterMap.get(b)?.semester_number || 0;
    return semA - semB;
  });

  let runningTotalWeightedPoints = 0;
  let runningTotalCredits = 0;
  const semesterSGPA: CalculatedAcademicMetrics['semesterSGPA'] = [];
  const cgpaTrend: CalculatedAcademicMetrics['cgpaTrend'] = [];

  sortedSemIds.forEach((semId) => {
    const list = semResultsGroup[semId];
    const semObj = semesterMap.get(semId);
    let semCredits = 0;
    let semWeightedPoints = 0;
    let earnedCredits = 0;
    let passedCourses = 0;
    let failedCourses = 0;

    list.forEach((res) => {
      semCredits += res.credits;
      semWeightedPoints += res.credits * res.grade_point;
      if (res.result_status === 'Pass') {
        earnedCredits += res.credits;
        passedCourses++;
      } else {
        failedCourses++;
      }
    });

    const sgpa = semCredits > 0 ? Math.round((semWeightedPoints / semCredits) * 100) / 100 : 0;

    runningTotalWeightedPoints += semWeightedPoints;
    runningTotalCredits += semCredits;
    const runningCgpa = runningTotalCredits > 0 ? Math.round((runningTotalWeightedPoints / runningTotalCredits) * 100) / 100 : 0;

    const semNumber = semObj?.semester_number || 0;
    semesterSGPA.push({
      semesterNumber: semNumber,
      semesterId: semId,
      academicYear: semObj?.academic_year || '2024-2025',
      sgpa,
      totalCredits: semCredits,
      earnedCredits,
      passedCourses,
      failedCourses,
    });

    cgpaTrend.push({
      semester: `Sem ${semNumber}`,
      sgpa,
      cgpa: runningCgpa,
    });
  });

  const cgpa = runningTotalCredits > 0 ? Math.round((runningTotalWeightedPoints / runningTotalCredits) * 100) / 100 : 0;
  const currentSGPA = semesterSGPA.length > 0 ? semesterSGPA[semesterSGPA.length - 1].sgpa : 0;

  // 3. Arrear Calculation
  // Track failed courses
  const arrearCoursesList: CalculatedAcademicMetrics['arrearCourses'] = [];
  let totalArrearsCount = 0;
  let clearedArrearsCount = 0;

  // Find all fail records
  const failedResults = semesterResults.filter((sr) => sr.result_status === 'Fail');
  totalArrearsCount = failedResults.length;

  failedResults.forEach((fr) => {
    // Check if passed in a later semester attempt for the same course
    const laterPass = semesterResults.some(
      (sr) =>
        sr.course_id === fr.course_id &&
        sr.result_status === 'Pass' &&
        new Date(sr.published_date).getTime() > new Date(fr.published_date).getTime()
    );

    if (laterPass) {
      clearedArrearsCount++;
    } else {
      const c = courseMap.get(fr.course_id);
      const semObj = semesterMap.get(fr.semester_id);
      arrearCoursesList.push({
        courseId: fr.course_id,
        courseCode: c ? c.course_code : fr.course_id,
        courseName: c ? c.course_name : 'Unknown Course',
        semesterNumber: semObj?.semester_number || 0,
        grade: fr.grade,
        credits: fr.credits,
      });
    }
  });

  const currentArrears = arrearCoursesList.length;

  // 4. Transparent Rule-based Risk Engine (Section 21 & 24)
  const riskReasons: string[] = [];
  let riskLevel: RiskLevel = 'Low';

  // Check severe conditions
  const isCgpaLow = cgpa > 0 && cgpa < 6.0;
  const isAttendanceLow = attendancePercentage > 0 && attendancePercentage < 75;
  const hasMultipleArrears = currentArrears >= 2;

  // Check declining trend
  let isDeclining = false;
  if (semesterSGPA.length >= 2) {
    const last = semesterSGPA[semesterSGPA.length - 1].sgpa;
    const prev = semesterSGPA[semesterSGPA.length - 2].sgpa;
    if (prev - last >= 1.2) {
      isDeclining = true;
    }
  }

  if (isCgpaLow || isAttendanceLow || hasMultipleArrears || (isDeclining && currentArrears > 0)) {
    riskLevel = 'High';
    if (isCgpaLow) riskReasons.push(`Cumulative GPA (${cgpa.toFixed(2)}) is critically below the 6.0 benchmark.`);
    if (isAttendanceLow) riskReasons.push(`Overall Attendance (${attendancePercentage}%) is below statutory 75% threshold.`);
    if (hasMultipleArrears) riskReasons.push(`Student has ${currentArrears} unresolved semester arrears.`);
    if (isDeclining) riskReasons.push(`Recent semester SGPA exhibited a steep decline (> 1.2 points).`);
  } else if (
    (cgpa >= 6.0 && cgpa < 7.5) ||
    (attendancePercentage >= 75 && attendancePercentage < 85) ||
    currentArrears === 1 ||
    isDeclining
  ) {
    riskLevel = 'Medium';
    if (cgpa >= 6.0 && cgpa < 7.5) riskReasons.push(`CGPA (${cgpa.toFixed(2)}) is in moderate academic tier.`);
    if (attendancePercentage >= 75 && attendancePercentage < 85) riskReasons.push(`Attendance (${attendancePercentage}%) is close to the minimum 75% margin.`);
    if (currentArrears === 1) riskReasons.push(`Active single arrear in ${arrearCoursesList[0]?.courseName || 'a core subject'}.`);
    if (isDeclining) riskReasons.push(`Semester SGPA shows moderate downward trajectory.`);
  } else {
    riskLevel = 'Low';
    riskReasons.push(`Strong academic standing with CGPA ${cgpa.toFixed(2)}, healthy attendance (${attendancePercentage}%), and zero active arrears.`);
  }

  // 5. Overall Performance Status
  let performanceStatus: PerformanceStatus = 'Good';
  if (riskLevel === 'High') {
    performanceStatus = 'At Risk';
  } else if (riskLevel === 'Medium') {
    performanceStatus = currentArrears > 0 || isAttendanceLow ? 'Needs Improvement' : 'Average';
  } else if (cgpa >= 8.5 && attendancePercentage >= 90) {
    performanceStatus = 'Excellent';
  } else if (cgpa >= 7.5) {
    performanceStatus = 'Good';
  } else {
    performanceStatus = 'Average';
  }

  // Achievements stats
  const totalAchievements = achievements.length;
  const verifiedAchievements = achievements.filter((a) => a.verification_status === 'Verified').length;

  // Degree Progression & Credit Audit
  const totalEarnedCredits = semesterSGPA.reduce((acc, s) => acc + s.earnedCredits, 0);
  const totalRegisteredCredits = semesterSGPA.reduce((acc, s) => acc + s.totalCredits, 0);
  const degreeRequiredCredits = 165;
  const degreeProgressPercentage = Math.min(100, Math.round((totalEarnedCredits / degreeRequiredCredits) * 100));

  let projectedClassification = 'First Class';
  const honoursEligibility = cgpa >= 8.5 && totalArrearsCount === 0;
  if (cgpa >= 8.5) {
    projectedClassification = honoursEligibility ? 'First Class with Distinction (Honours)' : 'First Class with Distinction';
  } else if (cgpa >= 6.5) {
    projectedClassification = 'First Class';
  } else {
    projectedClassification = 'Second Class';
  }

  return {
    totalClasses,
    presentClasses,
    absentClasses,
    attendancePercentage,
    courseWiseAttendance,
    semesterSGPA,
    currentSGPA,
    cgpa,
    cgpaTrend,
    totalArrears: totalArrearsCount,
    currentArrears,
    clearedArrears: clearedArrearsCount,
    arrearCourses: arrearCoursesList,
    performanceStatus,
    riskLevel,
    riskReasons,
    totalAchievements,
    verifiedAchievements,
    totalEarnedCredits,
    totalRegisteredCredits,
    degreeRequiredCredits,
    degreeProgressPercentage,
    projectedClassification,
    honoursEligibility,
  };
}
