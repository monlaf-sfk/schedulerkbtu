import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useSmartRecommendations } from './useSmartRecommendations';
import { 
  createSchedule as createScheduleUtil,
  updateScheduleSelections,
  parseCourseFormula,
  countSectionsByType,
  findTimeConflicts
} from '../utils/schedule';
import type { 
  Schedule, 
  CourseData, 
  EnrichedSection, 
  ConflictInfo, 
  CourseAnalysis,
  SmartRecommendation
} from '../types';

interface UseScheduleManagerReturn {
  readonly schedules: readonly Schedule[];
  readonly activeSchedule: Schedule | undefined;
  readonly activeScheduleId: string;
  readonly setActiveScheduleId: (id: string) => void;
  readonly createSchedule: (name: string) => string;
  readonly updateActiveSchedule: (selectedSectionIds: Record<number, boolean>) => void;
  readonly deleteSchedule: (scheduleId: string) => void;
  readonly duplicateSchedule: (scheduleId: string, newName: string) => string | undefined;
  readonly analyzeConflicts: (schedule: Schedule) => readonly ConflictInfo[];
  readonly courseAnalysis: readonly CourseAnalysis[];
  readonly conflicts: readonly ConflictInfo[];
  readonly recommendations: readonly SmartRecommendation[];
  readonly applyRecommendation: (recommendation: SmartRecommendation) => void;
}

export const useScheduleManager = (
  courses: readonly CourseData[], 
  allSections: readonly EnrichedSection[]
): UseScheduleManagerReturn => {
  const [schedules, setSchedules] = useLocalStorage<Schedule[]>('user_schedules', []);
  const [activeScheduleId, setActiveScheduleId] = useLocalStorage<string>('active_schedule_id', '');

  // Мемоизированное активное расписание
  const activeSchedule = useMemo(() => 
    schedules.find(s => s.id === activeScheduleId) || schedules[0],
    [schedules, activeScheduleId]
  );

  // Мемоизированные выбранные секции
  const selectedSections = useMemo(() => 
    activeSchedule ? allSections.filter(s => activeSchedule.selectedSectionIds[s.id]) : [],
    [allSections, activeSchedule]
  );

 
  const createSchedule = useCallback((name: string): string => {
    const newSchedule = createScheduleUtil(name);
    setSchedules(prev => [...prev, newSchedule]);
    setActiveScheduleId(newSchedule.id);
    return newSchedule.id;
  }, [setSchedules, setActiveScheduleId]);

 
  const updateActiveSchedule = useCallback((selectedSectionIds: Record<number, boolean>) => {
    if (!activeSchedule) return;

    setSchedules(prev => prev.map(schedule =>
      schedule.id === activeSchedule.id
        ? updateScheduleSelections(schedule, selectedSectionIds)
        : schedule
    ));
  }, [activeSchedule, setSchedules]);

  // Оптимизированный анализ конфликтов
  const analyzeConflicts = useCallback((schedule: Schedule): readonly ConflictInfo[] => {
    const conflicts: ConflictInfo[] = [];
    const scheduleSections = allSections.filter(s => schedule.selectedSectionIds[s.id]);

    // Анализ временных конфликтов
    const timeConflicts = findTimeConflicts(scheduleSections);
    timeConflicts.forEach((sections, timeSlot) => {
      conflicts.push({
        type: 'time_conflict',
        message: `Конфликт времени: ${sections.map(s => s.courseCode).join(', ')} в ${timeSlot.replace('_', ' ')}`,
        affectedSections: sections.map(s => s.id),
        severity: 'high'
      });
    });

    // Анализ нарушений формул курсов
    courses.forEach(course => {
      const courseSections = scheduleSections.filter(s => s.courseCode === course.code);
      const limits = parseCourseFormula(course.formula);
      const counts = countSectionsByType(scheduleSections, course.code);

      const violations = [
        { type: 'Лекция', current: counts.lectures, max: limits.maxLectures },
        { type: 'Лабораторная', current: counts.labs, max: limits.maxLabs },
        { type: 'Практика', current: counts.practices, max: limits.maxPractices }
      ];

      violations.forEach(({ type, current, max }) => {
        if (current > max) {
          conflicts.push({
            type: 'formula_violation',
            message: `Превышен лимит ${type.toLowerCase()} для ${course.code}: ${current}/${max}`,
            affectedSections: courseSections.filter(s => s.type === type).map(s => s.id),
            severity: 'medium'
          });
        }
      });
    });

    return conflicts;
  }, [allSections, courses]);

  // Мемоизированный анализ курсов
  const courseAnalysis = useMemo((): readonly CourseAnalysis[] => {
    if (!activeSchedule || !selectedSections.length) return [];

    return courses.map(course => {
      const courseSections = selectedSections.filter(s => s.courseCode === course.code);
      const limits = parseCourseFormula(course.formula);
      const currentSelection = countSectionsByType(selectedSections, course.code);

      const violations = analyzeConflicts(activeSchedule).filter(conflict =>
        conflict.affectedSections.some(id =>
          courseSections.some(s => s.id === id)
        )
      );

      return {
        course,
        currentSelection,
        limits,
        violations
      };
    });
  }, [courses, selectedSections, activeSchedule, analyzeConflicts]);

 
  const deleteSchedule = useCallback((scheduleId: string) => {
    setSchedules(prev => {
      const filtered = prev.filter(s => s.id !== scheduleId);
      if (activeScheduleId === scheduleId && filtered.length > 0) {
        setActiveScheduleId(filtered[0].id);
      }
      return filtered;
    });
  }, [setSchedules, activeScheduleId, setActiveScheduleId]);

 
  const duplicateSchedule = useCallback((scheduleId: string, newName: string): string | undefined => {
    const original = schedules.find(s => s.id === scheduleId);
    if (!original) return undefined;

    const duplicate = createScheduleUtil(newName);
    const duplicateWithSelections: Schedule = {
      ...duplicate,
      selectedSectionIds: { ...original.selectedSectionIds }
    };

    setSchedules(prev => [...prev, duplicateWithSelections]);
    return duplicate.id;
  }, [schedules, setSchedules]);
 
  const { recommendations, applyRecommendation } = useSmartRecommendations(
    courses,
    allSections,
    activeSchedule
  );

 
  const handleApplyRecommendation = useCallback((recommendation: SmartRecommendation) => {
    const newSelection = applyRecommendation(recommendation);
    updateActiveSchedule(newSelection);
  }, [applyRecommendation, updateActiveSchedule]);

  // Мемоизированные конфликты
  const conflicts = useMemo(() => 
    activeSchedule ? analyzeConflicts(activeSchedule) : [],
    [activeSchedule, analyzeConflicts]
  );

  return {
    schedules,
    activeSchedule,
    activeScheduleId,
    setActiveScheduleId,
    createSchedule,
    updateActiveSchedule,
    deleteSchedule,
    duplicateSchedule,
    analyzeConflicts,
    courseAnalysis,
    conflicts,
    recommendations,
    applyRecommendation: handleApplyRecommendation
  };
};