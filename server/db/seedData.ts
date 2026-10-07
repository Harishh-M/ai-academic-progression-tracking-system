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
} from '../../src/types/index.js';

export function generateInitialSeedData() {
  const users: User[] = [];
  const faculty: Faculty[] = [];
  const students: Student[] = [];
  const courses: Course[] = [];
  const semesters: Semester[] = [];
  const facultyCourses: FacultyCourseMapping[] = [];
  const studentCourses: StudentCourseMapping[] = [];
  const attendance: AttendanceRecord[] = [];
  const internalMarks: InternalMarkRecord[] = [];
  const semesterResults: SemesterResultRecord[] = [];
  const achievements: AchievementRecord[] = [];
  const auditLogs: AuditLogRecord[] = [];
  const regulations: InstitutionalRegulation[] = [];

  const now = new Date().toISOString();

  // 1. Semesters
  const semList: Semester[] = [
    { id: 'sem_1', semester_number: 1, academic_year: '2023-2024', semester_type: 'Odd', start_date: '2023-08-01', end_date: '2023-12-15' },
    { id: 'sem_2', semester_number: 2, academic_year: '2023-2024', semester_type: 'Even', start_date: '2024-01-05', end_date: '2024-05-20' },
    { id: 'sem_3', semester_number: 3, academic_year: '2024-2025', semester_type: 'Odd', start_date: '2024-08-01', end_date: '2024-12-15' },
    { id: 'sem_4', semester_number: 4, academic_year: '2024-2025', semester_type: 'Even', start_date: '2025-01-06', end_date: '2025-05-25' },
    { id: 'sem_5', semester_number: 5, academic_year: '2025-2026', semester_type: 'Odd', start_date: '2025-08-01', end_date: '2025-12-15' },
    { id: 'sem_6', semester_number: 6, academic_year: '2025-2026', semester_type: 'Even', start_date: '2026-01-05', end_date: '2026-05-20' },
  ];
  semesters.push(...semList);

  // 2. Courses
  const courseList: Course[] = [
    { id: 'cs101', course_code: 'CS101', course_name: 'Engineering Mathematics I', department: 'Mathematics', programme: 'B.E. Computer Science and Engineering', semester_number: 1, credits: 4, course_type: 'Core' },
    { id: 'cs102', course_code: 'CS102', course_name: 'Problem Solving & Python Programming', department: 'Computer Science', programme: 'B.E. Computer Science and Engineering', semester_number: 1, credits: 3, course_type: 'Core' },
    { id: 'cs103', course_code: 'CS103', course_name: 'Physics for Information Science', department: 'Physics', programme: 'B.E. Computer Science and Engineering', semester_number: 1, credits: 3, course_type: 'Core' },
    
    { id: 'cs201', course_code: 'CS201', course_name: 'Discrete Mathematics', department: 'Mathematics', programme: 'B.E. Computer Science and Engineering', semester_number: 2, credits: 4, course_type: 'Core' },
    { id: 'cs202', course_code: 'CS202', course_name: 'Data Structures and Algorithms', department: 'Computer Science', programme: 'B.E. Computer Science and Engineering', semester_number: 2, credits: 4, course_type: 'Core' },
    { id: 'cs203', course_code: 'CS203', course_name: 'Digital Logic and Design', department: 'Computer Science', programme: 'B.E. Computer Science and Engineering', semester_number: 2, credits: 3, course_type: 'Core' },

    { id: 'cs301', course_code: 'CS301', course_name: 'Database Management Systems', department: 'Computer Science', programme: 'B.E. Computer Science and Engineering', semester_number: 3, credits: 4, course_type: 'Core' },
    { id: 'cs302', course_code: 'CS302', course_name: 'Operating Systems', department: 'Computer Science', programme: 'B.E. Computer Science and Engineering', semester_number: 3, credits: 4, course_type: 'Core' },
    { id: 'cs303', course_code: 'CS303', course_name: 'Design and Analysis of Algorithms', department: 'Computer Science', programme: 'B.E. Computer Science and Engineering', semester_number: 3, credits: 4, course_type: 'Core' },
    { id: 'cs304', course_code: 'CS304', course_name: 'Software Engineering', department: 'Computer Science', programme: 'B.E. Computer Science and Engineering', semester_number: 3, credits: 3, course_type: 'Core' },

    { id: 'cs401', course_code: 'CS401', course_name: 'Computer Networks', department: 'Computer Science', programme: 'B.E. Computer Science and Engineering', semester_number: 4, credits: 4, course_type: 'Core' },
    { id: 'cs402', course_code: 'CS402', course_name: 'Theory of Computation', department: 'Computer Science', programme: 'B.E. Computer Science and Engineering', semester_number: 4, credits: 4, course_type: 'Core' },
    { id: 'cs403', course_code: 'CS403', course_name: 'Artificial Intelligence & Machine Learning', department: 'Computer Science', programme: 'B.E. Computer Science and Engineering', semester_number: 4, credits: 4, course_type: 'Core' },
    { id: 'cs404', course_code: 'CS404', course_name: 'Web Technologies Lab', department: 'Computer Science', programme: 'B.E. Computer Science and Engineering', semester_number: 4, credits: 2, course_type: 'Laboratory' },
  ];
  courses.push(...courseList);

  // 3. Faculty (5 users)
  const facultyRaw = [
    {
      id: 'fac_1',
      user_id: 'usr_fac_1',
      username: 'faculty_rajesh',
      email: 'rajesh.sharma@university.edu',
      faculty_code: 'FAC-CSE-001',
      first_name: 'Rajesh',
      last_name: 'Sharma',
      mobile_number: '+91 98765 43210',
      department: 'Computer Science and Engineering',
      designation: 'Professor & Head of Department',
      qualification: 'Ph.D in Computer Science, M.Tech',
      specialization: 'Distributed Systems, Cloud Architecture',
      institution: 'University College of Engineering',
      university: 'State Technological University',
      date_of_joining: '2015-06-15',
      date_of_birth: '1978-04-12',
      address: 'Staff Quarters Q-12, University Campus',
      working_status: 'Active' as const,
      assignedCourses: ['cs301', 'cs302'],
    },
    {
      id: 'fac_2',
      user_id: 'usr_fac_2',
      username: 'faculty_priya',
      email: 'priya.natarajan@university.edu',
      faculty_code: 'FAC-CSE-002',
      first_name: 'Priya',
      last_name: 'Natarajan',
      mobile_number: '+91 98451 23456',
      department: 'Computer Science and Engineering',
      designation: 'Associate Professor',
      qualification: 'Ph.D in Machine Learning, M.E',
      specialization: 'Artificial Intelligence, Deep Learning',
      institution: 'University College of Engineering',
      university: 'State Technological University',
      date_of_joining: '2018-07-01',
      date_of_birth: '1984-09-23',
      address: 'Block B-402, Green Meadows Avenue',
      working_status: 'Active' as const,
      assignedCourses: ['cs403', 'cs202'],
    },
    {
      id: 'fac_3',
      user_id: 'usr_fac_3',
      username: 'faculty_amit',
      email: 'amit.patel@university.edu',
      faculty_code: 'FAC-CSE-003',
      first_name: 'Amit',
      last_name: 'Patel',
      mobile_number: '+91 97123 45678',
      department: 'Computer Science and Engineering',
      designation: 'Assistant Professor (Senior Grade)',
      qualification: 'M.Tech in Cyber Security, (Ph.D)',
      specialization: 'Computer Networks, Network Security',
      institution: 'University College of Engineering',
      university: 'State Technological University',
      date_of_joining: '2020-01-10',
      date_of_birth: '1989-11-05',
      address: 'Flat 103, Skyline Heights',
      working_status: 'Active' as const,
      assignedCourses: ['cs401', 'cs404'],
    },
    {
      id: 'fac_4',
      user_id: 'usr_fac_4',
      username: 'faculty_sunita',
      email: 'sunita.rao@university.edu',
      faculty_code: 'FAC-CSE-004',
      first_name: 'Sunita',
      last_name: 'Rao',
      mobile_number: '+91 99887 76655',
      department: 'Computer Science and Engineering',
      designation: 'Associate Professor',
      qualification: 'Ph.D in Theoretical Computer Science',
      specialization: 'Automata Theory, Algorithms',
      institution: 'University College of Engineering',
      university: 'State Technological University',
      date_of_joining: '2016-08-20',
      date_of_birth: '1982-03-18',
      address: '74/2, Lake View Road',
      working_status: 'Active' as const,
      assignedCourses: ['cs402', 'cs303'],
    },
    {
      id: 'fac_5',
      user_id: 'usr_fac_5',
      username: 'faculty_karthik',
      email: 'karthik.v@university.edu',
      faculty_code: 'FAC-CSE-005',
      first_name: 'Karthik',
      last_name: 'Venkataraman',
      mobile_number: '+91 96543 21098',
      department: 'Mathematics & Computing',
      designation: 'Assistant Professor',
      qualification: 'Ph.D in Applied Mathematics',
      specialization: 'Discrete Mathematics, Optimization',
      institution: 'University College of Engineering',
      university: 'State Technological University',
      date_of_joining: '2021-09-01',
      date_of_birth: '1991-06-30',
      address: 'Villa 18, Palm Residency',
      working_status: 'Active' as const,
      assignedCourses: ['cs101', 'cs201'],
    },
  ];

  for (const f of facultyRaw) {
    users.push({
      id: f.user_id,
      username: f.username,
      email: f.email,
      role: 'FACULTY',
      status: 'Active',
      created_at: now,
      updated_at: now,
    });
    faculty.push({
      id: f.id,
      user_id: f.user_id,
      faculty_code: f.faculty_code,
      first_name: f.first_name,
      last_name: f.last_name,
      email: f.email,
      mobile_number: f.mobile_number,
      department: f.department,
      designation: f.designation,
      qualification: f.qualification,
      specialization: f.specialization,
      institution: f.institution,
      university: f.university,
      date_of_joining: f.date_of_joining,
      date_of_birth: f.date_of_birth,
      address: f.address,
      working_status: f.working_status,
      created_at: now,
      updated_at: now,
    });

    // Map faculty courses
    f.assignedCourses.forEach((cId, idx) => {
      facultyCourses.push({
        id: `fc_${f.id}_${cId}`,
        faculty_id: f.id,
        course_id: cId,
        semester_id: 'sem_4',
        academic_year: '2024-2025',
      });
    });
  }

  // 4. Students (20 Diverse Students)
  const studentProfiles = [
    {
      reg: '24CSE001',
      name: 'Arun Kumar',
      email: 'arun.k@student.university.edu',
      gender: 'Male' as const,
      profile: 'top_performer',
      assignedFac: 'fac_1',
      cgpaTarget: 9.3,
      attendanceRate: 0.96,
      arrears: 0,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE002',
      name: 'Ravi Shankar',
      email: 'ravi.s@student.university.edu',
      gender: 'Male' as const,
      profile: 'high_risk',
      assignedFac: 'fac_1',
      cgpaTarget: 5.4,
      attendanceRate: 0.68,
      arrears: 3,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE003',
      name: 'Priya Sundaram',
      email: 'priya.s@student.university.edu',
      gender: 'Female' as const,
      profile: 'arrear_student',
      assignedFac: 'fac_2',
      cgpaTarget: 6.8,
      attendanceRate: 0.83,
      arrears: 1,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE004',
      name: 'Sneha Patel',
      email: 'sneha.p@student.university.edu',
      gender: 'Female' as const,
      profile: 'attendance_shortage',
      assignedFac: 'fac_1',
      cgpaTarget: 7.9,
      attendanceRate: 0.71,
      arrears: 0,
      status: 'Shortage of Attendance' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE005',
      name: 'Vikram Aditya',
      email: 'vikram.a@student.university.edu',
      gender: 'Male' as const,
      profile: 'declining',
      assignedFac: 'fac_2',
      cgpaTarget: 6.5,
      attendanceRate: 0.77,
      arrears: 1,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE006',
      name: 'Divya Krishnan',
      email: 'divya.k@student.university.edu',
      gender: 'Female' as const,
      profile: 'improving',
      assignedFac: 'fac_3',
      cgpaTarget: 8.1,
      attendanceRate: 0.92,
      arrears: 0,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE007',
      name: 'Rahul Menon',
      email: 'rahul.m@student.university.edu',
      gender: 'Male' as const,
      profile: 'sports_achiever',
      assignedFac: 'fac_3',
      cgpaTarget: 7.1,
      attendanceRate: 0.84,
      arrears: 0,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE008',
      name: 'Ananya Sharma',
      email: 'ananya.s@student.university.edu',
      gender: 'Female' as const,
      profile: 'excellent',
      assignedFac: 'fac_1',
      cgpaTarget: 8.9,
      attendanceRate: 0.94,
      arrears: 0,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE009',
      name: 'Karthik Raja',
      email: 'karthik.r@student.university.edu',
      gender: 'Male' as const,
      profile: 'average',
      assignedFac: 'fac_2',
      cgpaTarget: 7.2,
      attendanceRate: 0.86,
      arrears: 0,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE010',
      name: 'Meera Nambiar',
      email: 'meera.n@student.university.edu',
      gender: 'Female' as const,
      profile: 'high_risk',
      assignedFac: 'fac_4',
      cgpaTarget: 5.7,
      attendanceRate: 0.72,
      arrears: 2,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE011',
      name: 'Sandeep Varma',
      email: 'sandeep.v@student.university.edu',
      gender: 'Male' as const,
      profile: 'graduated',
      assignedFac: 'fac_1',
      cgpaTarget: 8.6,
      attendanceRate: 0.91,
      arrears: 0,
      status: 'Completed' as const,
      progStatus: 'Degree Awarded' as const,
    },
    {
      reg: '24CSE012',
      name: 'Pooja Hegde',
      email: 'pooja.h@student.university.edu',
      gender: 'Female' as const,
      profile: 'lateral_entry',
      assignedFac: 'fac_3',
      cgpaTarget: 8.0,
      attendanceRate: 0.89,
      arrears: 0,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE013',
      name: 'Gautam Das',
      email: 'gautam.d@student.university.edu',
      gender: 'Male' as const,
      profile: 'good',
      assignedFac: 'fac_4',
      cgpaTarget: 7.6,
      attendanceRate: 0.88,
      arrears: 0,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE014',
      name: 'Harini Balan',
      email: 'harini.b@student.university.edu',
      gender: 'Female' as const,
      profile: 'top_performer',
      assignedFac: 'fac_2',
      cgpaTarget: 9.1,
      attendanceRate: 0.95,
      arrears: 0,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE015',
      name: 'Naveen Kumar',
      email: 'naveen.k@student.university.edu',
      gender: 'Male' as const,
      profile: 'attendance_shortage',
      assignedFac: 'fac_4',
      cgpaTarget: 6.9,
      attendanceRate: 0.69,
      arrears: 1,
      status: 'Shortage of Attendance' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE016',
      name: 'Swathi Reddy',
      email: 'swathi.r@student.university.edu',
      gender: 'Female' as const,
      profile: 'good',
      assignedFac: 'fac_5',
      cgpaTarget: 8.2,
      attendanceRate: 0.93,
      arrears: 0,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE017',
      name: 'Abhishek Roy',
      email: 'abhishek.r@student.university.edu',
      gender: 'Male' as const,
      profile: 'declining',
      assignedFac: 'fac_5',
      cgpaTarget: 6.4,
      attendanceRate: 0.78,
      arrears: 2,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE018',
      name: 'Kavya Srinivasan',
      email: 'kavya.s@student.university.edu',
      gender: 'Female' as const,
      profile: 'excellent',
      assignedFac: 'fac_5',
      cgpaTarget: 8.8,
      attendanceRate: 0.94,
      arrears: 0,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE019',
      name: 'Manoj Prasad',
      email: 'manoj.p@student.university.edu',
      gender: 'Male' as const,
      profile: 'average',
      assignedFac: 'fac_2',
      cgpaTarget: 7.3,
      attendanceRate: 0.85,
      arrears: 0,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
    {
      reg: '24CSE020',
      name: 'Bhavana Iyer',
      email: 'bhavana.i@student.university.edu',
      gender: 'Female' as const,
      profile: 'good',
      assignedFac: 'fac_1',
      cgpaTarget: 8.3,
      attendanceRate: 0.90,
      arrears: 0,
      status: 'Continuing' as const,
      progStatus: 'Active' as const,
    },
  ];

  studentProfiles.forEach((sp, idx) => {
    const sId = `stu_${idx + 1}`;
    const uId = `usr_stu_${idx + 1}`;
    const username = sp.reg.toLowerCase();

    users.push({
      id: uId,
      username,
      email: sp.email,
      role: 'STUDENT',
      status: 'Active',
      created_at: now,
      updated_at: now,
    });

    const isGraduated = sp.profile === 'graduated';
    const isLateral = sp.profile === 'lateral_entry';

    students.push({
      id: sId,
      user_id: uId,
      register_number: sp.reg,
      admission_number: `ADM2023${100 + idx}`,
      student_name: sp.name,
      date_of_birth: `2004-0${(idx % 9) + 1}-15`,
      gender: sp.gender,
      abc_id: `ABC-${700000000000 + idx}`,
      umis_number: `UMIS2023CSE0${idx + 1}`,
      email: sp.email,
      mobile_number: `+91 91234 567${idx < 10 ? '0' + idx : idx}`,
      admission_type: isLateral ? 'Lateral Entry' : 'Regular',
      programme: 'B.E. Computer Science and Engineering',
      programme_short_name: 'B.E. CSE',
      branch: 'Computer Science and Engineering',
      branch_code: 'CSE',
      department: 'Computer Science and Engineering',
      batch: isGraduated ? '2021-2025' : '2023-2027',
      year_of_admission: isGraduated ? 2021 : 2023,
      current_status: sp.status,
      programme_status: sp.progStatus,
      degree_awarded_month_year: isGraduated ? 'May 2025' : undefined,
      student_fees_status: idx % 6 === 0 ? 'Pending' : 'Paid',
      readmitted_category: 'No',
      address: `${12 + idx}, Anna Salai, Main Road, Chennai, Tamil Nadu`,
      assigned_faculty_id: sp.assignedFac,
      created_at: now,
      updated_at: now,
    });

    // Student Course Mapping for active semester (Sem 4) and past semesters
    const enrolledCourses = ['cs401', 'cs402', 'cs403', 'cs404'];
    enrolledCourses.forEach((cId) => {
      studentCourses.push({
        id: `sc_${sId}_${cId}`,
        student_id: sId,
        course_id: cId,
        semester_id: 'sem_4',
        academic_year: '2024-2025',
      });
    });

    // 5. Generate Attendance records (15 dates across current semester)
    const dates = [
      '2025-01-10', '2025-01-15', '2025-01-20', '2025-01-25', '2025-02-01',
      '2025-02-05', '2025-02-10', '2025-02-15', '2025-02-20', '2025-02-25',
      '2025-03-01', '2025-03-05', '2025-03-10', '2025-03-15', '2025-03-20',
    ];

    enrolledCourses.forEach((cId) => {
      dates.forEach((d, dIdx) => {
        // determine presence based on target attendance rate
        const isPresent = ((idx * 7 + dIdx * 13) % 100) / 100 < sp.attendanceRate;
        attendance.push({
          id: `att_${sId}_${cId}_${dIdx}`,
          student_id: sId,
          course_id: cId,
          date: d,
          status: isPresent ? 'Present' : 'Absent',
          marked_by: sp.assignedFac,
          created_at: now,
          updated_at: now,
        });
      });
    });

    // 6. Generate Internal Marks (Internal Test 1, Internal Test 2, Assignment, Quiz)
    enrolledCourses.forEach((cId) => {
      const baseMark = Math.min(98, Math.max(35, Math.round(sp.cgpaTarget * 9.5 + ((idx * 3) % 8) - 4)));
      const mark1 = Math.min(50, Math.max(18, Math.round((baseMark / 100) * 50 + ((dIdxScore(idx, cId, 1)) % 6) - 3)));
      const mark2 = Math.min(50, Math.max(16, Math.round((baseMark / 100) * 50 + ((dIdxScore(idx, cId, 2)) % 6) - 2)));
      const assignMark = Math.min(20, Math.max(12, Math.round((baseMark / 100) * 20)));

      internalMarks.push({
        id: `im_${sId}_${cId}_it1`,
        student_id: sId,
        course_id: cId,
        assessment_name: 'Internal Assessment Test 1',
        assessment_type: 'Internal Test',
        marks_obtained: mark1,
        maximum_marks: 50,
        entered_by: sp.assignedFac,
        created_at: now,
        updated_at: now,
      });

      internalMarks.push({
        id: `im_${sId}_${cId}_it2`,
        student_id: sId,
        course_id: cId,
        assessment_name: 'Internal Assessment Test 2',
        assessment_type: 'Internal Test',
        marks_obtained: mark2,
        maximum_marks: 50,
        entered_by: sp.assignedFac,
        created_at: now,
        updated_at: now,
      });

      internalMarks.push({
        id: `im_${sId}_${cId}_asg`,
        student_id: sId,
        course_id: cId,
        assessment_name: 'Continuous Assignment & Case Study',
        assessment_type: 'Assignment',
        marks_obtained: assignMark,
        maximum_marks: 20,
        entered_by: sp.assignedFac,
        created_at: now,
        updated_at: now,
      });
    });

    // 7. Generate Past Semester Results (Sem 1, Sem 2, Sem 3)
    // Sem 1
    generateSemesterResultEntries(semesterResults, sId, 'sem_1', '2023-2024', [
      { cId: 'cs101', cr: 4, pt: getGradePointForProfile(sp.profile, 1, 0, sp.cgpaTarget) },
      { cId: 'cs102', cr: 3, pt: getGradePointForProfile(sp.profile, 1, 1, sp.cgpaTarget) },
      { cId: 'cs103', cr: 3, pt: getGradePointForProfile(sp.profile, 1, 2, sp.cgpaTarget) },
    ]);

    // Sem 2
    generateSemesterResultEntries(semesterResults, sId, 'sem_2', '2023-2024', [
      { cId: 'cs201', cr: 4, pt: getGradePointForProfile(sp.profile, 2, 0, sp.cgpaTarget) },
      { cId: 'cs202', cr: 4, pt: getGradePointForProfile(sp.profile, 2, 1, sp.cgpaTarget) },
      { cId: 'cs203', cr: 3, pt: getGradePointForProfile(sp.profile, 2, 2, sp.cgpaTarget) },
    ]);

    // Sem 3
    generateSemesterResultEntries(semesterResults, sId, 'sem_3', '2024-2025', [
      { cId: 'cs301', cr: 4, pt: getGradePointForProfile(sp.profile, 3, 0, sp.cgpaTarget) },
      { cId: 'cs302', cr: 4, pt: getGradePointForProfile(sp.profile, 3, 1, sp.cgpaTarget) },
      { cId: 'cs303', cr: 4, pt: getGradePointForProfile(sp.profile, 3, 2, sp.cgpaTarget) },
      { cId: 'cs304', cr: 3, pt: getGradePointForProfile(sp.profile, 3, 3, sp.cgpaTarget) },
    ]);

    // 8. Achievements
    if (sp.cgpaTarget >= 8.5 || sp.profile === 'sports_achiever' || idx % 2 === 0) {
      achievements.push({
        id: `ach_${sId}_1`,
        student_id: sId,
        title: sp.profile === 'sports_achiever' ? 'State Level Badminton Championship - Gold' : 'National Smart India Hackathon - Finalist',
        category: sp.profile === 'sports_achiever' ? 'Sports' : 'Hackathon',
        description: sp.profile === 'sports_achiever' ? 'Won 1st place in Inter-University Badminton Tournament representing the institution.' : 'Built an automated smart agriculture telemetry system for farmers.',
        achievement_date: '2024-11-12',
        organization: sp.profile === 'sports_achiever' ? 'State Sports Authority' : 'Ministry of Education Innovation Cell',
        certificate_file: 'cert_sih2024_arun.pdf',
        verification_status: 'Verified',
        verified_by: sp.assignedFac,
        created_at: now,
        updated_at: now,
      });
    }

    if (sp.cgpaTarget >= 8.0) {
      achievements.push({
        id: `ach_${sId}_2`,
        student_id: sId,
        title: 'AWS Certified Cloud Practitioner (CLF-C02)',
        category: 'Certification',
        description: 'Successfully achieved global certification demonstrating foundational cloud architecture expertise.',
        achievement_date: '2025-01-20',
        organization: 'Amazon Web Services',
        certificate_file: 'aws_cert_cloud.pdf',
        verification_status: 'Verified',
        verified_by: sp.assignedFac,
        created_at: now,
        updated_at: now,
      });
    }
  });

  // 9. Initial Audit Logs
  auditLogs.push(
    {
      id: 'audit_init_1',
      user_id: 'usr_fac_1',
      role: 'FACULTY',
      user_name: 'Dr. Rajesh Sharma',
      action: 'UPDATE_ATTENDANCE_BATCH',
      entity_type: 'ATTENDANCE',
      entity_id: 'cs301',
      new_value: 'Recorded attendance for 20 students in Database Management Systems',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      ip_address: '192.168.1.101',
    },
    {
      id: 'audit_init_2',
      user_id: 'usr_fac_2',
      role: 'FACULTY',
      user_name: 'Dr. Priya Natarajan',
      action: 'UPDATE_INTERNAL_MARK',
      entity_type: 'INTERNAL_MARK',
      entity_id: 'im_stu_1_cs403_it1',
      new_value: 'Updated AI/ML Internal Test 1 score to 48/50 for Arun Kumar',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      ip_address: '192.168.1.105',
    },
    {
      id: 'audit_init_3',
      user_id: 'usr_fac_1',
      role: 'FACULTY',
      user_name: 'Dr. Rajesh Sharma',
      action: 'VERIFY_ACHIEVEMENT',
      entity_type: 'ACHIEVEMENT',
      entity_id: 'ach_stu_1_1',
      new_value: 'Verified Smart India Hackathon Finalist Certificate for Arun Kumar',
      timestamp: new Date(Date.now() - 43200000).toISOString(),
      ip_address: '192.168.1.101',
    }
  );

  // 10. Institutional Regulations for RAG
  regulations.push(
    {
      id: 'reg_1',
      category: 'Attendance',
      title: 'Minimum Attendance Requirement & Shortage Condonation Rules',
      document_code: 'REG-2023-CLAUSE-4.2',
      clause_reference: 'Section 4.2.1 - 4.2.4',
      effective_year: '2023-2027',
      content: `A student who has secured attendance of less than 75% overall or in any individual course in a semester shall not be permitted to appear for the end-semester examinations of that course. Condonation of shortage of attendance between 65% and 74.99% may be granted by the Academic Council on valid medical grounds (certified by a registered medical practitioner) or institutional representation in recognized sports/cultural/technical events with prior approval. Students with attendance below 65% must repeat the semester courses when offered next.`,
    },
    {
      id: 'reg_2',
      category: 'Grading',
      title: 'Letter Grading Scale, Grade Points, and Calculation of SGPA/CGPA',
      document_code: 'REG-2023-CLAUSE-7.1',
      clause_reference: 'Section 7.1 - 7.3',
      effective_year: '2023-2027',
      content: `Academic performance is assessed using a 10-point letter grading scale:
- Grade 'O' (Outstanding): 10 Grade Points (Marks >= 90)
- Grade 'A+' (Excellent): 9 Grade Points (Marks 80 - 89)
- Grade 'A' (Very Good): 8 Grade Points (Marks 70 - 79)
- Grade 'B+' (Good): 7 Grade Points (Marks 60 - 69)
- Grade 'B' (Above Average): 6 Grade Points (Marks 50 - 59)
- Grade 'C' (Pass): 5 Grade Points (Marks 45 - 49)
- Grade 'U' / 'RA' (Re-Appearance / Fail): 0 Grade Points (Marks < 45)

SGPA Formula: Sum(Credits * Grade Points) / Sum(Credits in Semester).
CGPA Formula: Sum(Credits * Grade Points across all completed Semesters) / Total Credits Earned.`,
    },
    {
      id: 'reg_3',
      category: 'Arrears',
      title: 'Arrear Examinations, Re-evaluation, and Remedial Fast-Track System',
      document_code: 'REG-2023-CLAUSE-8.3',
      clause_reference: 'Section 8.3.1 - 8.3.5',
      effective_year: '2023-2027',
      content: `A student who obtains a 'U' (Re-Appearance / Fail) grade in a course has an active arrear. Arrear examinations are conducted concurrently during regular end-semester examination periods (Odd semester arrears in Odd examination cycles, Even semester arrears in Even examination cycles, and supplementary fast-track exams for final-year students). Students with more than 3 active arrears are placed on academic monitoring and must attend mandatory remedial bridge courses conducted by departmental faculty.`,
    },
    {
      id: 'reg_4',
      category: 'Examinations',
      title: 'Internal Assessment Weightage and End-Semester Evaluation Framework',
      document_code: 'REG-2023-CLAUSE-6.1',
      clause_reference: 'Section 6.1 - 6.4',
      effective_year: '2023-2027',
      content: `Evaluation consists of Continuous Internal Assessment (CIA - 40% weightage) and End-Semester Examinations (ESE - 60% weightage). CIA consists of two written Internal Assessment Tests (50 marks each, converted to 20%), Assignments/Quizzes (10%), and Attendance/Active Participation (10%). A student must score a minimum of 45% in the End-Semester Examination and 50% in the aggregate (CIA + ESE) to obtain a passing grade.`,
    },
    {
      id: 'reg_5',
      category: 'Code of Conduct',
      title: 'Student Academic Integrity, Malpractice Penalties, and Grievance Redressal',
      document_code: 'REG-2023-CLAUSE-12.0',
      clause_reference: 'Section 12.1 - 12.4',
      effective_year: '2023-2027',
      content: `Possession of unauthorized materials or digital devices during examinations leads to immediate cancellation of all registered courses in the semester and debarment for up to one academic year. Academic disputes or evaluation discrepancies must be appealed through the Departmental Grievance Committee within 7 working days of grade publication.`,
    }
  );

  return {
    users,
    faculty,
    students,
    courses,
    semesters,
    facultyCourses,
    studentCourses,
    attendance,
    internalMarks,
    semesterResults,
    achievements,
    auditLogs,
    regulations,
  };
}

function dIdxScore(idx: number, cId: string, testNo: number): number {
  return (idx * 17 + cId.charCodeAt(2) * 3 + testNo * 7) % 10;
}

function getGradePointForProfile(profile: string, semNo: number, courseIdx: number, target: number): number {
  if (profile === 'top_performer') {
    return [10, 10, 9, 9][(semNo + courseIdx) % 4];
  }
  if (profile === 'excellent') {
    return [9, 9, 8, 9][(semNo + courseIdx) % 4];
  }
  if (profile === 'high_risk') {
    // Has failed grades (0 / U)
    if (semNo === 3 && courseIdx === 1) return 0; // failed OS
    if (semNo === 2 && courseIdx === 0) return 0; // failed Discrete Math
    if (semNo === 3 && courseIdx === 2) return 0; // failed Algo
    return 5;
  }
  if (profile === 'arrear_student') {
    if (semNo === 3 && courseIdx === 2) return 0; // 1 arrear
    return [7, 7, 8, 6][courseIdx % 4];
  }
  if (profile === 'declining') {
    if (semNo === 1) return 9;
    if (semNo === 2) return 7;
    if (semNo === 3) return courseIdx === 0 ? 0 : 6;
    return 6;
  }
  if (profile === 'improving') {
    if (semNo === 1) return 6;
    if (semNo === 2) return 7;
    if (semNo === 3) return [9, 8, 9, 8][courseIdx % 4];
    return 8;
  }
  // Standard mapped by target
  const diff = (courseIdx % 3) - 1;
  const base = Math.round(target) + diff;
  return Math.min(10, Math.max(5, base));
}

function generateSemesterResultEntries(
  list: SemesterResultRecord[],
  studentId: string,
  semId: string,
  year: string,
  entries: Array<{ cId: string; cr: number; pt: number }>
) {
  entries.forEach((e, idx) => {
    let grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'U' = 'B';
    if (e.pt === 10) grade = 'O';
    else if (e.pt === 9) grade = 'A+';
    else if (e.pt === 8) grade = 'A';
    else if (e.pt === 7) grade = 'B+';
    else if (e.pt === 6) grade = 'B';
    else if (e.pt === 5) grade = 'C';
    else if (e.pt === 0) grade = 'U';

    list.push({
      id: `sr_${studentId}_${semId}_${e.cId}`,
      student_id: studentId,
      semester_id: semId,
      course_id: e.cId,
      grade,
      grade_point: e.pt,
      credits: e.cr,
      result_status: e.pt > 0 ? 'Pass' : 'Fail',
      academic_year: year,
      published_date: semId === 'sem_1' ? '2024-01-10' : semId === 'sem_2' ? '2024-06-15' : '2025-01-12',
    });
  });
}
