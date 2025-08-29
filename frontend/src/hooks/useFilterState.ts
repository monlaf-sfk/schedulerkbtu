import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { EnrichedSection, FilterState, DayOfWeek, SectionType } from '../types';

interface FilterOptions {
  readonly days: readonly DayOfWeek[];
  readonly timeRanges: readonly string[];
  readonly teachers: readonly string[];
  readonly rooms: readonly string[];
  readonly types: readonly SectionType[];
  readonly courses: readonly string[];
}

interface UseFilterStateReturn {
  readonly filterState: FilterState;
  readonly hiddenCourses: ReadonlySet<string>;
  readonly filteredSections: readonly EnrichedSection[];
  readonly filterOptions: FilterOptions;
  readonly toggleFilter: (category: keyof FilterState, value: string) => void;
  readonly toggleCourseVisibility: (courseCode: string) => void;
  readonly clearAllFilters: () => void;
  readonly hasActiveFilters: boolean;
}

const EMPTY_FILTER_STATE: FilterState = {
  days: new Set(),
  timeRanges: new Set(),
  teachers: new Set(),
  rooms: new Set(),
  types: new Set(),
  courses: new Set()
};

const TIME_RANGES = [
  '08:00-10:00',
  '10:00-12:00', 
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00'
] as const;

export const useFilterState = (allSections: readonly EnrichedSection[]): UseFilterStateReturn => {
  const [filterState, setFilterState] = useState<FilterState>(EMPTY_FILTER_STATE);
  const [hiddenCourses, setHiddenCourses] = useLocalStorage<string[]>('hidden_courses', []);

  const hiddenCoursesSet = useMemo(() => new Set(hiddenCourses), [hiddenCourses]);

  // Извлекаем уникальные значения для фильтров
  const filterOptions = useMemo((): FilterOptions => {
    const visibleSections = allSections.filter(s => !hiddenCoursesSet.has(s.courseCode));
    
    return {
      days: [...new Set(visibleSections.map(s => s.day))].sort() as DayOfWeek[],
      timeRanges: TIME_RANGES,
      teachers: [...new Set(visibleSections.map(s => s.teacher))].sort(),
      rooms: [...new Set(visibleSections.map(s => s.room))].sort(),
      types: [...new Set(visibleSections.map(s => s.type))].sort() as SectionType[],
      courses: [...new Set(visibleSections.map(s => s.courseCode))].sort()
    };
  }, [allSections, hiddenCoursesSet]);

  // Применяем фильтры
  const filteredSections = useMemo((): readonly EnrichedSection[] => {
    let filtered = allSections.filter(s => !hiddenCoursesSet.has(s.courseCode));

    if (filterState.days.size > 0) {
      filtered = filtered.filter(s => filterState.days.has(s.day));
    }
    
    if (filterState.timeRanges.size > 0) {
      filtered = filtered.filter(s => {
        const sectionHour = parseInt(s.time.split(':')[0]);
        return Array.from(filterState.timeRanges).some(range => {
          const [start, end] = range.split('-').map(t => parseInt(t.split(':')[0]));
          return sectionHour >= start && sectionHour < end;
        });
      });
    }
    
    if (filterState.teachers.size > 0) {
      filtered = filtered.filter(s => filterState.teachers.has(s.teacher));
    }
    
    if (filterState.rooms.size > 0) {
      filtered = filtered.filter(s => filterState.rooms.has(s.room));
    }
    
    if (filterState.types.size > 0) {
      filtered = filtered.filter(s => filterState.types.has(s.type));
    }
    
    if (filterState.courses.size > 0) {
      filtered = filtered.filter(s => filterState.courses.has(s.courseCode));
    }

    return filtered;
  }, [allSections, filterState, hiddenCoursesSet]);

  const toggleFilter = useCallback((category: keyof FilterState, value: string) => {
    setFilterState(prev => {
      const categorySet = new Set(prev[category]);
      
      if (categorySet.has(value)) {
        categorySet.delete(value);
      } else {
        categorySet.add(value);
      }
      
      return {
        ...prev,
        [category]: categorySet
      };
    });
  }, []);

  const toggleCourseVisibility = useCallback((courseCode: string) => {
    setHiddenCourses(prev => 
      prev.includes(courseCode)
        ? prev.filter(code => code !== courseCode)
        : [...prev, courseCode]
    );
  }, [setHiddenCourses]);

  const clearAllFilters = useCallback(() => {
    setFilterState(EMPTY_FILTER_STATE);
  }, []);

  const hasActiveFilters = useMemo(() => 
    Object.values(filterState).some(set => set.size > 0),
    [filterState]
  );

  return {
    filterState,
    hiddenCourses: hiddenCoursesSet,
    filteredSections,
    filterOptions,
    toggleFilter,
    toggleCourseVisibility,
    clearAllFilters,
    hasActiveFilters
  };
};