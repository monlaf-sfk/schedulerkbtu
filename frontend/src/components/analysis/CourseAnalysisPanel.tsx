import React from 'react';
import { AlertTriangle, CheckCircle, BookOpen, Users, FlaskConical } from 'lucide-react';
import type { CourseAnalysis, ConflictInfo } from '../../types';

interface CourseAnalysisPanelProps {
  courseAnalysis: readonly CourseAnalysis[];
  conflicts: readonly ConflictInfo[];
}

export const CourseAnalysisPanel: React.FC<CourseAnalysisPanelProps> = ({
  courseAnalysis,
  conflicts
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Лекция': return <BookOpen size={16} />;
      case 'Лабораторная': return <FlaskConical size={16} />;
      case 'Практика': return <Users size={16} />;
      default: return <BookOpen size={16} />;
    }
  };

  const getProgressColor = (current: number, max: number) => {
    if (current === 0) return 'bg-slate-600';
    if (current === max) return 'bg-emerald-600';
    if (current > max) return 'bg-red-500';
    return 'bg-amber-500';
  };

  const getProgressPercentage = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.min((current / max) * 100, 100);
  };

  return (
    <div className="space-y-4">
      {/* Общая статистика конфликтов */}
      {conflicts.length > 0 && (
        <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-600/40 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-400" />
            <span className="font-semibold text-red-300">
              Обнаружено конфликтов: {conflicts.length}
            </span>
          </div>
          <div className="space-y-2">
            {conflicts.slice(0, 3).map((conflict, idx) => (
              <div key={idx} className="text-sm text-red-200 bg-red-900/20 rounded-lg p-2 border border-red-700/30">
                {conflict.message}
              </div>
            ))}
            {conflicts.length > 3 && (
              <div className="text-sm text-red-400 font-medium">
                +{conflicts.length - 3} других конфликтов
              </div>
            )}
          </div>
        </div>
      )}

      {/* Анализ по курсам */}
      <div className="space-y-3">
        <h4 className="font-semibold text-slate-200 flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-400" />
          Анализ курсов
        </h4>
        
        {courseAnalysis.length === 0 ? (
          <div className="text-center text-slate-400 py-6 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-600/30">
            <CheckCircle size={24} className="mx-auto mb-2 text-slate-500" />
            <p className="text-sm font-medium">Выберите курсы для анализа</p>
          </div>
        ) : (
          courseAnalysis.map(analysis => (
            <div key={analysis.course.code} className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 border border-slate-600/40 rounded-xl p-4 shadow-lg transition-all duration-200 hover:border-slate-500/60">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-slate-200">{analysis.course.code}</span>
                {analysis.violations.length > 0 ? (
                  <AlertTriangle size={18} className="text-amber-400" />
                ) : (
                  <CheckCircle size={18} className="text-emerald-400" />
                )}
              </div>
              
              <div className="space-y-2">
                {/* Лекции */}
                {analysis.limits.maxLectures > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getTypeIcon('Лекция')}
                        <span>Лекции</span>
                      </div>
                      <span className={analysis.currentSelection.lectures > analysis.limits.maxLectures ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                        {analysis.currentSelection.lectures}/{analysis.limits.maxLectures}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 shadow-inner">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor(analysis.currentSelection.lectures, analysis.limits.maxLectures)}`}
                        style={{ width: `${getProgressPercentage(analysis.currentSelection.lectures, analysis.limits.maxLectures)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Лабы */}
                {analysis.limits.maxLabs > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getTypeIcon('Лабораторная')}
                        <span>Лабы</span>
                      </div>
                      <span className={analysis.currentSelection.labs > analysis.limits.maxLabs ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                        {analysis.currentSelection.labs}/{analysis.limits.maxLabs}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 shadow-inner">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor(analysis.currentSelection.labs, analysis.limits.maxLabs)}`}
                        style={{ width: `${getProgressPercentage(analysis.currentSelection.labs, analysis.limits.maxLabs)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Практики */}
                {analysis.limits.maxPractices > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getTypeIcon('Практика')}
                        <span>Практики</span>
                      </div>
                      <span className={analysis.currentSelection.practices > analysis.limits.maxPractices ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                        {analysis.currentSelection.practices}/{analysis.limits.maxPractices}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 shadow-inner">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor(analysis.currentSelection.practices, analysis.limits.maxPractices)}`}
                        style={{ width: `${getProgressPercentage(analysis.currentSelection.practices, analysis.limits.maxPractices)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Нарушения для этого курса */}
              {analysis.violations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-600/50">
                  {analysis.violations.map((violation, idx) => (
                    <div key={idx} className="text-xs text-amber-300 bg-amber-900/20 rounded-lg p-2 border border-amber-700/30">
                      {violation.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};