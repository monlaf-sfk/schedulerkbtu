import { useMemo } from 'react';
import { 
  parseCourseFormula, 
  countSectionsByType, 
  findTimeConflicts 
} from '../utils/schedule';
import type { 
  CourseData, 
  EnrichedSection, 
  Schedule, 
  SmartRecommendation,
  SectionType 
} from '../types';

interface UseSmartRecommendationsReturn {
  readonly recommendations: readonly SmartRecommendation[];
  readonly applyRecommendation: (recommendation: SmartRecommendation) => Record<number, boolean>;
}

export const useSmartRecommendations = (
  courses: readonly CourseData[],
  allSections: readonly EnrichedSection[],
  currentSchedule: Schedule | undefined
): UseSmartRecommendationsReturn => {
  
  const recommendations = useMemo((): readonly SmartRecommendation[] => {
    if (!currentSchedule || courses.length === 0) return [];

    const { selectedSectionIds } = currentSchedule;
    const selectedSections = allSections.filter(s => selectedSectionIds[s.id]);
    const recommendations: SmartRecommendation[] = [];

    courses.forEach(course => {
      const limits = parseCourseFormula(course.formula);
      const currentCounts = countSectionsByType(selectedSections, course.code);
      const availableSections = allSections.filter(s => 
        s.courseCode === course.code && !selectedSectionIds[s.id]
      );

      const neededSections = generateNeededSections(
        availableSections,
        currentCounts,
        limits
      );

      if (neededSections.length > 0) {
        recommendations.push({
          type: 'completion_suggestion',
          title: `Завершить курс ${course.code}`,
          description: `Добавьте недостающие секции для полного курса`,
          suggestedSections: neededSections,
          score: calculateCompletionScore(currentCounts, limits)
        });
      }
    });

    const optimizationSuggestions = generateOptimizationSuggestions(
      selectedSections,
      allSections,
      selectedSectionIds
    );
    
    if (optimizationSuggestions.length > 0) {
      recommendations.push({
        type: 'optimal_schedule',
        title: 'Оптимизировать расписание',
        description: 'Сгруппировать занятия для более компактного расписания',
        suggestedSections: optimizationSuggestions,
        score: 70
      });
    }

    const conflictResolution = generateConflictResolution(
      selectedSections,
      allSections,
      selectedSectionIds
    );

    if (conflictResolution.length > 0) {
      recommendations.push({
        type: 'conflict_resolution',
        title: 'Разрешить конфликты времени',
        description: 'Заменить конфликтующие секции на альтернативные',
        suggestedSections: conflictResolution,
        score: 95
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }, [courses, allSections, currentSchedule]);

  const applyRecommendation = useMemo(() => 
    (recommendation: SmartRecommendation): Record<number, boolean> => {
      if (!currentSchedule) return {};

      const newSelection = { ...currentSchedule.selectedSectionIds };

      if (recommendation.type === 'conflict_resolution') {
        const selectedSections = allSections.filter(s => newSelection[s.id]);
        const conflicts = findTimeConflicts(selectedSections);
        
        conflicts.forEach(sections => {
          sections.slice(1).forEach(section => {
            delete newSelection[section.id];
          });
        });
      }

      recommendation.suggestedSections.forEach(sectionId => {
        newSelection[sectionId] = true;
      });

      return newSelection;
    }, [currentSchedule, allSections]
  );

  return {
    recommendations,
    applyRecommendation
  };
};

 
function generateNeededSections(
  availableSections: readonly EnrichedSection[],
  currentCounts: { lectures: number; labs: number; practices: number },
  limits: { maxLectures: number; maxLabs: number; maxPractices: number }
): number[] {
  const neededSections: number[] = [];
  
  const sectionTypeMap: Record<SectionType, { current: number; max: number }> = {
    'Лекция': { current: currentCounts.lectures, max: limits.maxLectures },
    'Лабораторная': { current: currentCounts.labs, max: limits.maxLabs },
    'Практика': { current: currentCounts.practices, max: limits.maxPractices }
  };

  Object.entries(sectionTypeMap).forEach(([type, { current, max }]) => {
    if (current < max) {
      const needed = max - current;
      const available = availableSections
        .filter(s => s.type === type as SectionType)
        .slice(0, needed);
      neededSections.push(...available.map(s => s.id));
    }
  });

  return neededSections;
}

function calculateCompletionScore(
  currentCounts: { lectures: number; labs: number; practices: number },
  limits: { maxLectures: number; maxLabs: number; maxPractices: number }
): number {
  const totalCurrent = currentCounts.lectures + currentCounts.labs + currentCounts.practices;
  const totalMax = limits.maxLectures + limits.maxLabs + limits.maxPractices;
  
  if (totalMax === 0) return 0;
  
  const completionRatio = totalCurrent / totalMax;
  return Math.round(60 + (completionRatio * 40));  
}

function generateOptimizationSuggestions(
  selectedSections: readonly EnrichedSection[],
  allSections: readonly EnrichedSection[],
  selectedSectionIds: Record<number, boolean>
): number[] {
  const busyDays = new Set(selectedSections.map(s => s.day));
  
  return allSections
    .filter(section => {
      if (selectedSectionIds[section.id]) return false;
      
      const sameCourseSelected = selectedSections.find(s => 
        s.courseCode === section.courseCode && s.type === section.type
      );
      
      if (sameCourseSelected) {
        return busyDays.has(section.day) && !busyDays.has(sameCourseSelected.day);
      }
      
      return false;
    })
    .slice(0, 3)
    .map(s => s.id);
}

function generateConflictResolution(
  selectedSections: readonly EnrichedSection[],
  allSections: readonly EnrichedSection[],
  selectedSectionIds: Record<number, boolean>
): number[] {
  const conflicts = findTimeConflicts(selectedSections);
  const alternativeSections: number[] = [];
  
  conflicts.forEach((conflictingSections, timeSlot) => {
    conflictingSections.forEach(conflictSection => {
      const alternatives = allSections.filter(s => 
        s.courseCode === conflictSection.courseCode &&
        s.type === conflictSection.type &&
        s.id !== conflictSection.id &&
        !selectedSectionIds[s.id] &&
        `${s.day}_${s.time}` !== timeSlot
      );
      
      if (alternatives.length > 0) {
        alternativeSections.push(alternatives[0].id);
      }
    });
  });

  return alternativeSections;
}