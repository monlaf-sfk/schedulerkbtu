import type { DayOfWeek, SectionType } from '../types';

export const DAYS_OF_WEEK: readonly DayOfWeek[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

export const SECTION_TYPES: readonly SectionType[] = ['Лекция', 'Лабораторная', 'Практика'] as const;

export const TIME_RANGES = [
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00'
] as const;

export const SCHEDULE_GRID = {
  HOUR_HEIGHT_PIXELS: 120,
  START_HOUR: 8,
  END_HOUR: 20,
  HEADER_OFFSET: 48,
} as const;

export const EXPORT_FORMATS = {
  text: { label: 'Текст', extension: 'txt', mimeType: 'text/plain' },
  csv: { label: 'CSV', extension: 'csv', mimeType: 'text/csv' },
  ical: { label: 'Календарь (iCal)', extension: 'ics', mimeType: 'text/calendar' },
  json: { label: 'JSON', extension: 'json', mimeType: 'application/json' }
} as const;

export const CONFLICT_COLORS = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400'
} as const;

export const RECOMMENDATION_COLORS = {
  conflict_resolution: 'border-red-500/40 bg-gradient-to-r from-red-900/20 to-red-800/20',
  completion_suggestion: 'border-emerald-500/40 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20',
  optimal_schedule: 'border-amber-500/40 bg-gradient-to-r from-amber-900/20 to-amber-800/20'
} as const;