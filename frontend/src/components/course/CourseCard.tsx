import clsx from 'clsx';
import { BookOpen, Users, FlaskConical } from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { EnrichedSection } from '../../types';
import { getSectionGradientStyles } from '../../utils/colors';
 


interface CourseCardProps {
  section: EnrichedSection;
  columnIndex: number;
  totalColumns: number;
  compactTop?: number;
  compactHeight?: number;
  isSelected: boolean;
  isConflicted: boolean;
  isDeactivated: boolean;
  onClick: () => void;
}
const typeMapping: { [key: string]: string } = { 
  "Лекция": "Л", 
  "Практика": "П", 
  "Лабораторная": "Лаб" 
};

const typeIcons: { [key: string]: React.ReactNode } = {
  "Лекция": <BookOpen size={12} />,
  "Практика": <Users size={12} />,
  "Лабораторная": <FlaskConical size={12} />
};

import { SCHEDULE_GRID } from '../../constants/schedule';

const { HOUR_HEIGHT_PIXELS, START_HOUR, HEADER_OFFSET } = SCHEDULE_GRID;
export const CourseCard: React.FC<CourseCardProps> = React.memo(({ section, columnIndex, totalColumns, isSelected, isConflicted, isDeactivated, onClick }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [mousePos, setMousePos] = useState<{x: number, y: number}>({x: 0, y: 0});
  const timeStart = parseInt(section.time.split(':')[0]);
  const duration = section.duration || 1;  
  const top = (timeStart - START_HOUR) * HOUR_HEIGHT_PIXELS + HEADER_OFFSET;
  const height = duration * HOUR_HEIGHT_PIXELS;
  let width = '100%';
  let left = '0';
  if (totalColumns > 1) {
    width = `${100 / totalColumns}%`;
    left = `${(100 / totalColumns) * columnIndex}%`;
  } 
  if (isNaN(timeStart)) return null;
  const isVacant = section.teacher === "N/A";
  const displayText = {
    teacher: isVacant ? "Вакансия" : section.teacher,
    type: isVacant ? "Тип: -" : `Тип: ${section.type}`,
    room: isVacant ? "Ауд: -" : `Ауд: ${section.room}`,
  };
  let sectionState: 'normal' | 'selected' | 'disabled' | 'conflict' = 'normal';
  if (isConflicted) sectionState = 'conflict';
  else if (isSelected) sectionState = 'selected';
  else if (isDeactivated) sectionState = 'disabled';
  const sectionStyles = isVacant 
    ? { 
        background: 'linear-gradient(135deg, #525252 0%, #404040 100%)', 
        borderColor: '#6b7280', 
        borderWidth: '2px', 
        borderStyle: 'solid' 
      }
    : getSectionGradientStyles(section.courseCode, section.type as any, sectionState);

  return (
    <div
      onClick={isDeactivated ? undefined : onClick}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
      className={clsx(
        "absolute text-white p-2 rounded-xl overflow-hidden text-left transition-all duration-200 z-10 shadow-lg border flex flex-col",
        {
          'cursor-pointer': !isDeactivated,
          'cursor-not-allowed': isDeactivated,
          'ring-2 ring-emerald-400/80': isSelected && !isVacant,
          'ring-2 ring-red-400/80': isConflicted,
          'hover:scale-[1.01] hover:shadow-xl': !isDeactivated && !isSelected,
          'opacity-60': isDeactivated,
        }
      )}
      style={{
        top: `${top}px`,
        height: `${height - 4}px`,
    width,
    left,
        marginLeft: '2px',
        boxShadow: isSelected
          ? '0 8px 20px -5px rgba(16, 185, 129, 0.25)'
          : '0 4px 12px -2px rgba(0, 0, 0, 0.15)',
        transform: isSelected ? 'scale(1.01)' : 'scale(1)',
        ...sectionStyles,
      }}
    >
      {/* Заголовок с кодом курса и типом */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-sm leading-tight drop-shadow-sm tracking-wide truncate flex-1">
          {section.courseCode}
        </h3>
        <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-semibold bg-black/20 text-white/90 border border-white/10 backdrop-blur-sm ml-1 flex-shrink-0">
          {typeIcons[section.type]}
          <span className="hidden sm:inline">{typeMapping[section.type]}</span>
        </span>
      </div>
      
      {/* Информация о занятии */}
      <div className="space-y-0.5 flex-1">
        <p className="text-xs text-white/90 leading-tight font-medium">
          {displayText.teacher}
        </p>
        <p className="text-xs text-white/75 leading-tight ">
          {displayText.room}
        </p>
      </div>
      
      {/* Время и продолжительность */}
      <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/10">
        {duration > 1 && (
          <span className="text-xs bg-black/25 px-1.5 py-0.5 rounded-md text-amber-300 font-semibold border border-amber-400/20">
            {duration}ч
          </span>
        )}
      </div>
      
      {/* Индикатор многочасового занятия */}
      {duration > 1 && (
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full shadow-lg" 
             style={{ height: `${Math.min(duration * 20, 60)}px` }} />
      )}
      
      {/* Детальная информация при наведении */}
      {showDetails && createPortal(
        <div
          className="fixed min-w-[240px] max-w-[320px] bg-gradient-to-br from-slate-900/98 to-slate-950/98 text-slate-200 rounded-xl shadow-2xl border border-slate-600/50 p-4 z-[9999] backdrop-blur-md"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y + 16,
            transition: 'all 0.2s ease-out',
            opacity: showDetails ? 1 : 0,
            transform: showDetails ? 'translateY(0)' : 'translateY(-8px)',
          }}
        >
          <div className="font-bold text-base mb-3 text-emerald-400 border-b border-slate-700/50 pb-2">
            {section.courseName || section.courseCode}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Тип:</span>
              <span className="text-slate-200">{section.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Преподаватель:</span>
              <span className="text-slate-200 text-right max-w-[160px]">{section.teacher}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Аудитория:</span>
              <span className="text-slate-200">{section.room}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Время:</span>
              <span className="text-slate-200">{section.day} {section.time}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});