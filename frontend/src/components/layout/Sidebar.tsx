import React, { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
import { ScheduleManager } from '../schedule/ScheduleManager';
import { CourseAnalysisPanel } from '../analysis/CourseAnalysisPanel';
import { SmartRecommendations } from '../analysis/SmartRecommendations';
import { CourseLegend } from '../course/CourseLegend';
import { CourseItem } from '../course/CourseItem';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { 
  CourseData, 
  Schedule, 
  ConflictInfo, 
  CourseAnalysis, 
  EnrichedSection,
  SmartRecommendation
} from '../../types';
interface SidebarProps {
  readonly selectedCourses: readonly CourseData[];
  readonly onAddCourseClick: () => void;
  readonly schedules: readonly Schedule[];
  readonly activeScheduleId: string;
  readonly onScheduleSelect: (scheduleId: string) => void;
  readonly onCreateSchedule: (name: string) => void;
  readonly onDuplicateSchedule: (scheduleId: string, newName: string) => void;
  readonly onDeleteSchedule: (scheduleId: string) => void;
  readonly onCompareSchedules?: () => void;
  readonly onExportSchedule?: (scheduleId: string) => void;
  readonly onResetClick: () => void;
  readonly isFinalView: boolean;
  readonly setIsFinalView?: (value: boolean) => void;
  readonly conflicts: readonly ConflictInfo[];
  readonly courseAnalysis: readonly CourseAnalysis[];
  readonly allSections: readonly EnrichedSection[];
  readonly recommendations: readonly SmartRecommendation[];
  readonly onApplyRecommendation: (recommendation: SmartRecommendation) => void;
  readonly hiddenCourseCodes?: string[];
  readonly onToggleCourseVisibility?: (courseCode: string) => void;
}

const SIDEBAR_TABS = [
  { key: 'main', label: 'Главная' },
  { key: 'recommendations', label: 'Рекомендации' },
  { key: 'analysis', label: 'Анализ' }
];

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCourses,
  onAddCourseClick,
  schedules,
  activeScheduleId,
  onScheduleSelect,
  onCreateSchedule,
  onDuplicateSchedule,
  onDeleteSchedule,
  onCompareSchedules,
  onExportSchedule,
  onResetClick,
  isFinalView,
  setIsFinalView,
  conflicts,
  courseAnalysis,
  allSections,
  recommendations,
  onApplyRecommendation,
  hiddenCourseCodes = [],
  onToggleCourseVisibility
}) => {
  const [expandedSections, setExpandedSections] = useState({
    schedules: true,
    courses: true,
    legend: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [activeTab, setActiveTab] = useState<'main' | 'recommendations' | 'analysis'>('main');

  const handleToggleFinalView = () => {
    if (setIsFinalView) {
      setIsFinalView(!isFinalView);
    }
  };

  const activeSchedule = schedules.find(s => s.id === activeScheduleId);

  const formatDate = (date: Date | string): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Неверная дата';
      return dateObj.toLocaleDateString('ru-RU');
    } catch {
      return 'Неверная дата';
    }
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95 flex flex-col border-r border-slate-600/30 overflow-hidden shadow-2xl">
      {/* Табы навигации */}
      <div className="flex border-b border-slate-600/30 bg-gradient-to-r from-slate-900/90 to-slate-800/90 px-3 pt-3 pb-2 gap-2">
        {SIDEBAR_TABS.map(tab => (
          <button
            key={tab.key}
            className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 rounded-xl
              ${activeTab === tab.key
                ? 'bg-emerald-600 text-white shadow-lg border border-emerald-500/50'
                : 'bg-slate-700/60 text-slate-300 hover:bg-emerald-600/70 hover:text-white border border-slate-600/40'}
            `}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4 flex-grow overflow-y-auto space-y-4">
        {activeTab === 'main' && (
          <>
            {/* Schedule Management Section */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('schedules')}
                className="w-full flex items-center justify-between text-left font-bold text-white hover:text-slate-200 transition-colors duration-200"
              >
                <span>Расписания ({schedules.length})</span>
                {expandedSections.schedules ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expandedSections.schedules && (
                <ScheduleManager
                  schedules={schedules}
                  activeScheduleId={activeScheduleId}
                  onScheduleSelect={onScheduleSelect}
                  onCreateSchedule={onCreateSchedule}
                  onDuplicateSchedule={onDuplicateSchedule}
                  onDeleteSchedule={onDeleteSchedule}
                  onCompareSchedules={onCompareSchedules}
                  onExportSchedule={onExportSchedule}
                  conflicts={conflicts}
                />
              )}
            </div>
            <hr className="border-slate-500/30" />
            {/* Add Courses Button */}
            <Button onClick={onAddCourseClick} className="w-full">
              + Добавить курсы
            </Button>
            {/* Courses Section */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('courses')}
                className="w-full flex items-center justify-between text-left font-bold text-white hover:text-slate-200 transition-colors duration-200"
              >
                <span>Курсы ({selectedCourses.length})</span>
                {expandedSections.courses ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expandedSections.courses && (
                <div className="space-y-2">
                  {selectedCourses.length > 0 ? (
                    selectedCourses.map(course => (
                      <CourseItem
                        key={course.code}
                        course={course}
                        activeSchedule={activeSchedule}
                        isHidden={hiddenCourseCodes.includes(course.code)}
                        onToggleVisibility={onToggleCourseVisibility!}
                      />
                    ))
                  ) : (
                    <div className="text-center text-sm text-slate-300 py-4">
                      Курсы не выбраны
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* ...секция 'Цветовая схема' удалена с главной страницы... */}
          </>
        )}
        {activeTab === 'recommendations' && (
          <div className="space-y-2">
            <SmartRecommendations
              recommendations={recommendations}
              allSections={allSections}
              onApplyRecommendation={onApplyRecommendation}
            />
          </div>
        )}
        {activeTab === 'analysis' && (
          <>
            {selectedCourses.length > 0 && (
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => toggleSection('legend')}
                  className="w-full flex items-center justify-between text-left font-bold text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                  <span>Цветовая схема</span>
                  {expandedSections.legend ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.legend && (
                  <div>
                    <CourseLegend courses={selectedCourses} />
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <CourseAnalysisPanel
                courseAnalysis={courseAnalysis}
                conflicts={conflicts}
              />
            </div>
          </>
        )}
      </div>
      {/* Bottom Panel */}
      <div className="p-4 border-t border-slate-600/30 space-y-3 bg-gradient-to-r from-slate-900/90 to-slate-800/90">
        <label className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/60 border border-slate-600/40 rounded-xl cursor-pointer hover:border-slate-500/60 transition-all duration-200 shadow-lg">
          <span className="font-bold text-white">Финальное расписание</span>
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isFinalView}
              onChange={handleToggleFinalView}
            />
            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner" />
          </div>
        </label>
        <div className="flex gap-2">
          <Button onClick={onResetClick} variant="secondary" className="flex-1">
            Сбросить
          </Button>
        </div>
        {activeSchedule && (
          <div className="text-xs text-slate-300 flex items-center justify-between px-2">
            <span className="truncate font-medium">{activeSchedule.name}</span>
            <span>{formatDate(activeSchedule.updatedAt)}</span>
          </div>
        )}
      </div>
    </aside>
  );
};