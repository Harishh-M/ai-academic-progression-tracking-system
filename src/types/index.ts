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

export interface DailyAttendanceSession {
  id: string;
  type: 'biometric_in' | 'period' | 'biometric_out';
  periodNumber?: number; // 1 to 7
  timing: string; // e.g. "08:45 am to 09:35 am"
  slot: 'Biometric Morning' | 'Forenoon' | 'Afternoon' | 'Biometric Evening';
  courseCode?: string;
  courseName?: string;
  markedBy: string; // e.g. "Sri Priyanka HU11211" or "Biometric Terminal #02 (Gate 1)"
  facultyCode?: string;
  status: 'Present' | 'Absent' | 'On Duty' | 'Late';
  timestamp?: string;
  actionAvailable?: boolean;
}

export interface DayAttendanceSummary {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  dayNumber: number;
  totalPeriods: number;
  presentPeriods: number;
  absentPeriods: number;
  biometricIn: boolean;
  biometricOut: boolean;
  status: 'FULL_PRESENT' | 'PARTIAL' | 'ABSENT' | 'WEEKEND' | 'HOLIDAY';
}

export interface AttendanceDisputeRequest {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  periodNumber?: number;
  courseCode?: string;
  sessionTitle: string;
  reason: string;
  evidenceNote?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
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
  | 'Technical Symposium'
  | 'Sports'
  | 'Cultural'
  | 'Research'
  | 'Paper Presentation'
  | 'Project Competition'
  | 'Hackathon'
  | 'Coding'
  | 'Workshop'
  | 'Internship'
  | 'Certification'
  | 'Leadership'
  | 'Other';

export interface VerificationLink {
  label: string;
  url: string;
  verified?: boolean;
}

export interface DynamicField {
  id: string;
  key: string;
  value: string;
}

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
  // Dynamic fields and verification links
  dynamic_fields?: Record<string, string>;
  verification_links?: VerificationLink[];
}

export interface AuditLogRecord {
  id: string;
  user_id: string;
  role: UserRole;
  user_name: string;
  action: string;
  action_type?: string;
  entity_type: string;
  entity_name?: string;
  entity_id: string;
  old_value?: string;
  previous_value?: any;
  new_value?: string;
  timestamp: string;
  created_at?: string;
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
  totalEarnedCredits?: number;
  totalRegisteredCredits?: number;
  degreeRequiredCredits?: number;
  degreeProgressPercentage?: number;
  projectedClassification?: string;
  honoursEligibility?: boolean;
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
  // Extended fields for Real Gemini Academic Intelligence
  overallAssessment?: string;
  performanceLevel?: 'Excellent' | 'Good' | 'Needs Improvement' | 'Insufficient Data';
  trajectoryExplanation?: string;
  diagnosticRationale?: string;
  structuredStrengths?: AcademicStrength[];
  attentionAreas?: AcademicAttentionArea[];
  structuredRecommendations?: AcademicRecommendation[];
  dataLimitations?: string[];
}

export type AcademicPerformanceLevel = 'Excellent' | 'Good' | 'Needs Improvement' | 'Insufficient Data';
export type AcademicRiskLevel = 'Low' | 'Medium' | 'High' | 'Insufficient Data';
export type RecommendationPriority = 'High' | 'Medium' | 'Low';

export interface AcademicStrength {
  title: string;
  evidence: string;
}

export interface AcademicAttentionArea {
  subject: string;
  issue: string;
  evidence: string;
  suggestedAction: string;
}

export interface AcademicRecommendation {
  title: string;
  reason: string;
  action: string;
  priority: RecommendationPriority;
}

export interface AcademicIntelligenceData {
  overallAssessment: string;
  performanceLevel: AcademicPerformanceLevel;
  riskLevel: AcademicRiskLevel;
  trajectoryExplanation: string;
  diagnosticRationale: string;
  strengths: AcademicStrength[];
  attentionAreas: AcademicAttentionArea[];
  recommendations: AcademicRecommendation[];
  dataLimitations: string[];
}

export interface AcademicIntelligenceAnalysis extends AcademicIntelligenceData {
  id?: string;
  studentId: string;
  generatedAt: string;
  engine: string;
  // Legacy compatibility
  summary?: string;
  weakSubjects?: string[];
  performanceTrendExplanation?: string;
  riskReasons?: string[];
  personalizedRecommendations?: string[];
  suggestedAreasForImprovement?: string[];
}

export interface AcademicIntelligenceResponse {
  success: boolean;
  engine: string;
  generatedAt: string;
  data: AcademicIntelligenceData;
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
