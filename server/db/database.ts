import { RowDataPacket } from 'mysql2';
import { pool } from './mysql.js';
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
  UserRole,
} from '../../src/types/index.js';
import { generateInitialSeedData } from './seedData.js';

export class Database {
  /**
   * One-time seeder that populates MySQL only when the database is completely empty.
   * If records already exist, it immediately skips and prevents any duplication on server restarts.
   */
  public async seedIfEmpty(): Promise<void> {
    try {
      if (process.env.AUTO_SEED === 'false') {
        console.log('[Database] AUTO_SEED=false configured. Skipping initial seeding for cleared database.');
        return;
      }

      const [rows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
      const count = Number(rows[0]?.count || 0);
      if (count > 0) {
        console.log(`[Database] MySQL already contains ${count} users. Preserving existing database records.`);
        return;
      }

      console.log('[Database] Empty database detected. Performing initial MySQL database seeding...');
      const data = generateInitialSeedData();
      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();

        // 1. Users
        for (const u of data.users) {
          await conn.query(
            'INSERT INTO users (id, username, email, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [u.id, u.username, u.email, u.role, u.status || 'Active', new Date(u.created_at), new Date(u.updated_at)]
          );
        }

        // 2. Faculty
        for (const f of data.faculty) {
          await conn.query(
            `INSERT INTO faculty (
              id, user_id, faculty_code, first_name, last_name, email, mobile_number, department,
              designation, qualification, specialization, institution, university, date_of_joining,
              date_of_birth, address, working_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              f.id, f.user_id, f.faculty_code, f.first_name, f.last_name, f.email, f.mobile_number,
              f.department, f.designation, f.qualification, f.specialization, f.institution, f.university,
              f.date_of_joining, f.date_of_birth, f.address, f.working_status || 'Active',
              new Date(f.created_at), new Date(f.updated_at),
            ]
          );
        }

        // 3. Students
        for (const s of data.students) {
          await conn.query(
            `INSERT INTO students (
              id, user_id, register_number, admission_number, student_name, date_of_birth, gender,
              abc_id, umis_number, email, mobile_number, admission_type, programme, programme_short_name,
              branch, branch_code, department, batch, year_of_admission, current_status, programme_status,
              degree_awarded_month_year, student_fees_status, readmitted_category, address, assigned_faculty_id,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              s.id, s.user_id, s.register_number, s.admission_number, s.student_name, s.date_of_birth, s.gender,
              s.abc_id, s.umis_number, s.email, s.mobile_number, s.admission_type, s.programme, s.programme_short_name,
              s.branch, s.branch_code, s.department, s.batch, s.year_of_admission, s.current_status, s.programme_status,
              s.degree_awarded_month_year || null, s.student_fees_status, s.readmitted_category, s.address, s.assigned_faculty_id,
              new Date(s.created_at), new Date(s.updated_at),
            ]
          );
        }

        // 4. Semesters
        for (const sem of data.semesters) {
          await conn.query(
            'INSERT INTO semesters (id, semester_number, academic_year, semester_type, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [sem.id, sem.semester_number, sem.academic_year, sem.semester_type, sem.start_date, sem.end_date]
          );
        }

        // 5. Courses
        for (const c of data.courses) {
          await conn.query(
            'INSERT INTO courses (id, course_code, course_name, department, programme, semester_number, credits, course_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [c.id, c.course_code, c.course_name, c.department, c.programme, c.semester_number, c.credits, c.course_type]
          );
        }

        // 6. Faculty Courses
        for (const fc of data.facultyCourses) {
          await conn.query(
            'INSERT INTO faculty_courses (id, faculty_id, course_id, semester_id, academic_year) VALUES (?, ?, ?, ?, ?)',
            [fc.id, fc.faculty_id, fc.course_id, fc.semester_id, fc.academic_year]
          );
        }

        // 7. Student Courses
        for (const sc of data.studentCourses) {
          await conn.query(
            'INSERT INTO student_courses (id, student_id, course_id, semester_id, academic_year) VALUES (?, ?, ?, ?, ?)',
            [sc.id, sc.student_id, sc.course_id, sc.semester_id, sc.academic_year]
          );
        }

        // 8. Attendance
        for (const att of data.attendance) {
          await conn.query(
            'INSERT INTO attendance (id, student_id, course_id, date, status, marked_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [att.id, att.student_id, att.course_id, att.date, att.status, att.marked_by, new Date(att.created_at), new Date(att.updated_at)]
          );
        }

        // 9. Internal Marks
        for (const im of data.internalMarks) {
          await conn.query(
            'INSERT INTO internal_marks (id, student_id, course_id, assessment_name, assessment_type, marks_obtained, maximum_marks, entered_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [im.id, im.student_id, im.course_id, im.assessment_name, im.assessment_type, im.marks_obtained, im.maximum_marks, im.entered_by, new Date(im.created_at), new Date(im.updated_at)]
          );
        }

        // 10. Semester Results
        for (const sr of data.semesterResults) {
          await conn.query(
            'INSERT INTO semester_results (id, student_id, semester_id, course_id, grade, grade_point, credits, result_status, academic_year, published_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [sr.id, sr.student_id, sr.semester_id, sr.course_id, sr.grade, sr.grade_point, sr.credits, sr.result_status, sr.academic_year, sr.published_date ? new Date(sr.published_date) : new Date()]
          );
        }

        // 11. Achievements
        for (const ach of data.achievements) {
          await conn.query(
            'INSERT INTO achievements (id, student_id, title, category, description, achievement_date, organization, certificate_file, verification_status, verified_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [ach.id, ach.student_id, ach.title, ach.category, ach.description, ach.achievement_date, ach.organization, ach.certificate_file || null, ach.verification_status || 'Verified', ach.verified_by, new Date(ach.created_at), new Date(ach.updated_at)]
          );
        }

        // 12. Audit Logs
        for (const al of data.auditLogs) {
          await conn.query(
            'INSERT INTO audit_logs (id, user_id, role, user_name, action, entity_type, entity_id, old_value, new_value, timestamp, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [al.id, al.user_id, al.role, al.user_name, al.action, al.entity_type, al.entity_id, al.old_value || null, al.new_value || null, new Date(al.timestamp), al.ip_address || '127.0.0.1']
          );
        }

        // 13. Institutional Regulations
        for (const reg of data.regulations) {
          await conn.query(
            'INSERT INTO institutional_regulations (id, category, title, document_code, clause_reference, effective_year, content) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [reg.id, reg.category, reg.title, reg.document_code, reg.clause_reference, reg.effective_year || '2023', reg.content]
          );
        }

        await conn.commit();
        console.log('[Database] MySQL initial database seeding completed successfully.');
      } catch (seedErr) {
        await conn.rollback();
        throw seedErr;
      } finally {
        conn.release();
      }
    } catch (err: any) {
      console.error('[Database] Failed to verify or seed MySQL database:', err.message);
    }
  }

  // ================= USERS =================
  async getUserByUsernameOrEmail(identifier: string): Promise<User | null> {
    const trimmed = identifier.trim();
    if (!trimmed) return null;

    const lower = trimmed.toLowerCase();

    // 1. Admin login ('admin')
    if (lower === 'admin') {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM users WHERE LOWER(username) = 'admin' OR role = 'ADMIN' ORDER BY (LOWER(username) = 'admin') DESC LIMIT 1"
      );
      if (rows.length > 0) return rows[0] as User;
    }

    // 2. COE login ('coe')
    if (lower === 'coe') {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM users WHERE LOWER(username) = 'coe' OR role = 'COE' ORDER BY (LOWER(username) = 'coe') DESC LIMIT 1"
      );
      if (rows.length > 0) return rows[0] as User;
    }

    // 3. Student login by student register number or admission number
    const [stuRows] = await pool.query<RowDataPacket[]>(
      `SELECT u.* FROM users u
       JOIN students s ON s.user_id = u.id
       WHERE LOWER(s.register_number) = LOWER(?)
          OR LOWER(s.admission_number) = LOWER(?)
       LIMIT 1`,
      [trimmed, trimmed]
    );
    if (stuRows.length > 0) return stuRows[0] as User;

    // 4. Faculty login by faculty user_id (e.g. FACAD001, FACBM001), faculty_code (AD001, BM001), or faculty id
    const [facRows] = await pool.query<RowDataPacket[]>(
      `SELECT u.* FROM users u
       JOIN faculty f ON f.user_id = u.id
       WHERE LOWER(f.user_id) = LOWER(?)
          OR LOWER(f.faculty_code) = LOWER(?)
          OR LOWER(f.id) = LOWER(?)
          OR LOWER(u.id) = LOWER(?)
       LIMIT 1`,
      [trimmed, trimmed, trimmed, trimmed]
    );
    if (facRows.length > 0) return facRows[0] as User;

    // 5. Standard fallback by username, email, or id
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM users
       WHERE LOWER(username) = LOWER(?)
          OR LOWER(email) = LOWER(?)
          OR LOWER(SUBSTRING_INDEX(email, '@', 1)) = LOWER(?)
          OR LOWER(id) = LOWER(?)
       LIMIT 1`,
      [trimmed, trimmed, trimmed, trimmed]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  async getUserById(id: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  async getAllUsers(): Promise<User[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users');
    return rows as User[];
  }

  // ================= FACULTY =================
  async getFacultyById(id: string): Promise<Faculty | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM faculty WHERE id = ? OR user_id = ? OR LOWER(faculty_code) = LOWER(?) LIMIT 1',
      [id, id, id]
    );
    if (rows.length === 0) return null;
    const f = rows[0];
    return {
      ...f,
      id: String(f.id),
      user_id: String(f.user_id),
    } as Faculty;
  }

  async getFacultyByUserId(userId: string, username?: string, email?: string): Promise<Faculty | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM faculty 
       WHERE user_id = ? 
          OR id = ? 
          OR LOWER(faculty_code) = LOWER(?)
          OR LOWER(email) = LOWER(?)
       LIMIT 1`,
      [userId, userId, username || userId, email || '']
    );
    if (rows.length === 0) return null;
    const f = rows[0];
    return {
      ...f,
      id: String(f.id),
      user_id: String(f.user_id),
    } as Faculty;
  }

  async getAllFaculty(): Promise<Faculty[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM faculty');
    return rows.map((f) => ({
      ...f,
      id: String(f.id),
      user_id: String(f.user_id),
    })) as Faculty[];
  }

  // ================= STUDENTS =================
  async getStudentById(id: string): Promise<Student | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM students WHERE id = ? OR LOWER(register_number) = LOWER(?) OR LOWER(admission_number) = LOWER(?) LIMIT 1',
      [id, id, id]
    );
    if (rows.length === 0) return null;
    const s = rows[0];
    return {
      ...s,
      id: String(s.id),
      user_id: String(s.user_id),
      assigned_faculty_id: s.assigned_faculty_id ? String(s.assigned_faculty_id) : undefined,
    } as Student;
  }

  async getStudentByUserId(userId: string, username?: string, email?: string): Promise<Student | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM students 
       WHERE user_id = ? 
          OR id = ? 
          OR LOWER(register_number) = LOWER(?)
          OR LOWER(admission_number) = LOWER(?)
          OR LOWER(email) = LOWER(?)
       LIMIT 1`,
      [userId, userId, username || userId, username || userId, email || '']
    );
    if (rows.length === 0) return null;
    const s = rows[0];
    return {
      ...s,
      id: String(s.id),
      user_id: String(s.user_id),
      assigned_faculty_id: s.assigned_faculty_id ? String(s.assigned_faculty_id) : undefined,
    } as Student;
  }

  async getStudentByRegisterNumber(regNo: string): Promise<Student | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM students WHERE UPPER(register_number) = UPPER(?) OR id = ? LIMIT 1',
      [regNo.trim(), regNo.trim()]
    );
    if (rows.length === 0) return null;
    const s = rows[0];
    return {
      ...s,
      id: String(s.id),
      user_id: String(s.user_id),
      assigned_faculty_id: s.assigned_faculty_id ? String(s.assigned_faculty_id) : undefined,
    } as Student;
  }

  async getAllStudents(): Promise<Student[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM students');
    return rows.map((s) => ({
      ...s,
      id: String(s.id),
      user_id: String(s.user_id),
      assigned_faculty_id: s.assigned_faculty_id ? String(s.assigned_faculty_id) : undefined,
    })) as Student[];
  }

  async getStudentsByFaculty(facultyId: string): Promise<Student[]> {
    const fac = (await this.getFacultyById(facultyId)) || (await this.getFacultyByUserId(facultyId));
    const candidateIds = Array.from(
      new Set([facultyId, fac?.id, fac?.faculty_code, fac?.user_id].filter(Boolean))
    );

    const placeholders = candidateIds.map(() => '?').join(',');
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT s.* FROM students s
       WHERE s.assigned_faculty_id IN (${placeholders})
          OR s.id IN (
            SELECT sc.student_id FROM student_courses sc
            INNER JOIN faculty_courses fc ON sc.course_id = fc.course_id
            WHERE fc.faculty_id IN (${placeholders})
          )`,
      [...candidateIds, ...candidateIds]
    );

    return rows.map((s) => ({
      ...s,
      id: String(s.id),
      user_id: String(s.user_id),
      assigned_faculty_id: s.assigned_faculty_id ? String(s.assigned_faculty_id) : undefined,
    })) as Student[];
  }

  async createStudent(
    student: Student,
    user: User,
    logActor: { id: string; role: string; name: string; ip: string }
  ): Promise<Student> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        'INSERT INTO users (id, username, email, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.username, user.email, user.role, user.status || 'Active', new Date(user.created_at), new Date(user.updated_at)]
      );

      await conn.query(
        `INSERT INTO students (
          id, user_id, register_number, admission_number, student_name, date_of_birth, gender,
          abc_id, umis_number, email, mobile_number, admission_type, programme, programme_short_name,
          branch, branch_code, department, batch, year_of_admission, current_status, programme_status,
          degree_awarded_month_year, student_fees_status, readmitted_category, address, assigned_faculty_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student.id, student.user_id, student.register_number, student.admission_number || null,
          student.student_name, student.date_of_birth || null, student.gender || null,
          student.abc_id || null, student.umis_number || null, student.email, student.mobile_number || null,
          student.admission_type || null, student.programme, student.programme_short_name || null,
          student.branch || null, student.branch_code || null, student.department, student.batch || null,
          student.year_of_admission || null, student.current_status || 'Continuing', student.programme_status || 'Active',
          student.degree_awarded_month_year || null, student.student_fees_status || null, student.readmitted_category || null,
          student.address || null, student.assigned_faculty_id || null,
          new Date(student.created_at), new Date(student.updated_at),
        ]
      );

      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await conn.query(
        `INSERT INTO audit_logs (id, user_id, role, user_name, action, entity_type, entity_id, new_value, timestamp, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          logActor.id,
          logActor.role,
          logActor.name,
          'CREATE_STUDENT',
          'STUDENT',
          student.id,
          JSON.stringify({ register_number: student.register_number, name: student.student_name, programme: student.programme }),
          new Date(),
          logActor.ip,
        ]
      );

      await conn.commit();
      return student;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async updateStudent(
    studentId: string,
    updates: Partial<Student>,
    logActor: { id: string; role: string; name: string; ip: string }
  ): Promise<Student | null> {
    const existing = await this.getStudentById(studentId);
    if (!existing) return null;

    const oldCopy = { ...existing };
    const updated: Student = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Business rule enforcement:
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

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE students SET
          student_name = ?, date_of_birth = ?, gender = ?, abc_id = ?, umis_number = ?,
          email = ?, mobile_number = ?, admission_type = ?, programme = ?, programme_short_name = ?,
          branch = ?, branch_code = ?, department = ?, batch = ?, year_of_admission = ?,
          current_status = ?, programme_status = ?, degree_awarded_month_year = ?,
          student_fees_status = ?, readmitted_category = ?, address = ?, assigned_faculty_id = ?,
          updated_at = ?
         WHERE id = ?`,
        [
          updated.student_name, updated.date_of_birth, updated.gender, updated.abc_id, updated.umis_number,
          updated.email, updated.mobile_number, updated.admission_type, updated.programme, updated.programme_short_name,
          updated.branch, updated.branch_code, updated.department, updated.batch, updated.year_of_admission,
          updated.current_status, updated.programme_status, updated.degree_awarded_month_year || null,
          updated.student_fees_status, updated.readmitted_category, updated.address, updated.assigned_faculty_id,
          new Date(updated.updated_at), studentId,
        ]
      );

      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await conn.query(
        `INSERT INTO audit_logs (id, user_id, role, user_name, action, entity_type, entity_id, old_value, new_value, timestamp, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          logActor.id,
          logActor.role,
          logActor.name,
          'UPDATE_STUDENT_PROFILE',
          'STUDENT',
          studentId,
          JSON.stringify(oldCopy),
          JSON.stringify(updated),
          new Date(),
          logActor.ip,
        ]
      );

      await conn.commit();
      return updated;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ================= COURSES & SEMESTERS =================
  async getAllCourses(): Promise<Course[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM courses');
    return rows.map((r) => ({
      ...r,
      credits: Number(r.credits),
      semester_number: Number(r.semester_number),
    })) as Course[];
  }

  async getCourseById(id: string): Promise<Course | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM courses WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      credits: Number(r.credits),
      semester_number: Number(r.semester_number),
    } as Course;
  }

  async getAllSemesters(): Promise<Semester[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM semesters ORDER BY semester_number ASC');
    return rows.map((r) => ({
      ...r,
      semester_number: Number(r.semester_number),
    })) as Semester[];
  }

  async getSemesterById(id: string): Promise<Semester | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM semesters WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      semester_number: Number(r.semester_number),
    } as Semester;
  }

  async getFacultyCourses(facultyId: string): Promise<FacultyCourseMapping[]> {
    if (!facultyId) return [];
    const fac = await this.getFacultyById(facultyId);
    const candidateIds = Array.from(new Set([
      String(facultyId),
      fac ? String(fac.id) : null,
      fac?.faculty_code || null,
      fac?.user_id || null,
    ].filter(Boolean))) as string[];

    if (candidateIds.length === 0) return [];
    const placeholders = candidateIds.map(() => '?').join(', ');
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM faculty_courses WHERE faculty_id IN (${placeholders})`,
      candidateIds
    );
    return rows as FacultyCourseMapping[];
  }

  async getStudentCourses(studentId: string): Promise<StudentCourseMapping[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM student_courses WHERE student_id = ?', [studentId]);
    return rows as StudentCourseMapping[];
  }

  // ================= ATTENDANCE =================
  async getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC',
      [studentId]
    );
    return rows as AttendanceRecord[];
  }

  async getAttendanceByCourseAndDate(courseId: string, date: string): Promise<AttendanceRecord[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM attendance WHERE course_id = ? AND date = ?',
      [courseId, date]
    );
    return rows as AttendanceRecord[];
  }

  async getAttendanceByCourse(courseId: string): Promise<AttendanceRecord[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM attendance WHERE course_id = ? ORDER BY date DESC LIMIT 300',
      [courseId]
    );
    return rows as AttendanceRecord[];
  }

  async recordAttendanceBatch(
    records: Array<{ student_id: string; course_id: string; date: string; status: 'Present' | 'Absent' }>,
    facultyId: string,
    logActor: { id: string; role: 'FACULTY' | 'ADMIN' | 'COE'; name: string; ip: string }
  ): Promise<AttendanceRecord[]> {
    const conn = await pool.getConnection();
    const updatedRecords: AttendanceRecord[] = [];
    const now = new Date();
    const nowIso = now.toISOString();

    try {
      await conn.beginTransaction();

      for (const item of records) {
        const [existing] = await conn.query<RowDataPacket[]>(
          'SELECT * FROM attendance WHERE student_id = ? AND course_id = ? AND date = ? LIMIT 1',
          [item.student_id, item.course_id, item.date]
        );

        if (existing.length > 0) {
          const id = existing[0].id;
          await conn.query(
            'UPDATE attendance SET status = ?, marked_by = ?, updated_at = ? WHERE id = ?',
            [item.status, facultyId, now, id]
          );
          updatedRecords.push({
            id,
            student_id: item.student_id,
            course_id: item.course_id,
            date: item.date,
            status: item.status,
            marked_by: facultyId,
            created_at: existing[0].created_at,
            updated_at: nowIso,
          });
        } else {
          const newId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await conn.query(
            'INSERT INTO attendance (id, student_id, course_id, date, status, marked_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [newId, item.student_id, item.course_id, item.date, item.status, facultyId, now, now]
          );
          updatedRecords.push({
            id: newId,
            student_id: item.student_id,
            course_id: item.course_id,
            date: item.date,
            status: item.status,
            marked_by: facultyId,
            created_at: nowIso,
            updated_at: nowIso,
          });
        }
      }

      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await conn.query(
        `INSERT INTO audit_logs (id, user_id, role, user_name, action, entity_type, entity_id, new_value, timestamp, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          logActor.id,
          logActor.role,
          logActor.name,
          'UPDATE_ATTENDANCE_BATCH',
          'ATTENDANCE',
          records.length > 0 ? records[0].course_id : 'batch',
          `Recorded attendance for ${records.length} students on date ${records[0]?.date}`,
          now,
          logActor.ip,
        ]
      );

      await conn.commit();
      return updatedRecords;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ================= INTERNAL MARKS =================
  async getInternalMarksByStudent(studentId: string): Promise<InternalMarkRecord[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM internal_marks WHERE student_id = ?',
      [studentId]
    );
    return rows.map((r) => ({
      ...r,
      marks_obtained: Number(r.marks_obtained),
      maximum_marks: Number(r.maximum_marks),
    })) as InternalMarkRecord[];
  }

  async saveInternalMark(
    record: Omit<InternalMarkRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    facultyId: string,
    logActor: { id: string; role: 'FACULTY'; name: string; ip: string }
  ): Promise<InternalMarkRecord> {
    const conn = await pool.getConnection();
    const now = new Date();
    const nowIso = now.toISOString();

    try {
      await conn.beginTransaction();
      let res: InternalMarkRecord;

      let existing: RowDataPacket[] = [];
      if (record.id) {
        [existing] = await conn.query<RowDataPacket[]>(
          'SELECT * FROM internal_marks WHERE id = ? LIMIT 1',
          [record.id]
        );
      }

      if (existing.length > 0) {
        const oldRow = existing[0];
        const oldVal = JSON.stringify(oldRow);

        res = {
          id: record.id!,
          student_id: record.student_id,
          course_id: record.course_id,
          assessment_name: record.assessment_name,
          assessment_type: record.assessment_type,
          marks_obtained: record.marks_obtained,
          maximum_marks: record.maximum_marks,
          entered_by: facultyId,
          created_at: oldRow.created_at,
          updated_at: nowIso,
        };

        await conn.query(
          `UPDATE internal_marks SET
            marks_obtained = ?, maximum_marks = ?, assessment_name = ?,
            assessment_type = ?, entered_by = ?, updated_at = ?
           WHERE id = ?`,
          [record.marks_obtained, record.maximum_marks, record.assessment_name, record.assessment_type, facultyId, now, record.id]
        );

        const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await conn.query(
          `INSERT INTO audit_logs (id, user_id, role, user_name, action, entity_type, entity_id, old_value, new_value, timestamp, ip_address)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [auditId, logActor.id, logActor.role, logActor.name, 'UPDATE_INTERNAL_MARK', 'INTERNAL_MARK', res.id, oldVal, JSON.stringify(res), now, logActor.ip]
        );
      } else {
        const newId = record.id || `mark_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        res = {
          id: newId,
          student_id: record.student_id,
          course_id: record.course_id,
          assessment_name: record.assessment_name,
          assessment_type: record.assessment_type,
          marks_obtained: record.marks_obtained,
          maximum_marks: record.maximum_marks,
          entered_by: facultyId,
          created_at: nowIso,
          updated_at: nowIso,
        };

        await conn.query(
          `INSERT INTO internal_marks (id, student_id, course_id, assessment_name, assessment_type, marks_obtained, maximum_marks, entered_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, record.student_id, record.course_id, record.assessment_name, record.assessment_type, record.marks_obtained, record.maximum_marks, facultyId, now, now]
        );

        const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await conn.query(
          `INSERT INTO audit_logs (id, user_id, role, user_name, action, entity_type, entity_id, new_value, timestamp, ip_address)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [auditId, logActor.id, logActor.role, logActor.name, 'CREATE_INTERNAL_MARK', 'INTERNAL_MARK', newId, JSON.stringify(res), now, logActor.ip]
        );
      }

      await conn.commit();
      return res;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ================= SEMESTER RESULTS =================
  async getSemesterResultsByStudent(studentId: string): Promise<SemesterResultRecord[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM semester_results WHERE student_id = ?',
      [studentId]
    );
    return rows.map((r) => ({
      ...r,
      grade_point: Number(r.grade_point),
      credits: Number(r.credits),
    })) as SemesterResultRecord[];
  }

  async saveSemesterResult(
    record: Omit<SemesterResultRecord, 'id'> & { id?: string },
    logActor: { id: string; role: string; name: string; ip: string }
  ): Promise<SemesterResultRecord> {
    const conn = await pool.getConnection();
    const now = new Date();
    const nowIso = now.toISOString();

    try {
      await conn.beginTransaction();
      let res: SemesterResultRecord;

      let existing: RowDataPacket[] = [];
      if (record.id) {
        [existing] = await conn.query<RowDataPacket[]>(
          'SELECT * FROM semester_results WHERE id = ? LIMIT 1',
          [record.id]
        );
      }

      if (existing.length > 0) {
        const oldRow = existing[0];
        const oldVal = JSON.stringify(oldRow);

        res = {
          id: record.id!,
          student_id: record.student_id,
          semester_id: record.semester_id,
          course_id: record.course_id,
          grade: record.grade,
          grade_point: record.grade_point,
          credits: record.credits,
          result_status: record.result_status,
          academic_year: record.academic_year || oldRow.academic_year,
          published_date: record.published_date || oldRow.published_date || nowIso,
        };

        await conn.query(
          `UPDATE semester_results SET
            grade = ?, grade_point = ?, credits = ?, result_status = ?, published_date = ?
           WHERE id = ?`,
          [record.grade, record.grade_point, record.credits, record.result_status, record.published_date ? new Date(record.published_date) : now, record.id]
        );

        const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await conn.query(
          `INSERT INTO audit_logs (id, user_id, role, user_name, action, entity_type, entity_id, old_value, new_value, timestamp, ip_address)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [auditId, logActor.id, logActor.role, logActor.name, 'UPDATE_SEMESTER_RESULT', 'SEMESTER_RESULT', res.id, oldVal, JSON.stringify(res), now, logActor.ip]
        );
      } else {
        const newId = record.id || `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        res = {
          id: newId,
          student_id: record.student_id,
          semester_id: record.semester_id,
          course_id: record.course_id,
          grade: record.grade,
          grade_point: record.grade_point,
          credits: record.credits,
          result_status: record.result_status,
          academic_year: record.academic_year || '2024-2025',
          published_date: record.published_date || nowIso,
        };

        await conn.query(
          `INSERT INTO semester_results (id, student_id, semester_id, course_id, grade, grade_point, credits, result_status, academic_year, published_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, record.student_id, record.semester_id, record.course_id, record.grade, record.grade_point, record.credits, record.result_status, res.academic_year, record.published_date ? new Date(record.published_date) : now]
        );

        const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await conn.query(
          `INSERT INTO audit_logs (id, user_id, role, user_name, action, entity_type, entity_id, new_value, timestamp, ip_address)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [auditId, logActor.id, logActor.role, logActor.name, 'CREATE_SEMESTER_RESULT', 'SEMESTER_RESULT', newId, JSON.stringify(res), now, logActor.ip]
        );
      }

      await conn.commit();
      return res;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ================= ACHIEVEMENTS =================
  private normalizeAchievement(row: any): AchievementRecord {
    let verification_links: { label: string; url: string }[] = [];
    if (row.certificate_file) {
      try {
        const parsed = JSON.parse(row.certificate_file);
        if (Array.isArray(parsed)) {
          verification_links = parsed;
        } else if (parsed && typeof parsed === 'object') {
          verification_links = [parsed];
        }
      } catch {
        verification_links = [{ label: 'Credential / Proof Link', url: row.certificate_file }];
      }
    }

    let descriptionText = row.description || '';
    let dynamic_fields: Record<string, string> | undefined = undefined;

    if (descriptionText && descriptionText.trim().startsWith('{')) {
      try {
        const parsedDesc = JSON.parse(descriptionText);
        if (parsedDesc && typeof parsedDesc === 'object') {
          descriptionText = parsedDesc.summary || '';
          dynamic_fields = parsedDesc.fields || parsedDesc.dynamic_fields;
        }
      } catch {}
    }

    return {
      ...row,
      description: descriptionText,
      verification_links,
      dynamic_fields,
    };
  }

  async getAchievementsByStudent(studentId: string): Promise<AchievementRecord[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM achievements WHERE student_id = ? ORDER BY achievement_date DESC',
      [studentId]
    );
    return (rows as any[]).map((r) => this.normalizeAchievement(r));
  }

  async getAllAchievements(): Promise<AchievementRecord[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM achievements 
       ORDER BY (CASE WHEN verification_status = 'Pending' THEN 0 WHEN verification_status = 'Verified' THEN 1 ELSE 2 END), achievement_date DESC`
    );
    return (rows as any[]).map((r) => this.normalizeAchievement(r));
  }

  async saveAchievement(
    achievement: Omit<AchievementRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    facultyId: string | null,
    logActor: { id: string; role: UserRole; name: string; ip: string }
  ): Promise<AchievementRecord> {
    const conn = await pool.getConnection();
    const now = new Date();
    const nowIso = now.toISOString();

    // Serialize dynamic fields & verification links if provided
    let dbDesc = achievement.description || '';
    if (achievement.dynamic_fields && Object.keys(achievement.dynamic_fields).length > 0) {
      dbDesc = JSON.stringify({
        summary: achievement.description || '',
        fields: achievement.dynamic_fields,
      });
    }

    let dbCert = achievement.certificate_file || null;
    if (achievement.verification_links && achievement.verification_links.length > 0) {
      dbCert = JSON.stringify(achievement.verification_links);
    }

    try {
      await conn.beginTransaction();
      let res: AchievementRecord;

      let existing: RowDataPacket[] = [];
      if (achievement.id) {
        [existing] = await conn.query<RowDataPacket[]>(
          'SELECT * FROM achievements WHERE id = ? LIMIT 1',
          [achievement.id]
        );
      }

      if (existing.length > 0) {
        const oldRow = existing[0];
        const oldVal = JSON.stringify(oldRow);
        const newStatus = achievement.verification_status || oldRow.verification_status;
        const verifier = newStatus === 'Verified' ? (facultyId || oldRow.verified_by) : (newStatus === 'Pending' ? null : oldRow.verified_by);

        res = {
          id: achievement.id!,
          student_id: achievement.student_id,
          title: achievement.title,
          category: achievement.category,
          description: achievement.description,
          achievement_date: achievement.achievement_date,
          organization: achievement.organization,
          certificate_file: dbCert || undefined,
          verification_status: newStatus,
          verified_by: verifier,
          created_at: oldRow.created_at,
          updated_at: nowIso,
          dynamic_fields: achievement.dynamic_fields,
          verification_links: achievement.verification_links,
        };

        await conn.query(
          `UPDATE achievements SET
            title = ?, category = ?, description = ?, achievement_date = ?,
            organization = ?, certificate_file = ?, verification_status = ?,
            verified_by = ?, updated_at = ?
           WHERE id = ?`,
          [
            res.title, res.category, dbDesc, res.achievement_date,
            res.organization, dbCert, res.verification_status,
            res.verified_by || null, now, res.id,
          ]
        );

        const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await conn.query(
          `INSERT INTO audit_logs (id, user_id, role, user_name, action, entity_type, entity_id, old_value, new_value, timestamp, ip_address)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [auditId, logActor.id, logActor.role, logActor.name, 'UPDATE_ACHIEVEMENT', 'ACHIEVEMENT', res.id, oldVal, JSON.stringify(res), now, logActor.ip]
        );
      } else {
        const newId = achievement.id || `ach_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const initialStatus = achievement.verification_status || 'Verified';
        const verifier = initialStatus === 'Verified' ? facultyId : null;

        res = {
          id: newId,
          student_id: achievement.student_id,
          title: achievement.title,
          category: achievement.category,
          description: achievement.description,
          achievement_date: achievement.achievement_date,
          organization: achievement.organization,
          certificate_file: dbCert || undefined,
          verification_status: initialStatus,
          verified_by: verifier,
          created_at: nowIso,
          updated_at: nowIso,
          dynamic_fields: achievement.dynamic_fields,
          verification_links: achievement.verification_links,
        };

        await conn.query(
          `INSERT INTO achievements (id, student_id, title, category, description, achievement_date, organization, certificate_file, verification_status, verified_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId, res.student_id, res.title, res.category, dbDesc, res.achievement_date,
            res.organization, dbCert, res.verification_status,
            res.verified_by, now, now,
          ]
        );

        const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await conn.query(
          `INSERT INTO audit_logs (id, user_id, role, user_name, action, entity_type, entity_id, new_value, timestamp, ip_address)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [auditId, logActor.id, logActor.role, logActor.name, 'CREATE_ACHIEVEMENT', 'ACHIEVEMENT', newId, JSON.stringify(res), now, logActor.ip]
        );
      }

      await conn.commit();
      return res;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ================= AUDIT LOGS =================
  async addAuditLog(record: AuditLogRecord): Promise<void> {
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, role, user_name, action, entity_type, entity_id, old_value, new_value, timestamp, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.user_id,
        record.role,
        record.user_name,
        record.action,
        record.entity_type,
        record.entity_id,
        record.old_value || null,
        record.new_value || null,
        record.timestamp ? new Date(record.timestamp) : new Date(),
        record.ip_address || null,
      ]
    );
  }

  async getAllAuditLogs(): Promise<AuditLogRecord[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500'
    );
    return rows as AuditLogRecord[];
  }

  // ================= INSTITUTIONAL REGULATIONS =================
  async getAllRegulations(): Promise<InstitutionalRegulation[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM institutional_regulations');
    return rows as InstitutionalRegulation[];
  }

  // ================= AI ANALYSIS CACHE =================
  async getAIAnalysis(studentId: string): Promise<AIAnalysisResult | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT analysis_json FROM ai_analyses WHERE student_id = ? LIMIT 1',
      [studentId]
    );
    if (rows.length === 0) return null;
    const raw = rows[0].analysis_json;
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  async saveAIAnalysis(analysis: AIAnalysisResult): Promise<void> {
    const jsonStr = JSON.stringify(analysis);
    await pool.query(
      `INSERT INTO ai_analyses (student_id, analysis_json, generated_at, updated_at)
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE analysis_json = VALUES(analysis_json), updated_at = NOW()`,
      [analysis.studentId, jsonStr]
    );
  }

  // ================= RESULTS PUBLISHING & MANAGEMENT (COE / ADMIN) =================
  async getAllSemesterResults(filters?: { semesterId?: string; courseId?: string; studentId?: string; limit?: number }): Promise<SemesterResultRecord[]> {
    let sql = 'SELECT * FROM semester_results WHERE 1=1';
    const params: any[] = [];

    if (filters?.semesterId && filters.semesterId !== 'all') {
      sql += ' AND semester_id = ?';
      params.push(filters.semesterId);
    }
    if (filters?.courseId && filters.courseId !== 'all') {
      sql += ' AND course_id = ?';
      params.push(filters.courseId);
    }
    if (filters?.studentId && filters.studentId !== 'all') {
      sql += ' AND student_id = ?';
      params.push(filters.studentId);
    }

    const limitNum = Math.max(1, Math.min(Number(filters?.limit) || 10000, 50000));
    sql += ` ORDER BY id ASC LIMIT ${limitNum}`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows.map((r) => ({
      ...r,
      grade_point: Number(r.grade_point),
      credits: Number(r.credits),
    })) as SemesterResultRecord[];
  }

  async publishSemesterResultsBatch(
    resultIds: string[],
    publishedDate: string,
    logActor: { id: string; role: string; name: string; ip: string }
  ): Promise<number> {
    if (!resultIds || resultIds.length === 0) return 0;
    const conn = await pool.getConnection();
    const now = new Date();
    try {
      await conn.beginTransaction();
      const placeholders = resultIds.map(() => '?').join(',');
      const [res] = await conn.query<any>(
        `UPDATE semester_results 
         SET published_date = ?, result_status = CASE WHEN grade_point > 0 THEN 'Pass' ELSE 'Fail' END
         WHERE id IN (${placeholders})`,
        [new Date(publishedDate), ...resultIds]
      );

      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await conn.query(
        `INSERT INTO audit_logs (id, user_id, role, user_name, action, entity_type, entity_id, new_value, timestamp, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          logActor.id,
          logActor.role,
          logActor.name,
          'PUBLISH_SEMESTER_RESULTS',
          'SEMESTER_RESULTS',
          'batch',
          `Published ${res.affectedRows || resultIds.length} semester results on date ${publishedDate}`,
          now,
          logActor.ip,
        ]
      );

      await conn.commit();
      return res.affectedRows || resultIds.length;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ================= ADMIN MANAGEMENT =================
  async createUser(user: { id: string; username: string; email: string; password_hash?: string; role: UserRole; status?: 'Active' | 'Inactive' }): Promise<User> {
    const now = new Date();
    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.username, user.email, user.password_hash || null, user.role, user.status || 'Active', now, now]
    );
    return (await this.getUserById(user.id))!;
  }

  async updateUser(id: string, updates: Partial<{ username: string; email: string; password_hash: string; role: UserRole; status: 'Active' | 'Inactive' }>): Promise<User | null> {
    const sets: string[] = [];
    const values: any[] = [];
    if (updates.username) { sets.push('username = ?'); values.push(updates.username); }
    if (updates.email) { sets.push('email = ?'); values.push(updates.email); }
    if (updates.password_hash) { sets.push('password_hash = ?'); values.push(updates.password_hash); }
    if (updates.role) { sets.push('role = ?'); values.push(updates.role); }
    if (updates.status) { sets.push('status = ?'); values.push(updates.status); }
    if (sets.length === 0) return this.getUserById(id);

    sets.push('updated_at = NOW()');
    values.push(id);
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
    return this.getUserById(id);
  }

  async deleteUser(id: string): Promise<boolean> {
    const [res] = await pool.query<any>('DELETE FROM users WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }

  async createFaculty(faculty: Faculty): Promise<Faculty> {
    const now = new Date();
    await pool.query(
      `INSERT INTO faculty (
        id, user_id, faculty_code, first_name, last_name, email, mobile_number, department,
        designation, qualification, specialization, institution, university, date_of_joining,
        date_of_birth, address, working_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        faculty.id, faculty.user_id, faculty.faculty_code, faculty.first_name, faculty.last_name, faculty.email, faculty.mobile_number,
        faculty.department, faculty.designation, faculty.qualification, faculty.specialization, faculty.institution, faculty.university,
        faculty.date_of_joining, faculty.date_of_birth, faculty.address, faculty.working_status || 'Active', now, now
      ]
    );
    return (await this.getFacultyById(faculty.id))!;
  }

  async updateFaculty(id: string, updates: Partial<Faculty>): Promise<Faculty | null> {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
    if (fields.length === 0) return this.getFacultyById(id);
    const sets = fields.map(k => `\`${k}\` = ?`).join(', ');
    const values = fields.map(k => (updates as any)[k]);
    values.push(id);
    await pool.query(`UPDATE faculty SET ${sets}, updated_at = NOW() WHERE id = ?`, values);
    return this.getFacultyById(id);
  }

  async createCourse(course: Course): Promise<Course> {
    await pool.query(
      `INSERT INTO courses (id, course_code, course_name, department, programme, semester_number, credits, course_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [course.id, course.course_code, course.course_name, course.department, course.programme, course.semester_number, course.credits, course.course_type]
    );
    return (await this.getCourseById(course.id))!;
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    if (fields.length === 0) return this.getCourseById(id);
    const sets = fields.map(k => `\`${k}\` = ?`).join(', ');
    const values = fields.map(k => (updates as any)[k]);
    values.push(id);
    await pool.query(`UPDATE courses SET ${sets} WHERE id = ?`, values);
    return this.getCourseById(id);
  }

  async createSemester(semester: Semester): Promise<Semester> {
    await pool.query(
      `INSERT INTO semesters (id, semester_number, academic_year, semester_type, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [semester.id, semester.semester_number, semester.academic_year, semester.semester_type, semester.start_date, semester.end_date]
    );
    return (await this.getSemesterById(semester.id))!;
  }

  async getAllFacultyCourses(): Promise<FacultyCourseMapping[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM faculty_courses');
    return rows as FacultyCourseMapping[];
  }

  async getAllStudentCourses(): Promise<StudentCourseMapping[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM student_courses');
    return rows as StudentCourseMapping[];
  }

  async createFacultyCourseMapping(mapping: FacultyCourseMapping): Promise<FacultyCourseMapping> {
    await pool.query(
      `INSERT INTO faculty_courses (id, faculty_id, course_id, semester_id, academic_year)
       VALUES (?, ?, ?, ?, ?)`,
      [mapping.id, mapping.faculty_id, mapping.course_id, mapping.semester_id, mapping.academic_year]
    );
    return mapping;
  }

  async deleteFacultyCourseMapping(id: string): Promise<boolean> {
    const [res] = await pool.query<any>('DELETE FROM faculty_courses WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }

  async createStudentCourseMapping(mapping: StudentCourseMapping): Promise<StudentCourseMapping> {
    await pool.query(
      `INSERT INTO student_courses (id, student_id, course_id, semester_id, academic_year)
       VALUES (?, ?, ?, ?, ?)`,
      [mapping.id, mapping.student_id, mapping.course_id, mapping.semester_id, mapping.academic_year]
    );
    return mapping;
  }

  async deleteStudentCourseMapping(id: string): Promise<boolean> {
    const [res] = await pool.query<any>('DELETE FROM student_courses WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }
}

export const db = new Database();
