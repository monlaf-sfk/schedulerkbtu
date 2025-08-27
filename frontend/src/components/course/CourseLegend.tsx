import React from 'react';
import { BookOpen, Users, FlaskConical } from 'lucide-react';
import type { CourseData, SectionType } from '../../types';
import { getCourseLegendColor, getCourseLegendBackgroundColor } from '../../utils/colors';

interface CourseLegendProps {
  courses: readonly CourseData[];
}

const typeIcons: Record<SectionType, React.ReactNode> = {
  'Лекция': <BookOpen size={14} />,
  'Практика': <Users size={14} />,
  'Лабораторная': <FlaskConical size={14} />,
};

const typeLabels: Record<SectionType, string> = {
  'Лекция': 'Лекции',
  'Практика': 'Практики', 
  'Лабораторная': 'Лабы',
};

export const CourseLegend: React.FC<CourseLegendProps> = ({ courses }) => {
  if (courses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-emerald-400 text-sm">Легенда курсов</h4>
      
      <div className="space-y-2">
        {courses.map(course => {
          const mainColor = getCourseLegendColor(course.code);
          const bgColor = getCourseLegendBackgroundColor(course.code);
          
          return (
            <div key={course.code} className="space-y-1">
              {/* Заголовок курса */}
              <div 
                className="flex items-center gap-3 p-3 rounded-xl text-sm font-semibold border shadow-lg transition-all duration-200 hover:shadow-xl"
                style={{ 
                  background: `linear-gradient(135deg, ${bgColor}15, ${bgColor}25)`,
                  borderLeft: `4px solid ${mainColor}`,
                  borderColor: mainColor + '40'
                }}
              >
                <div 
                  className="w-4 h-4 rounded-full shadow-lg"
                  style={{ backgroundColor: mainColor }}
                />
                <span className="text-slate-200">{course.code}</span>
                <span className="text-slate-300/80 text-xs truncate">{course.name}</span>
              </div>
              
              {/* Типы занятий */}
              <div className="ml-4 space-y-1">
                {(['Лекция', 'Практика', 'Лабораторная'] as SectionType[]).map(type => {
                  const hasType = course.sections.some(s => s.type === type);
                  if (!hasType) return null;
                  
                  // Разные оттенки для разных типов
                  const typeIntensity = type === 'Лекция' ? 0.4 : type === 'Практика' ? 0.6 : 0.8;
                  const typeColor = `${mainColor}${Math.round(typeIntensity * 255).toString(16).padStart(2, '0')}`;
                  
                  return (
                    <div key={type} className="flex items-center gap-2 text-xs text-slate-300">
                      <div 
                        className="w-2 h-2 rounded-sm shadow-sm"
                        style={{ backgroundColor: typeColor }}
                      />
                      <span className="flex items-center gap-1 font-medium">
                        {typeIcons[type]}
                        {typeLabels[type]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Общая легенда состояний */}
      <div className="pt-3 border-t border-slate-600/40">
        <h5 className="text-xs font-semibold text-emerald-400 mb-3">Состояния</h5>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded border-2 border-emerald-400 bg-emerald-600 shadow-sm" />
            <span className="text-slate-300 font-medium">Выбрано</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded border-2 border-red-400 bg-red-600 shadow-sm" />
            <span className="text-slate-300 font-medium">Конфликт</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded bg-slate-500 opacity-70 shadow-sm" />
            <span className="text-slate-300 font-medium">Недоступно</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded bg-slate-600 shadow-sm" />
            <span className="text-slate-300 font-medium">Вакансия</span>
          </div>
        </div>
      </div>
    </div>
  );
};