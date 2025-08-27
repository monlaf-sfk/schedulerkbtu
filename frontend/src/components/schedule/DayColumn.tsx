import React from 'react';
import { CourseCard } from "../course/CourseCard";
import _ from 'lodash';

import type { EnrichedSection } from '../../types';

interface DayColumnProps {
  title: string;
  sections: EnrichedSection[];
  onSectionSelect: (section: EnrichedSection) => void;
}

export const DayColumn: React.FC<DayColumnProps> = React.memo(({ title, sections, onSectionSelect }) => {
  // Создаем карту пересечений для правильного позиционирования секций
  const calculateSectionPositions = (sections: EnrichedSection[]) => {
    const positions = new Map<number, { columnIndex: number; totalColumns: number }>();
    // Сортируем секции по времени начала
    const sortedSections = [...sections].sort((a, b) => {
      const timeA = parseInt(a.time.split(':')[0]);
      const timeB = parseInt(b.time.split(':')[0]);
      return timeA - timeB;
    });
    // Для каждой секции находим максимальное количество пересечений в каждом часу, который она занимает
    sortedSections.forEach((section) => {
      const startTime = parseInt(section.time.split(':')[0]);
      const duration = section.duration || 1;
      let maxOverlapping = 1;
      let minOverlapping = Number.MAX_SAFE_INTEGER;
      let columnIndex = 0;
      let columnIndexHour = startTime;
      // Для каждого часа, который занимает секция
      for (let hour = startTime; hour < startTime + duration; hour++) {
        // Находим все секции, которые занимают этот час
        const overlapping = sortedSections.filter(other => {
          const otherStart = parseInt(other.time.split(':')[0]);
          const otherDuration = other.duration || 1;
          return hour >= otherStart && hour < otherStart + otherDuration;
        });
        if (overlapping.length > maxOverlapping) {
          maxOverlapping = overlapping.length;
        }
        if (overlapping.length < minOverlapping) {
          minOverlapping = overlapping.length;
          columnIndexHour = hour;
        }
      }
      // Для columnIndex: считаем по часу с минимальным количеством пересечений
      const overlappingMinHour = sortedSections.filter(other => {
        const otherStart = parseInt(other.time.split(':')[0]);
        const otherDuration = other.duration || 1;
        return columnIndexHour >= otherStart && columnIndexHour < otherStart + otherDuration;
      });
      overlappingMinHour.sort((a, b) => {
        if (a.type === 'Лабораторная' && b.type !== 'Лабораторная') return -1;
        if (a.type !== 'Лабораторная' && b.type === 'Лабораторная') return 1;
        return a.id - b.id;
      });
      columnIndex = overlappingMinHour.findIndex(s => s.id === section.id);
      positions.set(section.id, { columnIndex, totalColumns: maxOverlapping });
    });
    return positions;
  };

  const sectionPositions = calculateSectionPositions(sections);

  return (
    <div className="relative h-full bg-gradient-to-b from-slate-800/20 to-slate-900/30 border border-slate-600/25 rounded-2xl shadow-lg transition-colors duration-200"> 
      {/* Заголовок дня */}
      <div className="text-center font-bold text-slate-200 mb-2 sticky top-0 bg-gradient-to-b from-slate-800/95 to-slate-900/95 py-3 z-20 rounded-t-2xl border-b border-slate-600/30">
        <span className="text-sm tracking-wide">{title}</span>
      </div>
      
      {/* Карточки занятий */}
      {sections.map((section) => {
        const position = sectionPositions.get(section.id) || { columnIndex: 0, totalColumns: 1 };
        
        return (
          <CourseCard
            key={section.id}
            section={section}
            columnIndex={position.columnIndex} 
            totalColumns={position.totalColumns} 
            isSelected={section.isSelected || false}
            isConflicted={section.isConflicted || false}
            isDeactivated={section.isDeactivated || false}
            onClick={() => onSectionSelect(section)}
          />
        );
      })}
    </div>
  );
});