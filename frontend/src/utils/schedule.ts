import type {
  CourseData,
  EnrichedSection,
  Schedule,
  ConflictInfo,
  CourseLimits,
  CourseSelectionCounts,
  DayOfWeek
} from '../types';

/**
 * Parses course formula string into limits object
 */
export const parseCourseFormula = (formula: string): CourseLimits => {
  const [maxLectures = 0, maxLabs = 0, maxPractices = 0] = formula
    .split('/')
    .map(Number);

  return {
    maxLectures,
    maxLabs,
    maxPractices
  };
};

/**
 * Counts selected sections by type for a specific course
 */
export const countSectionsByType = (
  sections: readonly EnrichedSection[],
  courseCode: string
): CourseSelectionCounts => {
  const courseSections = sections.filter(s => s.courseCode === courseCode);

  return {
    lectures: courseSections.filter(s => s.type === 'Лекция').length,
    labs: courseSections.filter(s => s.type === 'Лабораторная').length,
    practices: courseSections.filter(s => s.type === 'Практика').length,
  };
};

/**
 * Checks if adding a section would violate course limits
 */
export const wouldViolateLimits = (
  section: EnrichedSection,
  selectedSections: readonly EnrichedSection[],
  course: CourseData
): boolean => {
  const limits = parseCourseFormula(course.formula);
  const currentCounts = countSectionsByType(selectedSections, course.code);

  switch (section.type) {
    case 'Лекция':
      return currentCounts.lectures >= limits.maxLectures;
    case 'Лабораторная':
      return currentCounts.labs >= limits.maxLabs;
    case 'Практика':
      return currentCounts.practices >= limits.maxPractices;
    default:
      return false;
  }
};

/**
 * Checks if a section can be selected based on adjacent slot rules for multi-hour lectures
 */
export const canSelectSection = (
  section: EnrichedSection,
  selectedSections: readonly EnrichedSection[]
): boolean => {
  if (section.type === 'Лекция' && section.duration >= 1) {
    const courseCode = section.courseCode;
    const selectedLectures = selectedSections.filter(s =>
      s.courseCode === courseCode && s.type === 'Лекция'
    );

    if (selectedLectures.length === 0) {
      return true;  
    }

   
    const sectionTime = parseTime(section.time);
    const sectionDay = section.day;

    return selectedLectures.some(selectedLecture => {
      if (selectedLecture.day !== sectionDay) return false;

      const selectedTime = parseTime(selectedLecture.time);
      const selectedEnd = selectedTime + selectedLecture.duration;
      const sectionEnd = sectionTime + section.duration;

     
      return (selectedEnd === sectionTime) || (sectionEnd === selectedTime);
    });
  }

  return true;  
};

/**
 * Gets available adjacent sections for a multi-hour lecture
 */
export const getAdjacentLectureOptions = (
  courseCode: string,
  selectedLectures: readonly EnrichedSection[],
  allLectures: readonly EnrichedSection[]
): EnrichedSection[] => {
  if (selectedLectures.length === 0) {
    return allLectures.filter(l => l.courseCode === courseCode && l.type === 'Лекция');
  }

  const adjacentOptions: EnrichedSection[] = [];

  selectedLectures.forEach(selectedLecture => {
    const selectedTime = parseTime(selectedLecture.time);
    const selectedEnd = selectedTime + selectedLecture.duration;
    const selectedDay = selectedLecture.day;

 
    allLectures.forEach(lecture => {
      if (lecture.courseCode !== courseCode || lecture.type !== 'Лекция') return;
      if (selectedLectures.some(s => s.id === lecture.id)) return;  
      if (lecture.day !== selectedDay) return;  

      const lectureTime = parseTime(lecture.time);
      const lectureEnd = lectureTime + lecture.duration;

 
      if (selectedEnd === lectureTime || lectureEnd === selectedTime) {
        adjacentOptions.push(lecture);
      }
    });
  });

  return adjacentOptions;
};

/**
 * Finds time conflicts in selected sections considering duration
 */
export const findTimeConflicts = (
  sections: readonly EnrichedSection[]
): Map<string, EnrichedSection[]> => {
  const conflicts = new Map<string, EnrichedSection[]>();

 
  const sectionsByDay = new Map<DayOfWeek, EnrichedSection[]>();
  sections.forEach(section => {
    const daySections = sectionsByDay.get(section.day) || [];
    sectionsByDay.set(section.day, [...daySections, section]);
  });

  
  sectionsByDay.forEach((daySections, day) => {
    for (let i = 0; i < daySections.length; i++) {
      for (let j = i + 1; j < daySections.length; j++) {
        const section1 = daySections[i];
        const section2 = daySections[j];

        if (sectionsOverlap(section1, section2)) {
          const key = `${day}_conflict_${Math.min(section1.id, section2.id)}_${Math.max(section1.id, section2.id)}`;
          conflicts.set(key, [section1, section2]);
        }
      }
    }
  });

  return conflicts;
};

/**
 * Checks if two sections overlap in time
 */
const sectionsOverlap = (section1: EnrichedSection, section2: EnrichedSection): boolean => {
  if (section1.day !== section2.day) return false;

  const start1 = parseTime(section1.time);
  const end1 = start1 + section1.duration;
  const start2 = parseTime(section2.time);
  const end2 = start2 + section2.duration;

  return start1 < end2 && start2 < end1;
};

/**
 * Parses time string to hour number
 */
const parseTime = (time: string): number => {
  return parseInt(time.split(':')[0]);
};

/**
 * Generates a unique schedule ID
 */
export const generateScheduleId = (): string => {
  return `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Checks if a time falls within a time range
 */
export const isTimeInRange = (time: string, range: string): boolean => {
  const [start, end] = range.split('-');
  const timeHour = parseInt(time.split(':')[0]);
  const startHour = parseInt(start.split(':')[0]);
  const endHour = parseInt(end.split(':')[0]);

  return timeHour >= startHour && timeHour < endHour;
};

/**
 * Safely creates a new schedule object
 */
export const createSchedule = (name: string): Schedule => {
  const now = new Date();
  return {
    id: generateScheduleId(),
    name: name.trim(),
    selectedSectionIds: {},
    createdAt: now,
    updatedAt: now
  };
};

/**
 * Updates schedule with new section selections
 */
export const updateScheduleSelections = (
  schedule: Schedule,
  selectedSectionIds: Record<number, boolean>
): Schedule => ({
  ...schedule,
  selectedSectionIds: { ...selectedSectionIds },
  updatedAt: new Date()
});

/**
 * Formats date for display
 */
export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    
    if (isNaN(dateObj.getTime())) {
      return 'Неверная дата';
    }

    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Неверная дата';
  }
};

/**
 * Formats time for display
 */
export const formatTime = (hour: number): string => {
  return `${String(hour).padStart(2, '0')}:00`;
};

/**
 * Gets sections for a specific day, sorted by time
 */
export const getSectionsForDay = (
  sections: readonly EnrichedSection[],
  day: DayOfWeek
): EnrichedSection[] => {
  return sections
    .filter(section => section.day === day)
    .sort((a, b) => a.time.localeCompare(b.time));
};

/**
 * Calculates schedule statistics
 */
export const calculateScheduleStats = (
  schedule: Schedule,
  allSections: readonly EnrichedSection[],
  conflicts: readonly ConflictInfo[]
) => {
  const selectedSections = allSections.filter(s => schedule.selectedSectionIds[s.id]);

  return {
    totalSections: selectedSections.length,
    totalConflicts: conflicts.length,
    highPriorityConflicts: conflicts.filter(c => c.severity === 'high').length,
    uniqueCourses: new Set(selectedSections.map(s => s.courseCode)).size
  };
};