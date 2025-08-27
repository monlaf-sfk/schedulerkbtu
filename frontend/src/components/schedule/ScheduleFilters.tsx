import React, { useState } from 'react';
import { Filter, X, Clock, MapPin, User, BookOpen } from 'lucide-react';
import type { EnrichedSection } from '../../types';

interface FilterOptions {
  days: string[];
  timeRanges: string[];
  teachers: string[];
  rooms: string[];
  types: string[];
  courses: string[];
}

interface ScheduleFiltersProps {
  allSections: EnrichedSection[];
  onFiltersChange: (filteredSections: EnrichedSection[]) => void;
}

export const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({
  allSections,
  onFiltersChange
}) => {
  const [activeFilters, setActiveFilters] = useState<{
    days: Set<string>;
    timeRanges: Set<string>;
    teachers: Set<string>;
    rooms: Set<string>;
    types: Set<string>;
    courses: Set<string>;
  }>({
    days: new Set(),
    timeRanges: new Set(),
    teachers: new Set(),
    rooms: new Set(),
    types: new Set(),
    courses: new Set()
  });

  // Извлекаем уникальные значения для фильтров
  const filterOptions: FilterOptions = React.useMemo(() => {
    const days = [...new Set(allSections.map(s => s.day))].sort();
    const teachers = [...new Set(allSections.map(s => s.teacher))].sort();
    const rooms = [...new Set(allSections.map(s => s.room))].sort();
    const types = [...new Set(allSections.map(s => s.type))].sort();
    const courses = [...new Set(allSections.map(s => s.courseCode))].sort();
    
    // Группируем время по диапазонам
    const timeRanges = [
      '08:00-10:00',
      '10:00-12:00', 
      '12:00-14:00',
      '14:00-16:00',
      '16:00-18:00',
      '18:00-20:00'
    ];

    return { days, timeRanges, teachers, rooms, types, courses };
  }, [allSections]);


  // Применяем фильтры
  const getFilteredSectionsWith = (filters: typeof activeFilters) => {
    let filtered = allSections;
    if (filters.days.size > 0) {
      filtered = filtered.filter(s => filters.days.has(s.day));
    }
    if (filters.timeRanges.size > 0) {
      filtered = filtered.filter(s => {
        const sectionHour = parseInt(s.time.split(':')[0]);
        return Array.from(filters.timeRanges).some(range => {
          const [start, end] = range.split('-').map(t => parseInt(t.split(':')[0]));
          return sectionHour >= start && sectionHour < end;
        });
      });
    }
    if (filters.teachers.size > 0) {
      filtered = filtered.filter(s => filters.teachers.has(s.teacher));
    }
    if (filters.rooms.size > 0) {
      filtered = filtered.filter(s => filters.rooms.has(s.room));
    }
    if (filters.types.size > 0) {
      filtered = filtered.filter(s => filters.types.has(s.type));
    }
    if (filters.courses.size > 0) {
      filtered = filtered.filter(s => filters.courses.has(s.courseCode));
    }
    return filtered;
  };

  React.useEffect(() => {
    onFiltersChange(getFilteredSectionsWith(activeFilters));
  }, [activeFilters, allSections, onFiltersChange]);

  const toggleFilter = (category: keyof typeof activeFilters, value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      const categorySet = new Set(newFilters[category]);
      
      if (categorySet.has(value)) {
        categorySet.delete(value);
      } else {
        categorySet.add(value);
      }
      
      newFilters[category] = categorySet;
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({
      days: new Set(),
      timeRanges: new Set(),
      teachers: new Set(),
      rooms: new Set(),
      types: new Set(),
      courses: new Set()
    });
  };

  const getTotalActiveFilters = () => {
    return Object.values(activeFilters).reduce((sum, set) => sum + set.size, 0);
  };

  const FilterSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    items: string[];
    category: keyof typeof activeFilters;
  }> = ({ title, icon, items, category }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-1">
        {icon}
        <span>{title}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(item => {
          const isActive = activeFilters[category].has(item);
          return (
            <button
              key={item}
              onClick={() => toggleFilter(category, item)}
              className={`px-3 py-1 rounded-full text-xs font-medium shadow transition-colors border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-neutral-700 text-gray-300 hover:bg-blue-700 hover:text-white border-neutral-700'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Modal-friendly layout
  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Filter size={24} />
          Фильтры расписания
        </h2>
        {getTotalActiveFilters() > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-3 py-1 rounded-lg transition-colors border border-transparent hover:border-blue-600 bg-neutral-800"
          >
            <X size={16} />
            Очистить
          </button>
        )}
      </div>
      <div className="space-y-6">
        <FilterSection
          title="Дни недели"
          icon={<BookOpen size={18} />}
          items={filterOptions.days}
          category="days"
        />
        <FilterSection
          title="Время"
          icon={<Clock size={18} />}
          items={filterOptions.timeRanges}
          category="timeRanges"
        />
        <FilterSection
          title="Типы занятий"
          icon={<BookOpen size={18} />}
          items={filterOptions.types}
          category="types"
        />
        <FilterSection
          title="Курсы"
          icon={<BookOpen size={18} />}
          items={filterOptions.courses}
          category="courses"
        />
        {filterOptions.teachers.length > 0 && (
          <FilterSection
            title="Преподаватели"
            icon={<User size={18} />}
            items={filterOptions.teachers.slice(0, 10)}
            category="teachers"
          />
        )}
        {filterOptions.rooms.length > 0 && (
          <FilterSection
            title="Аудитории"
            icon={<MapPin size={18} />}
            items={filterOptions.rooms.slice(0, 10)}
            category="rooms"
          />
        )}
      </div>
    </div>
  );
};