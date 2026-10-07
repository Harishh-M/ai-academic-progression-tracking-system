import {
  User,
  Faculty,
  Student,
  CalculatedAcademicMetrics,
  AIAnalysisResult,
  AttendanceRecord,
  InternalMarkRecord,
  SemesterResultRecord,
  AchievementRecord,
  AuditLogRecord,
  Course,
  Semester,
  InstitutionalRegulation,
} from '../types/index.js';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('erp_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (username: string, password?: string) =>
    request<{ token: string; user: any; role: 'FACULTY' | 'STUDENT' }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => request<{ user: any; profile: Faculty | Student }>('/auth/me'),

  getDemoAccounts: () =>
    request<{
      faculty: Array<{ username: string; name: string; department: string; designation: string; role: 'FACULTY'; facultyId: string }>;
      students: Array<{ username: string; regNo: string; name: string; programme: string; currentStatus: string; role: 'STUDENT'; studentId: string }>;
    }>('/auth/demo-accounts'),

  // Students
  getStudents: (params?: { search?: string; programme?: string; department?: string; batch?: string; status?: string; risk?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.programme) query.set('programme', params.programme);
    if (params?.department) query.set('department', params.department);
    if (params?.batch) query.set('batch', params.batch);
    if (params?.status) query.set('status', params.status);
    if (params?.risk) query.set('risk', params.risk);
    return request<Array<Student & { cgpa: number; currentSGPA: number; attendancePercentage: number; currentArrears: number; riskLevel: string; performanceStatus: string }>>(
      `/students?${query.toString()}`
    );
  },

  getAssignedStudents: () =>
    request<Array<Student & { cgpa: number; currentSGPA: number; attendancePercentage: number; currentArrears: number; riskLevel: string; performanceStatus: string }>>(
      '/students/assigned'
    ),

  getStudentById: (id: string) =>
    request<{
      student: Student;
      metrics: CalculatedAcademicMetrics;
      attendance: AttendanceRecord[];
      internalMarks: InternalMarkRecord[];
      semesterResults: SemesterResultRecord[];
      achievements: AchievementRecord[];
    }>(`/students/${id}`),

  createStudent: (data: Partial<Student>) =>
    request<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStudent: (id: string, updates: Partial<Student>) =>
    request<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Metadata
  getCourses: () => request<Course[]>('/courses'),
  getSemesters: () => request<Semester[]>('/semesters'),

  // Attendance
  getAttendance: (params?: { studentId?: string; courseId?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.courseId) query.set('courseId', params.courseId);
    if (params?.date) query.set('date', params.date);
    return request<AttendanceRecord[]>(`/attendance?${query.toString()}`);
  },

  saveAttendanceBatch: (records: Array<{ student_id: string; course_id: string; date: string; status: 'Present' | 'Absent' }>) =>
    request<{ success: boolean; count: number; records: AttendanceRecord[] }>('/attendance', {
      method: 'POST',
      body: JSON.stringify({ records }),
    }),

  // Marks
  getMarks: (studentId?: string) =>
    request<InternalMarkRecord[]>(studentId ? `/marks?studentId=${studentId}` : '/marks'),

  saveMark: (data: Partial<InternalMarkRecord>) =>
    request<InternalMarkRecord>('/marks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Results
  getResults: (studentId?: string) =>
    request<SemesterResultRecord[]>(studentId ? `/results?studentId=${studentId}` : '/results'),

  saveResult: (data: Partial<SemesterResultRecord>) =>
    request<SemesterResultRecord>('/results', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Achievements
  getAchievements: (studentId?: string) =>
    request<AchievementRecord[]>(studentId ? `/achievements?studentId=${studentId}` : '/achievements'),

  saveAchievement: (data: Partial<AchievementRecord>) =>
    request<AchievementRecord>('/achievements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Academic Progress Metrics
  getAcademicProgress: (studentId: string) =>
    request<{ student: Student; metrics: CalculatedAcademicMetrics }>(`/academic-progress/${studentId}`),

  // AI Analytics
  triggerAIAnalysis: (studentId: string) =>
    request<AIAnalysisResult>(`/ai/analyze/${studentId}`, {
      method: 'POST',
    }),

  getAIAnalysis: (studentId: string) => request<AIAnalysisResult>(`/ai/analysis/${studentId}`),

  sendAIChat: (message: string, targetStudentId?: string) =>
    request<{ response: string; citations?: Array<{ documentTitle: string; clause: string; snippet: string }> }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, targetStudentId }),
    }),

  getRegulations: (q?: string) =>
    request<InstitutionalRegulation[]>(q ? `/ai/regulations?q=${encodeURIComponent(q)}` : '/ai/regulations'),

  // Reports
  getStudentReport: (studentId: string) => request<any>(`/reports/student/${studentId}`),
  getFacultyReport: () => request<any>('/reports/faculty'),

  // Audit Logs
  getAuditLogs: () => request<AuditLogRecord[]>('/audit-logs'),
};
