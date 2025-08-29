import React, { useMemo } from 'react';
import { DayColumn } from "./DayColumn";
import { canSelectSection } from "../../utils/schedule";
import { SCHEDULE_GRID } from '../../constants/schedule';
import type { CourseData, EnrichedSection } from "../../types";

const DAY_MAPPING: Record<string, string> = {
  "Понедельник": "Пн", 
  "Вторник": "Вт", 
  "Среда": "Ср", 
  "Четверг": "Чт", 
  "Пятница": "Пт", 
  "Суббота": "Сб",
  "Воскресенье": "Вс"
} as const;

const DAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"] as const;

const { HOUR_HEIGHT_PIXELS, START_HOUR, END_HOUR, HEADER_OFFSET } = SCHEDULE_GRID;

interface ScheduleGridProps {
  readonly courses: readonly CourseData[];
  readonly allSections: readonly EnrichedSection[];
  readonly selectedSectionIds: Readonly<Record<number, boolean>>;
  readonly onSectionSelect: (section: EnrichedSection) => void;
  readonly isFinalView: boolean;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ 
  courses, 
  allSections, 
  selectedSectionIds, 
  onSectionSelect, 
  isFinalView 
}) => {
  // ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ В НАЧАЛЕ КОМПОНЕНТА
  
  // Мемоизированные выбранные секции
  const selectedSections = useMemo(() => 
    allSections.filter(s => selectedSectionIds[s.id]),
    [allSections, selectedSectionIds]
  );

  // Мемоизированные секции для отображения
  const sectionsToDisplay = useMemo(() => 
    isFinalView ? selectedSections : allSections,
    [isFinalView, selectedSections, allSections]
  );

  // Мемоизированные обогащенные секции
  const enrichedSections = useMemo(() => 
    sectionsToDisplay.map(section => {
      const isSelected = !!selectedSectionIds[section.id];
      
      // Проверяем конфликты с учетом продолжительности
      const hasConflict = !isSelected && selectedSections.some(selectedSection => {
        if (selectedSection.day !== section.day) return false;
        
        const selectedStart = parseInt(selectedSection.time.split(':')[0]);
        const selectedEnd = selectedStart + (selectedSection.duration || 1);
        const sectionStart = parseInt(section.time.split(':')[0]);
        const sectionEnd = sectionStart + (section.duration || 1);
        
        return sectionStart < selectedEnd && selectedStart < sectionEnd;
      });
      
      const parentCourse = courses.find(c => c.code === section.courseCode);
      const [maxLectures = 0, maxLabs = 0, maxPractices = 0] = parentCourse?.formula.split('/').map(Number) || [];
      
      const countForType = selectedSections.filter(s => s.courseCode === section.courseCode && s.type === section.type).length;

      let limitReached = false;
      if (section.type === 'Лекция') limitReached = countForType >= maxLectures;
      if (section.type === 'Лабораторная') limitReached = countForType >= maxLabs;
      if (section.type === 'Практика') limitReached = countForType >= maxPractices;
      
      // Проверяем правило соседних слотов для лекций
      const canSelect = !isSelected && parentCourse ? 
        canSelectSection(section, selectedSections) : true;
      
      const isDeactivated = !isSelected && (limitReached || hasConflict || !canSelect);

      return {
        ...section,
        isSelected,
        isConflicted: hasConflict,
        isDeactivated,
      };
    }),
    [sectionsToDisplay, selectedSectionIds, selectedSections, courses]
  );

  // Мемоизированные часы и высота сетки
  const hours = useMemo(() => 
    Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
    []
  );
  
  const gridHeight = useMemo(() => 
    (hours.length * HOUR_HEIGHT_PIXELS) + HEADER_OFFSET,
    [hours.length]
  );

  // Проверяем есть ли многочасовые лекции
  const hasMultiHourLectures = useMemo(() => 
    enrichedSections.some(s => s.type === 'Лекция' && s.duration >= 2),
    [enrichedSections]
  );

  // Мемоизированные секции по дням
  const sectionsByDay = useMemo(() => 
    DAYS.reduce((acc, day) => {
      acc[day] = enrichedSections.filter(section => section.day === DAY_MAPPING[day]);
      return acc;
    }, {} as Record<string, typeof enrichedSections>),
    [enrichedSections]
  );

  // Пустое состояние
  if (courses.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 border border-slate-600/30 rounded-3xl p-16 shadow-xl max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2"/>
              <path d="M3 8h18"/>
              <path d="M8 12h8"/>
              <path d="M8 16h6"/>
            </svg>
          </div>
          <h3 className="font-bold text-slate-200 text-xl mb-3">Расписание пусто</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Добавьте курсы, чтобы начать создание вашего персонального расписания
          </p>
        </div>
      </div>
    );
  }

    return (
      <div className="space-y-4">
        {/* Информационная панель с правилами */}
        {hasMultiHourLectures && !isFinalView && (
          <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-600/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-sm font-bold">i</span>
              </div>
              <div>
                <h4 className="text-blue-200 font-semibold mb-1">Правила выбора лекций</h4>
                <p className="text-blue-300/80 text-sm">
                  Для лекций длительностью 1+ часа можно выбирать только соседние временные слоты. 
                  Лабораторные и практические занятия отображаются с правильным позиционированием без наложения.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex p-4 bg-gradient-to-br from-slate-900/50 to-slate-950/80 rounded-3xl border border-slate-700/30 shadow-xl">
          {/* Временная шкала */}
          <div className="w-16 flex-shrink-0 relative mr-4" style={{ height: `${gridHeight}px`}}>
            {hours.map(hour => (
              <div 
                key={hour} 
                className="absolute text-xs text-slate-400 font-semibold text-right pr-3 w-full flex items-center justify-end" 
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT_PIXELS + HEADER_OFFSET - 10}px`, height: '20px' }}
              >
                <span className="bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-600/40">
                  {`${String(hour).padStart(2, '0')}:00`}
                </span>
              </div>
            ))}
          </div>
          
          {/* Сетка расписания */}
          <div className="flex-grow grid grid-cols-7 gap-1 relative" style={{ height: `${gridHeight}px`}}>
            {/* Горизонтальные линии времени */}
            <div className="absolute top-0 left-0 right-0 bottom-0 z-0">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="absolute w-full border-t border-slate-600/20" 
                  style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT_PIXELS + HEADER_OFFSET}px` }}
                />
              ))}
            </div>
            
            {/* Колонки дней */}
            {DAYS.map(day => (
              <DayColumn 
                key={day} 
                title={day} 
                sections={sectionsByDay[day]} 
                onSectionSelect={onSectionSelect}
              />
            ))}
          </div>
        </div>
      </div>
    );
};