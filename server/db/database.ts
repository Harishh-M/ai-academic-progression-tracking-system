import {
  User,
  Faculty,
  Student,
  Course,
  Semester,
  FacultyCourseMapping,
  StudentCourseMapping,
  AttendanceRecord,
  InternalMarkRecord,
  SemesterResultRecord,
  AchievementRecord,
  AuditLogRecord,
  InstitutionalRegulation,
  AIAnalysisResult,
} from '../../src/types/index.js';
import { generateInitialSeedData } from './seedData.js';

export class Database {
  private users: Map<string, User> = new Map();
  private faculty: Map<string, Faculty> = new Map();
  private students: Map<string, Student> = new Map();
  private courses: Map<string, Course> = new Map();
  private semesters: Map<string, Semester> = new Map();
  private facultyCourses: Map<string, FacultyCourseMapping> = new Map();
  private studentCourses: Map<string, StudentCourseMapping> = new Map();
  private attendance: Map<string, AttendanceRecord> = new Map();
  private internalMarks: Map<string, InternalMarkRecord> = new Map();
  private semesterResults: Map<string, SemesterResultRecord> = new Map();
  private achievements: Map<string, AchievementRecord> = new Map();
  private auditLogs: AuditLogRecord[] = [];
  private regulations: Map<string, InstitutionalRegulation> = new Map();
  private aiAnalyses: Map<string, AIAnalysisResult> = new Map();

  constructor() {
    this.seed();
  }

  public seed() {
    const data = generateInitialSeedData();
    this.users.clear();
    this.faculty.clear();
    this.students.clear();
    this.courses.clear();
    this.semesters.clear();
    this.facultyCourses.clear();
    this.studentCourses.clear();
    this.attendance.clear();
    this.internalMarks.clear();
    this.semesterResults.clear();
    this.achievements.clear();
    this.regulations.clear();
    this.aiAnalyses.clear();

    data.users.forEach((u) => this.users.set(u.id, u));
    data.faculty.forEach((f) => this.faculty.set(f.id, f));
    data.students.forEach((s) => this.students.set(s.id, s));
    data.courses.forEach((c) => this.courses.set(c.id, c));
    data.semesters.forEach((s) => this.semesters.set(s.id, s));
    data.facultyCourses.forEach((fc) => this.facultyCourses.set(fc.id, fc));
    data.studentCourses.forEach((sc) => this.studentCourses.set(sc.id, sc));
    data.attendance.forEach((a) => this.attendance.set(a.id, a));
    data.internalMarks.forEach((im) => this.internalMarks.set(im.id, im));
    data.semesterResults.forEach((sr) => this.semesterResults.set(sr.id, sr));
    data.achievements.forEach((ach) => this.achievements.set(ach.id, ach));
    data.regulations.forEach((r) => this.regulations.set(r.id, r));
    this.auditLogs = [...data.auditLogs];
  }

  // Users
  getUserByUsernameOrEmail(identifier: string): User | undefined {
    const idLower = identifier.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === idLower || u.email.toLowerCase() === idLower) {
        return u;
      }
    }
    return undefined;
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Faculty
  getFacultyById(id: string): Faculty | undefined {
    return this.faculty.get(id);
  }

  getFacultyByUserId(userId: string): Faculty | undefined {
    for (const f of this.faculty.values()) {
      if (f.user_id === userId) return f;
    }
    return undefined;
  }

  getAllFaculty(): Faculty[] {
    return Array.from(this.faculty.values());
  }

  // Students
  getStudentById(id: string): Student | undefined {
    return this.students.get(id);
  }

  getStudentByUserId(userId: string): Student | undefined {
    for (const s of this.students.values()) {
      if (s.user_id === userId) return s;
    }
    return undefined;
  }

  getStudentByRegisterNumber(regNo: string): Student | undefined {
    const reg = regNo.trim().toUpperCase();
    for (const s of this.students.values()) {
      if (s.register_number.toUpperCase() === reg) return s;
    }
    return undefined;
  }

  getAllStudents(): Student[] {
    return Array.from(this.students.values());
  }

  getStudentsByFaculty(facultyId: string): Student[] {
    // Return students assigned to faculty or mapped via faculty courses
    const assignedCourses = this.getFacultyCourses(facultyId).map((fc) => fc.course_id);
    return Array.from(this.students.values()).filter((s) => {
      if (s.assigned_faculty_id === facultyId) return true;
      // also check if enrolled in any of faculty's courses
      const enrolled = this.getStudentCourses(s.id).some((sc) => assignedCourses.includes(sc.course_id));
      return enrolled;
    });
  }

  createStudent(student: Student, user: User, logActor: { id: string; role: 'FACULTY'; name: string; ip: string }): Student {
    this.users.set(user.id, user);
    this.students.set(student.id, student);

    this.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: logActor.id,
      role: logActor.role,
      user_name: logActor.name,
      action: 'CREATE_STUDENT',
      entity_type: 'STUDENT',
      entity_id: student.id,
      new_value: JSON.stringify({ register_number: student.register_number, name: student.student_name, programme: student.programme }),
      timestamp: new Date().toISOString(),
      ip_address: logActor.ip,
    });

    return student;
  }

  updateStudent(studentId: string, updates: Partial<Student>, logActor: { id: string; role: 'FACULTY'; name: string; ip: string }): Student | null {
    const existing = this.students.get(studentId);
    if (!existing) return null;

    const oldCopy = { ...existing };
    const updated: Student = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Enforce business rules:
    // If Current Status = Completed -> Programme Status must be Degree Awarded or Programme Completed
    if (updated.current_status === 'Completed') {
      if (updated.programme_status !== 'Degree Awarded' && updated.programme_status !== 'Programme Completed') {
        updated.programme_status = 'Programme Completed';
      }
    }
    // If Programme Status = Degree Awarded -> degree_awarded_month_year must be set
    if (updated.programme_status === 'Degree Awarded' && !updated.degree_awarded_month_year) {
      const now = new Date();
      updated.degree_awarded_month_year = `${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
    }

    this.students.set(studentId, updated);

    this.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: logActor.id,
      role: logActor.role,
      user_name: logActor.name,
      action: 'UPDATE_STUDENT_PROFILE',
      entity_type: 'STUDENT',
      entity_id: studentId,
      old_value: JSON.stringify(oldCopy),
      new_value: JSON.stringify(updated),
      timestamp: new Date().toISOString(),
      ip_address: logActor.ip,
    });

    return updated;
  }

  // Courses & Semesters
  getAllCourses(): Course[] {
    return Array.from(this.courses.values());
  }

  getCourseById(id: string): Course | undefined {
    return this.courses.get(id);
  }

  getAllSemesters(): Semester[] {
    return Array.from(this.semesters.values()).sort((a, b) => a.semester_number - b.semester_number);
  }

  getSemesterById(id: string): Semester | undefined {
    return this.semesters.get(id);
  }

  getFacultyCourses(facultyId: string): FacultyCourseMapping[] {
    return Array.from(this.facultyCourses.values()).filter((fc) => fc.faculty_id === facultyId);
  }

  getStudentCourses(studentId: string): StudentCourseMapping[] {
    return Array.from(this.studentCourses.values()).filter((sc) => sc.student_id === studentId);
  }

  // Attendance
  getAttendanceByStudent(studentId: string): AttendanceRecord[] {
    return Array.from(this.attendance.values())
      .filter((a) => a.student_id === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getAttendanceByCourseAndDate(courseId: string, date: string): AttendanceRecord[] {
    return Array.from(this.attendance.values()).filter((a) => a.course_id === courseId && a.date === date);
  }

  recordAttendanceBatch(
    records: Array<{ student_id: string; course_id: string; date: string; status: 'Present' | 'Absent' }>,
    facultyId: string,
    logActor: { id: string; role: 'FACULTY'; name: string; ip: string }
  ): AttendanceRecord[] {
    const updatedRecords: AttendanceRecord[] = [];
    const now = new Date().toISOString();

    for (const item of records) {
      // Find if record for student+course+date exists
      let existingRecord: AttendanceRecord | undefined;
      for (const a of this.attendance.values()) {
        if (a.student_id === item.student_id && a.course_id === item.course_id && a.date === item.date) {
          existingRecord = a;
          break;
        }
      }

      if (existingRecord) {
        existingRecord.status = item.status;
        existingRecord.marked_by = facultyId;
        existingRecord.updated_at = now;
        this.attendance.set(existingRecord.id, existingRecord);
        updatedRecords.push(existingRecord);
      } else {
        const newRecord: AttendanceRecord = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          student_id: item.student_id,
          course_id: item.course_id,
          date: item.date,
          status: item.status,
          marked_by: facultyId,
          created_at: now,
          updated_at: now,
        };
        this.attendance.set(newRecord.id, newRecord);
        updatedRecords.push(newRecord);
      }
    }

    this.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: logActor.id,
      role: logActor.role,
      user_name: logActor.name,
      action: 'UPDATE_ATTENDANCE_BATCH',
      entity_type: 'ATTENDANCE',
      entity_id: records.length > 0 ? records[0].course_id : 'batch',
      new_value: `Recorded attendance for ${records.length} students on date ${records[0]?.date}`,
      timestamp: now,
      ip_address: logActor.ip,
    });

    return updatedRecords;
  }

  // Internal Marks
  getInternalMarksByStudent(studentId: string): InternalMarkRecord[] {
    return Array.from(this.internalMarks.values()).filter((im) => im.student_id === studentId);
  }

  saveInternalMark(
    record: Omit<InternalMarkRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    facultyId: string,
    logActor: { id: string; role: 'FACULTY'; name: string; ip: string }
  ): InternalMarkRecord {
    const now = new Date().toISOString();
    let res: InternalMarkRecord;

    if (record.id && this.internalMarks.has(record.id)) {
      const existing = this.internalMarks.get(record.id)!;
      const oldVal = JSON.stringify(existing);
      res = {
        ...existing,
        marks_obtained: record.marks_obtained,
        maximum_marks: record.maximum_marks,
        assessment_name: record.assessment_name,
        assessment_type: record.assessment_type,
        entered_by: facultyId,
        updated_at: now,
      };
      this.internalMarks.set(res.id, res);

      this.addAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: logActor.id,
        role: logActor.role,
        user_name: logActor.name,
        action: 'UPDATE_INTERNAL_MARK',
        entity_type: 'INTERNAL_MARK',
        entity_id: res.id,
        old_value: oldVal,
        new_value: JSON.stringify(res),
        timestamp: now,
        ip_address: logActor.ip,
      });
    } else {
      res = {
        id: `mark_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        student_id: record.student_id,
        course_id: record.course_id,
        assessment_name: record.assessment_name,
        assessment_type: record.assessment_type,
        marks_obtained: record.marks_obtained,
        maximum_marks: record.maximum_marks,
        entered_by: facultyId,
        created_at: now,
        updated_at: now,
      };
      this.internalMarks.set(res.id, res);

      this.addAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: logActor.id,
        role: logActor.role,
        user_name: logActor.name,
        action: 'CREATE_INTERNAL_MARK',
        entity_type: 'INTERNAL_MARK',
        entity_id: res.id,
        new_value: JSON.stringify(res),
        timestamp: now,
        ip_address: logActor.ip,
      });
    }
    return res;
  }

  // Semester Results
  getSemesterResultsByStudent(studentId: string): SemesterResultRecord[] {
    return Array.from(this.semesterResults.values()).filter((sr) => sr.student_id === studentId);
  }

  saveSemesterResult(
    record: Omit<SemesterResultRecord, 'id'> & { id?: string },
    logActor: { id: string; role: 'FACULTY'; name: string; ip: string }
  ): SemesterResultRecord {
    let res: SemesterResultRecord;
    const now = new Date().toISOString();

    if (record.id && this.semesterResults.has(record.id)) {
      const existing = this.semesterResults.get(record.id)!;
      const oldVal = JSON.stringify(existing);
      res = {
        ...existing,
        grade: record.grade,
        grade_point: record.grade_point,
        credits: record.credits,
        result_status: record.result_status,
        published_date: record.published_date || now,
      };
      this.semesterResults.set(res.id, res);

      this.addAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: logActor.id,
        role: logActor.role,
        user_name: logActor.name,
        action: 'UPDATE_SEMESTER_RESULT',
        entity_type: 'SEMESTER_RESULT',
        entity_id: res.id,
        old_value: oldVal,
        new_value: JSON.stringify(res),
        timestamp: now,
        ip_address: logActor.ip,
      });
    } else {
      res = {
        id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        student_id: record.student_id,
        semester_id: record.semester_id,
        course_id: record.course_id,
        grade: record.grade,
        grade_point: record.grade_point,
        credits: record.credits,
        result_status: record.result_status,
        academic_year: record.academic_year,
        published_date: record.published_date || now,
      };
      this.semesterResults.set(res.id, res);

      this.addAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: logActor.id,
        role: logActor.role,
        user_name: logActor.name,
        action: 'CREATE_SEMESTER_RESULT',
        entity_type: 'SEMESTER_RESULT',
        entity_id: res.id,
        new_value: JSON.stringify(res),
        timestamp: now,
        ip_address: logActor.ip,
      });
    }
    return res;
  }

  // Achievements
  getAchievementsByStudent(studentId: string): AchievementRecord[] {
    return Array.from(this.achievements.values())
      .filter((ach) => ach.student_id === studentId)
      .sort((a, b) => new Date(b.achievement_date).getTime() - new Date(a.achievement_date).getTime());
  }

  saveAchievement(
    achievement: Omit<AchievementRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    facultyId: string,
    logActor: { id: string; role: 'FACULTY'; name: string; ip: string }
  ): AchievementRecord {
    const now = new Date().toISOString();
    let res: AchievementRecord;

    if (achievement.id && this.achievements.has(achievement.id)) {
      const existing = this.achievements.get(achievement.id)!;
      const oldVal = JSON.stringify(existing);
      res = {
        ...existing,
        ...achievement,
        verified_by: achievement.verification_status === 'Verified' ? facultyId : existing.verified_by,
        updated_at: now,
      };
      this.achievements.set(res.id, res);

      this.addAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: logActor.id,
        role: logActor.role,
        user_name: logActor.name,
        action: 'UPDATE_ACHIEVEMENT',
        entity_type: 'ACHIEVEMENT',
        entity_id: res.id,
        old_value: oldVal,
        new_value: JSON.stringify(res),
        timestamp: now,
        ip_address: logActor.ip,
      });
    } else {
      res = {
        id: `ach_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        student_id: achievement.student_id,
        title: achievement.title,
        category: achievement.category,
        description: achievement.description,
        achievement_date: achievement.achievement_date,
        organization: achievement.organization,
        certificate_file: achievement.certificate_file,
        verification_status: achievement.verification_status || 'Verified',
        verified_by: facultyId,
        created_at: now,
        updated_at: now,
      };
      this.achievements.set(res.id, res);

      this.addAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: logActor.id,
        role: logActor.role,
        user_name: logActor.name,
        action: 'CREATE_ACHIEVEMENT',
        entity_type: 'ACHIEVEMENT',
        entity_id: res.id,
        new_value: JSON.stringify(res),
        timestamp: now,
        ip_address: logActor.ip,
      });
    }
    return res;
  }

  // Audit Logs
  addAuditLog(record: AuditLogRecord) {
    this.auditLogs.unshift(record);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  getAllAuditLogs(): AuditLogRecord[] {
    return [...this.auditLogs];
  }

  // Institutional Regulations
  getAllRegulations(): InstitutionalRegulation[] {
    return Array.from(this.regulations.values());
  }

  // AI Analysis Cache
  getAIAnalysis(studentId: string): AIAnalysisResult | undefined {
    return this.aiAnalyses.get(studentId);
  }

  saveAIAnalysis(analysis: AIAnalysisResult) {
    this.aiAnalyses.set(analysis.studentId, analysis);
  }
}

export const db = new Database();
