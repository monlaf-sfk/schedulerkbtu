import React, { useState, useMemo, memo } from 'react';
import { X, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { DAYS_OF_WEEK } from '../../constants/schedule';
import { calculateScheduleStats } from '../../utils/schedule';
import type { Schedule, EnrichedSection, ConflictInfo } from '../../types';

interface ScheduleComparisonProps {
  readonly schedules: readonly Schedule[];
  readonly allSections: readonly EnrichedSection[];
  readonly onClose: () => void;
  readonly analyzeConflicts: (schedule: Schedule) => readonly ConflictInfo[];
}

const MAX_SCHEDULES_TO_COMPARE = 3;
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] as const;

const SCHEDULE_COLORS = ['bg-blue-600', 'bg-green-600', 'bg-purple-600'] as const;

interface ScheduleStatsCardProps {
  readonly schedule: Schedule;
  readonly stats: ReturnType<typeof calculateScheduleStats>;
  readonly conflicts: readonly ConflictInfo[];
}

const ScheduleStatsCard: React.FC<ScheduleStatsCardProps> = memo(({ 
  schedule, 
  stats, 
  conflicts 
}) => (
  <div className="bg-neutral-700 rounded-lg p-4">
    <h4 className="font-semibold text-white mb-3">{schedule.name}</h4>
    
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-400">Секций:</span>
        <span className="text-white">{stats.totalSections}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Конфликтов:</span>
        <span className={stats.totalConflicts > 0 ? 'text-red-400' : 'text-green-400'}>
          {stats.totalConflicts}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Критичных:</span>
        <span className={stats.highPriorityConflicts > 0 ? 'text-red-400' : 'text-green-400'}>
          {stats.highPriorityConflicts}
        </span>
      </div>
    </div>

    {conflicts.length > 0 && (
      <div className="mt-3 pt-3 border-t border-neutral-600">
        <div className="text-xs text-gray-400 mb-1">Основные проблемы:</div>
        {conflicts.slice(0, 2).map((conflict, idx) => (
          <div key={idx} className="text-xs text-red-400 mb-1">
            {conflict.message}
          </div>
        ))}
      </div>
    )}
  </div>
));

ScheduleStatsCard.displayName = 'ScheduleStatsCard';

export const ScheduleComparison: React.FC<ScheduleComparisonProps> = memo(({
  schedules,
  allSections,
  onClose,
  analyzeConflicts
}) => {
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<readonly string[]>([]);

  const toggleScheduleSelection = (scheduleId: string) => {
    setSelectedScheduleIds(prev => 
      prev.includes(scheduleId) 
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId].slice(0, MAX_SCHEDULES_TO_COMPARE)
    );
  };

  const selectedSchedules = useMemo(() => 
    schedules.filter(s => selectedScheduleIds.includes(s.id)),
    [schedules, selectedScheduleIds]
  );

  const getScheduleSections = (schedule: Schedule) => 
    allSections.filter(section => schedule.selectedSectionIds[section.id]);

  const scheduleData = useMemo(() => 
    selectedSchedules.map(schedule => {
      const sections = getScheduleSections(schedule);
      const conflicts = analyzeConflicts(schedule);
      const stats = calculateScheduleStats(schedule, allSections, conflicts);
      
      return { schedule, sections, conflicts, stats };
    }),
    [selectedSchedules, allSections, analyzeConflicts]
  );

  const EmptyComparisonState = () => (
    <div className="flex items-center justify-center h-full text-center text-gray-500">
      <div>
        <Calendar size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Выберите расписания для сравнения</p>
        <p className="text-sm">Отметьте до {MAX_SCHEDULES_TO_COMPARE} расписаний слева для их сравнения</p>
      </div>
    </div>
  );

  const TimeComparisonGrid = () => (
    <div className="bg-neutral-700 rounded-lg p-4">
      <h4 className="font-semibold text-white mb-4">Сравнение по времени</h4>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2 text-gray-400">Время</th>
              {DAYS_OF_WEEK.map(day => (
                <th key={day} className="text-center p-2 text-gray-400 min-w-32">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(time => (
              <tr key={time} className="border-t border-neutral-600">
                <td className="p-2 text-gray-400 font-mono">{time}</td>
                {DAYS_OF_WEEK.map(day => {
                  const cellSections = scheduleData.map(({ sections }) => 
                    sections.find(s => s.day === day && s.time === time)
                  ).filter((section): section is EnrichedSection => section !== undefined);

                  return (
                    <td key={day} className="p-1">
                      <div className="space-y-1">
                        {cellSections.map((section, idx) => (
                          <div
                            key={`${section.id}-${idx}`}
                            className={`text-xs p-1 rounded text-center ${SCHEDULE_COLORS[idx] || 'bg-gray-600'}`}
                          >
                            {section.courseCode}
                          </div>
                        ))}
                        {cellSections.length > 1 && (
                          <div className="text-xs text-red-400 text-center">
                            Конфликт!
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ScheduleLegend = () => (
    <div className="flex gap-4 text-sm">
      {scheduleData.map(({ schedule }, idx) => (
        <div key={schedule.id} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${SCHEDULE_COLORS[idx] || 'bg-gray-600'}`} />
          <span className="text-gray-300">{schedule.name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-800 rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar size={24} />
            Сравнение расписаний
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
            aria-label="Закрыть сравнение"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-grow overflow-hidden">
          {/* Schedule Selection Panel */}
          <div className="w-80 border-r border-neutral-700 p-4 overflow-y-auto">
            <h3 className="font-semibold text-white mb-4">
              Выберите расписания для сравнения (макс. {MAX_SCHEDULES_TO_COMPARE})
            </h3>
            
            <div className="space-y-2">
              {schedules.map(schedule => {
                const isSelected = selectedScheduleIds.includes(schedule.id);
                const conflicts = analyzeConflicts(schedule);
                const stats = calculateScheduleStats(schedule, allSections, conflicts);
                
                return (
                  <div
                    key={schedule.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-600/20 border-blue-500' 
                        : 'bg-neutral-700 border-neutral-600 hover:bg-neutral-600'
                    }`}
                    onClick={() => toggleScheduleSelection(schedule.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{schedule.name}</span>
                      {stats.highPriorityConflicts === 0 ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <AlertTriangle size={16} className="text-red-400" />
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>Секций: {stats.totalSections}</div>
                      <div>Конфликтов: {stats.totalConflicts}</div>
                      <div className="text-xs">
                        Обновлено: {new Date(schedule.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison Panel */}
          <div className="flex-grow p-4 overflow-auto">
            {scheduleData.length === 0 ? (
              <EmptyComparisonState />
            ) : (
              <div className="space-y-6">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {scheduleData.map(({ schedule, conflicts, stats }) => (
                    <ScheduleStatsCard
                      key={schedule.id}
                      schedule={schedule}
                      stats={stats}
                      conflicts={conflicts}
                    />
                  ))}
                </div>

                <TimeComparisonGrid />
                <ScheduleLegend />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ScheduleComparison.displayName = 'ScheduleComparison';