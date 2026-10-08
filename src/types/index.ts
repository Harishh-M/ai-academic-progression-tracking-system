export type UserRole = 'STUDENT' | 'FACULTY' | 'COE' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface Faculty {
  id: string;
  user_id: string;
  faculty_code: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  department: string;
  designation: string;
  qualification: string;
  specialization: string;
  institution: string;
  university: string;
  date_of_joining: string;
  date_of_birth: string;
  address: string;
  working_status: 'Active' | 'On Leave' | 'Relieved';
  created_at: string;
  updated_at: string;
}

export type StudentCurrentStatus =
  | 'Continuing'
  | 'Completed'
  | 'Shortage of Attendance'
  | 'Long Absent'
  | 'Discontinued'
  | 'Debarred'
  | 'Diseased';

export type ProgrammeStatus =
  | 'Degree Awarded'
  | 'Programme Completed'
  | 'Active'
  | 'Programme Not Completed';

export type FeesStatus = 'Paid' | 'Pending' | 'Not Paid';
export type ReadmittedCategory = 'Yes' | 'No';

export interface Student {
  id: string;
  user_id: string;
  register_number: string;
  admission_number: string;
  student_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  abc_id: string;
  umis_number: string;
  email: string;
  mobile_number: string;
  admission_type: 'Regular' | 'Lateral Entry' | 'Transfer' | 'Management';
  programme: string;
  programme_short_name: string;
  branch: string;
  branch_code: string;
  department: string;
  batch: string; // e.g. "2023-2027"
  year_of_admission: number;
  current_status: StudentCurrentStatus;
  programme_status: ProgrammeStatus;
  degree_awarded_month_year?: string;
  student_fees_status: FeesStatus;
  readmitted_category: ReadmittedCategory;
  readmitted_year?: number;
  readmitted_batch?: string;
  address: string;
  assigned_faculty_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  course_code: string;
  course_name: string;
  department: string;
  programme: string;
  semester_number: number;
  credits: number;
  course_type: 'Core' | 'Elective' | 'Laboratory' | 'Project';
}

export interface Semester {
  id: string;
  semester_number: number;
  academic_year: string; // e.g. "2024-2025"
  semester_type: 'Odd' | 'Even';
  start_date: string;
  end_date: string;
}

export interface FacultyCourseMapping {
  id: string;
  faculty_id: string;
  course_id: string;
  semester_id: string;
  academic_year: string;
}

export interface StudentCourseMapping {
  id: string;
  student_id: string;
  course_id: string;
  semester_id: string;
  academic_year: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  date: string;
  status: 'Present' | 'Absent';
  marked_by: string; // faculty_id
  created_at: string;
  updated_at: string;
}

export interface InternalMarkRecord {
  id: string;
  student_id: string;
  course_id: string;
  assessment_name: string;
  assessment_type: 'Internal Test' | 'Assignment' | 'Practical' | 'Quiz' | 'Other';
  marks_obtained: number;
  maximum_marks: number;
  entered_by: string; // faculty_id
  created_at: string;
  updated_at: string;
}

export type GradeType = 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'U';

export interface SemesterResultRecord {
  id: string;
  student_id: string;
  semester_id: string;
  course_id: string;
  grade: GradeType;
  grade_point: number;
  credits: number;
  result_status: 'Pass' | 'Fail';
  academic_year: string;
  published_date: string;
}

export type AchievementCategory =
  | 'Academic'
  | 'Technical'
  | 'Sports'
  | 'Cultural'
  | 'Research'
  | 'Hackathon'
  | 'Certification'
  | 'Leadership'
  | 'Other';

export interface AchievementRecord {
  id: string;
  student_id: string;
  title: string;
  category: AchievementCategory;
  description: string;
  achievement_date: string;
  organization: string;
  certificate_file?: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected';
  verified_by?: string; // faculty_id
  created_at: string;
  updated_at: string;
}

export interface AuditLogRecord {
  id: string;
  user_id: string;
  role: UserRole;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
  ip_address: string;
}

export interface InstitutionalRegulation {
  id: string;
  category: 'Attendance' | 'Grading' | 'Examinations' | 'Arrears' | 'Code of Conduct';
  title: string;
  document_code: string;
  content: string;
  clause_reference: string;
  effective_year: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';
export type PerformanceStatus = 'Excellent' | 'Good' | 'Average' | 'Needs Improvement' | 'At Risk';

export interface CalculatedAcademicMetrics {
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  attendancePercentage: number;
  courseWiseAttendance: Array<{
    courseId: string;
    courseCode: string;
    courseName: string;
    total: number;
    present: number;
    absent: number;
    percentage: number;
  }>;
  semesterSGPA: Array<{
    semesterNumber: number;
    semesterId: string;
    academicYear: string;
    sgpa: number;
    totalCredits: number;
    earnedCredits: number;
    passedCourses: number;
    failedCourses: number;
  }>;
  currentSGPA: number;
  cgpa: number;
  cgpaTrend: Array<{
    semester: string;
    sgpa: number;
    cgpa: number;
  }>;
  totalArrears: number;
  currentArrears: number;
  clearedArrears: number;
  arrearCourses: Array<{
    courseId: string;
    courseCode: string;
    courseName: string;
    semesterNumber: number;
    grade: string;
    credits: number;
  }>;
  performanceStatus: PerformanceStatus;
  riskLevel: RiskLevel;
  riskReasons: string[];
  totalAchievements: number;
  verifiedAchievements: number;
}

export interface AIAnalysisResult {
  id: string;
  studentId: string;
  timestamp: string;
  summary: string;
  strengths: string[];
  weakSubjects: string[];
  performanceTrendExplanation: string;
  riskLevel: RiskLevel;
  riskReasons: string[];
  personalizedRecommendations: string[];
  suggestedAreasForImprovement: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Array<{
    documentTitle: string;
    clause: string;
    snippet: string;
  }>;
}
