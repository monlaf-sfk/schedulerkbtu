import React, { memo } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { CourseData, Schedule } from '../../types';

interface CourseItemProps {
  readonly course: CourseData;
  readonly activeSchedule?: Schedule;
  readonly isHidden: boolean;
  readonly onToggleVisibility: (courseCode: string) => void;
}

export const CourseItem: React.FC<CourseItemProps> = memo(({
  course,
  activeSchedule,
  isHidden,
  onToggleVisibility
}) => {
  // Проверка полноты выбора курса
  const isFullySelected = React.useMemo(() => {
    if (!activeSchedule?.selectedSectionIds || !course.sections || !course.formula) {
      return false;
    }
    
    const selectedSections = course.sections.filter(s => activeSchedule.selectedSectionIds[s.id]);
    const [maxLectures = 0, maxLabs = 0, maxPractices = 0] = course.formula.split('/').map(Number);
    const counts = selectedSections.reduce((acc, s) => {
      if (s.type === 'Лекция') acc.lectures++;
      else if (s.type === 'Лабораторная') acc.labs++;
      else if (s.type === 'Практика') acc.practices++;
      return acc;
    }, { lectures: 0, labs: 0, practices: 0 });
    
    return counts.lectures >= maxLectures && counts.labs >= maxLabs && counts.practices >= maxPractices;
  }, [activeSchedule, course]);

  const handleToggleVisibility = React.useCallback(() => {
    onToggleVisibility(course.code);
  }, [course.code, onToggleVisibility]);

  return (
    <div
      className={`bg-gradient-to-r from-slate-800/60 to-slate-700/60 border border-slate-600/40 p-4 rounded-xl flex items-center justify-between transition-all duration-200 hover:border-slate-500/60 shadow-lg ${
        isHidden && isFullySelected ? 'opacity-60 border-2 border-emerald-500/70' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate">{course.code}</p>
        <p className="text-sm text-slate-200 truncate">{course.name}</p>
        <p className="text-xs text-slate-300">{course.formula}</p>
      </div>
      <button
        title={isHidden ? 'Показать курс в расписании' : 'Скрыть курс из расписания'}
        onClick={handleToggleVisibility}
        className="ml-2 p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors duration-200 flex-shrink-0"
      >
        {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
});

CourseItem.displayName = 'CourseItem';