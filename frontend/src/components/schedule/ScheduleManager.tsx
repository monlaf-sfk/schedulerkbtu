import React, { useState } from 'react';
import { Plus, Copy, Trash2, Calendar, AlertTriangle, CheckCircle, GitCompare, Download } from 'lucide-react';
import type { Schedule, ConflictInfo } from '../../types';

interface ScheduleManagerProps {
  schedules: readonly Schedule[];
  activeScheduleId: string;
  onScheduleSelect: (scheduleId: string) => void;
  onCreateSchedule: (name: string) => void;
  onDuplicateSchedule: (scheduleId: string, newName: string) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onCompareSchedules?: () => void;
  onExportSchedule?: (scheduleId: string) => void;
  conflicts: readonly ConflictInfo[];
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  schedules,
  activeScheduleId,
  onScheduleSelect,
  onCreateSchedule,
  onDuplicateSchedule,
  onDeleteSchedule,
  onCompareSchedules,
  onExportSchedule,
  conflicts
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');

  const handleCreateSchedule = () => {
    if (newScheduleName.trim()) {
      onCreateSchedule(newScheduleName.trim());
      setNewScheduleName('');
      setIsCreating(false);
    }
  };

  const handleDuplicate = (schedule: Schedule) => {
    const newName = `${schedule.name} (копия)`;
    onDuplicateSchedule(schedule.id, newName);
  };

  const getConflictSeverityColor = (severity: ConflictInfo['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Заголовок с кнопками */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
          <Calendar size={20} />
          Мои расписания
        </h3>
        <div className="flex gap-2">
          {schedules.length > 1 && onCompareSchedules && (
            <button
              onClick={onCompareSchedules}
              className="p-2 bg-green-700 hover:bg-green-600 rounded-xl transition-all duration-200 shadow-lg border border-green-600"
              title="Сравнить расписания"
            >
              <GitCompare size={16} />
            </button>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className="p-2 bg-blue-700 hover:bg-blue-600 rounded-xl transition-all duration-200 shadow-lg border border-blue-600"
            title="Создать новое расписание"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Форма создания нового расписания */}
      {isCreating && (
        <div className="bg-gradient-to-r from-gray-800/70 to-gray-900/70 border border-blue-700/30 p-4 rounded-xl space-y-3 shadow-lg">
          <input
            type="text"
            placeholder="Название расписания..."
            value={newScheduleName}
            onChange={(e) => setNewScheduleName(e.target.value)}
            className="w-full bg-gray-800/70 border border-blue-700/30 rounded-xl px-4 py-3 text-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-all duration-200 shadow-lg placeholder-blue-400/70"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSchedule();
              if (e.key === 'Escape') setIsCreating(false);
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateSchedule}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-xl text-sm font-bold transition-all duration-200 shadow-lg border border-blue-600"
            >
              Создать
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-blue-900/50 rounded-xl text-sm font-bold transition-all duration-200 shadow-lg border border-blue-700/30 text-blue-300"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список расписаний */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {schedules.map(schedule => {
          const isActive = schedule.id === activeScheduleId;
          const scheduleConflicts = conflicts.filter(() => 
            // Здесь можно добавить логику фильтрации конфликтов по расписанию
            true
          );
          
          return (
            <div
              key={schedule.id}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-lg ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-700/30 to-blue-800/30 border-blue-500/70 shadow-blue-500/20' 
                  : 'bg-gradient-to-r from-gray-800/70 to-gray-900/70 border-blue-700/30 hover:border-blue-600/50 hover:bg-gradient-to-r hover:from-blue-900/20 hover:to-gray-900/70'
              }`}
              onClick={() => onScheduleSelect(schedule.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-400">{schedule.name}</span>
                    {scheduleConflicts.length === 0 ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <AlertTriangle size={16} className="text-yellow-400" />
                    )}
                  </div>
                  <div className="text-xs text-blue-500/70 mt-1 font-medium">
                    Обновлено: {new Date(schedule.updatedAt).toLocaleDateString()}
                  </div>
                  
                  {/* Показываем конфликты */}
                  {scheduleConflicts.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {scheduleConflicts.slice(0, 2).map((conflict, idx) => (
                        <div key={idx} className={`text-xs ${getConflictSeverityColor(conflict.severity)}`}>
                          {conflict.message}
                        </div>
                      ))}
                      {scheduleConflicts.length > 2 && (
                        <div className="text-xs text-gray-400">
                          +{scheduleConflicts.length - 2} конфликтов
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Кнопки действий */}
                <div className="flex gap-1 ml-2">
                  {onExportSchedule && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportSchedule(schedule.id);
                      }}
                      className="p-2 hover:bg-green-700 rounded-lg transition-all duration-200 text-green-400 hover:text-green-300"
                      title="Экспортировать расписание"
                    >
                      <Download size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(schedule);
                    }}
                    className="p-2 hover:bg-blue-900/50 rounded-lg transition-all duration-200 text-blue-400 hover:text-blue-300"
                    title="Дублировать расписание"
                  >
                    <Copy size={14} />
                  </button>
                  {schedules.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Удалить расписание "${schedule.name}"?`)) {
                          onDeleteSchedule(schedule.id);
                        }
                      }}
                      className="p-2 hover:bg-red-700 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300"
                      title="Удалить расписание"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {schedules.length === 0 && (
        <div className="text-center py-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-blue-700/30 rounded-2xl">
          <Calendar size={32} className="mx-auto mb-3 text-blue-500/70" />
          <p className="text-sm text-blue-400 font-medium">Нет созданных расписаний</p>
          <p className="text-xs text-blue-500/70">Создайте первое расписание</p>
        </div>
      )}
    </div>
  );
};