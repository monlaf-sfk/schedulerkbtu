import React from 'react';
import { Filter, X, Clock, MapPin, User, BookOpen } from 'lucide-react';
import type { FilterState } from '../../types';

interface ScheduleFiltersProps {
  readonly filterState: FilterState;
  readonly filterOptions: {
    readonly days: readonly string[];
    readonly timeRanges: readonly string[];
    readonly teachers: readonly string[];
    readonly rooms: readonly string[];
    readonly types: readonly string[];
    readonly courses: readonly string[];
  };
  readonly onToggleFilter: (category: keyof FilterState, value: string) => void;
  readonly onClearFilters: () => void;
  readonly hasActiveFilters: boolean;
}

export const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({
  filterState,
  filterOptions,
  onToggleFilter,
  onClearFilters,
  hasActiveFilters
}) => {

  const FilterSection = <T extends keyof FilterState>({
    title,
    icon,
    items,
    category
  }: {
    title: string;
    icon: React.ReactNode;
    items: readonly string[];
    category: T;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-1">
        {icon}
        <span>{title}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(item => {
          const isActive = (filterState[category] as ReadonlySet<string>).has(item);
          return (
            <button
              key={item}
              onClick={() => onToggleFilter(category, item)}
              className={`px-3 py-1 rounded-full text-xs font-medium shadow transition-colors border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive
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
      <div className="mb-6 flex items-center justify-start gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Filter size={24} />
          Фильтры расписания
        </h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-3 py-4 rounded-lg transition-colors border border-transparent hover:border-blue-600 bg-neutral-800"
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