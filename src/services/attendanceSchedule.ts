import { DailyAttendanceSession, DayAttendanceSummary, AttendanceRecord, Course, AttendanceDisputeRequest } from '../types/index.js';

export const PERIOD_SCHEDULE = [
  {
    periodNumber: 1,
    timing: '08:45 am to 09:35 am',
    slot: 'Forenoon' as const,
    defaultFaculty: 'Sri Priyanka',
    defaultFacultyCode: 'HU11211',
  },
  {
    periodNumber: 2,
    timing: '09:35 am to 10:25 am',
    slot: 'Forenoon' as const,
    defaultFaculty: 'Sri Priyanka',
    defaultFacultyCode: 'HU11211',
  },
  {
    periodNumber: 3,
    timing: '10:40 am to 11:30 am',
    slot: 'Forenoon' as const,
    defaultFaculty: 'POORNIMA A',
    defaultFacultyCode: 'IS10850',
  },
  {
    periodNumber: 4,
    timing: '11:30 am to 12:20 pm',
    slot: 'Forenoon' as const,
    defaultFaculty: 'POORNIMA A',
    defaultFacultyCode: 'IS10850',
  },
  {
    periodNumber: 5,
    timing: '01:25 pm to 02:15 pm',
    slot: 'Afternoon' as const,
    defaultFaculty: 'Dr. Rajesh K',
    defaultFacultyCode: 'CS10402',
  },
  {
    periodNumber: 6,
    timing: '02:15 pm to 03:05 pm',
    slot: 'Afternoon' as const,
    defaultFaculty: 'Dr. Rajesh K',
    defaultFacultyCode: 'CS10402',
  },
  {
    periodNumber: 7,
    timing: '03:20 pm to 04:10 pm',
    slot: 'Afternoon' as const,
    defaultFaculty: 'Dr. Suresh V',
    defaultFacultyCode: 'CS10115',
  },
];

export const BIOMETRIC_IN_CONFIG = {
  timing: '08:00 am to 08:35 am',
  slot: 'Biometric Morning' as const,
  terminal: 'Biometric Terminal #02 (Gate 1 - Main Entrance)',
  punchTime: '08:24:15 AM',
};

export const BIOMETRIC_OUT_CONFIG = {
  timing: '04:15 pm to 04:45 pm',
  slot: 'Biometric Evening' as const,
  terminal: 'Biometric Terminal #05 (Gate 2 - Academic Block)',
  punchTime: '04:22:40 PM',
};

// Storage keys for local session customizations
const DISPUTES_STORAGE_KEY = 'erp_attendance_disputes';
const FACULTY_PERIOD_STORAGE_KEY = 'erp_faculty_period_attendance';

export function getStoredDisputes(): AttendanceDisputeRequest[] {
  try {
    const raw = localStorage.getItem(DISPUTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDisputeRequest(dispute: AttendanceDisputeRequest): void {
  try {
    const list = getStoredDisputes();
    list.unshift(dispute);
    localStorage.setItem(DISPUTES_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save dispute:', err);
  }
}

export function getStoredFacultyPeriodMarkings(): Record<string, 'Present' | 'Absent' | 'On Duty' | 'Late'> {
  try {
    const raw = localStorage.getItem(FACULTY_PERIOD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveFacultyPeriodMarking(
  key: string, // `${studentId}_${date}_p${periodNumber}`
  status: 'Present' | 'Absent' | 'On Duty' | 'Late'
): void {
  try {
    const existing = getStoredFacultyPeriodMarkings();
    existing[key] = status;
    localStorage.setItem(FACULTY_PERIOD_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save faculty period marking:', err);
  }
}

/**
 * Format Date to YYYY-MM-DD
 */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format Date to DD/MM/YYYY (Bitsathy PCDP portal display format)
 */
export function formatDatePCDP(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format Date to readable string like "Tuesday, 13 October 2026"
 */
export function formatFullDayHeader(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generate 7 Periods + 2 Biometrics daily register for a student on a specific date.
 */
export function buildDailySessionsForDate(
  studentId: string,
  dateStr: string,
  courses: Course[],
  existingAttendance: AttendanceRecord[]
): DailyAttendanceSession[] {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
  const isSunday = dayOfWeek === 0;

  const facultyPeriodMarkings = getStoredFacultyPeriodMarkings();

  // Find if there is any database attendance record for this student on this date
  const recordsOnDate = existingAttendance.filter((a) => a.student_id === studentId && a.date === dateStr);
  const dbStatusMap = new Map<string, 'Present' | 'Absent'>(
    recordsOnDate.map((r) => [r.course_id, r.status])
  );

  // Derive pseudo-random consistency based on studentId and date hash
  const hash = studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) +
    dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const sessions: DailyAttendanceSession[] = [];

  // 1. Biometric In
  const bioInKey = `${studentId}_${dateStr}_bio_in`;
  const bioInStatus = isSunday ? 'Absent' : (facultyPeriodMarkings[bioInKey] || 'Present');
  sessions.push({
    id: `session_${dateStr}_bio_in`,
    type: 'biometric_in',
    timing: BIOMETRIC_IN_CONFIG.timing,
    slot: BIOMETRIC_IN_CONFIG.slot,
    markedBy: BIOMETRIC_IN_CONFIG.terminal,
    status: bioInStatus,
    timestamp: isSunday ? undefined : BIOMETRIC_IN_CONFIG.punchTime,
    actionAvailable: false,
  });

  // 2. Periods 1 to 7
  PERIOD_SCHEDULE.forEach((p, idx) => {
    const courseIndex = idx % Math.max(1, courses.length);
    const course = courses[courseIndex];
    const pKey = `${studentId}_${dateStr}_p${p.periodNumber}`;

    let status: 'Present' | 'Absent' | 'On Duty' | 'Late' = 'Present';

    if (isSunday) {
      status = 'Absent';
    } else if (facultyPeriodMarkings[pKey]) {
      status = facultyPeriodMarkings[pKey];
    } else if (course && dbStatusMap.has(course.id)) {
      status = dbStatusMap.get(course.id)!;
    } else {
      // Deterministic fallback based on hash so a day is consistently present or absent
      const isAbsentSlot = ((hash * 7 + idx * 11) % 100) > 92;
      status = isAbsentSlot ? 'Absent' : 'Present';
    }

    sessions.push({
      id: `session_${dateStr}_p${p.periodNumber}`,
      type: 'period',
      periodNumber: p.periodNumber,
      timing: p.timing,
      slot: p.slot,
      courseCode: course ? course.course_code : `CS${301 + idx}`,
      courseName: course ? course.course_name : `Course Period ${p.periodNumber}`,
      markedBy: `${p.defaultFaculty} ${p.defaultFacultyCode}`,
      facultyCode: p.defaultFacultyCode,
      status,
      timestamp: dateStr,
      actionAvailable: true,
    });
  });

  // 3. Biometric Out
  const bioOutKey = `${studentId}_${dateStr}_bio_out`;
  const bioOutStatus = isSunday ? 'Absent' : (facultyPeriodMarkings[bioOutKey] || 'Present');
  sessions.push({
    id: `session_${dateStr}_bio_out`,
    type: 'biometric_out',
    timing: BIOMETRIC_OUT_CONFIG.timing,
    slot: BIOMETRIC_OUT_CONFIG.slot,
    markedBy: BIOMETRIC_OUT_CONFIG.terminal,
    status: bioOutStatus,
    timestamp: isSunday ? undefined : BIOMETRIC_OUT_CONFIG.punchTime,
    actionAvailable: false,
  });

  return sessions;
}

/**
 * Generate month calendar days with attendance indicators
 */
export function buildMonthCalendarDays(
  studentId: string,
  year: number,
  month: number, // 0-indexed (0 = Jan, 9 = Oct)
  courses: Course[],
  existingAttendance: AttendanceRecord[]
): DayAttendanceSummary[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result: DayAttendanceSummary[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month, d);
    const dayOfWeekIdx = dateObj.getDay();
    const dayOfWeekName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

    if (dayOfWeekIdx === 0) {
      // Sunday = Weekend
      result.push({
        date: dateStr,
        dayOfWeek: dayOfWeekName,
        dayNumber: d,
        totalPeriods: 7,
        presentPeriods: 0,
        absentPeriods: 7,
        biometricIn: false,
        biometricOut: false,
        status: 'WEEKEND',
      });
      continue;
    }

    const sessions = buildDailySessionsForDate(studentId, dateStr, courses, existingAttendance);
    const periodSessions = sessions.filter((s) => s.type === 'period');
    const presentCount = periodSessions.filter((s) => s.status === 'Present' || s.status === 'On Duty').length;
    const absentCount = periodSessions.length - presentCount;

    let dayStatus: DayAttendanceSummary['status'] = 'FULL_PRESENT';
    if (presentCount === 0) {
      dayStatus = 'ABSENT';
    } else if (presentCount < 7) {
      dayStatus = 'PARTIAL';
    }

    result.push({
      date: dateStr,
      dayOfWeek: dayOfWeekName,
      dayNumber: d,
      totalPeriods: 7,
      presentPeriods: presentCount,
      absentPeriods: absentCount,
      biometricIn: sessions.some((s) => s.type === 'biometric_in' && s.status === 'Present'),
      biometricOut: sessions.some((s) => s.type === 'biometric_out' && s.status === 'Present'),
      status: dayStatus,
    });
  }

  return result;
}
