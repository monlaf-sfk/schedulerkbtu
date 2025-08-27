// Core domain types
export type SectionType = 'Лекция' | 'Лабораторная' | 'Практика';
export type DayOfWeek = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт' | 'Сб' | 'Вс';
export type ConflictSeverity = 'low' | 'medium' | 'high';
export type ConflictType = 'time_conflict' | 'formula_violation' | 'credit_overload';

export interface Section {
  readonly id: number;
  readonly type: SectionType;
  readonly day: DayOfWeek;
  readonly time: string;
  readonly duration: number;
  readonly teacher: string;
  readonly room: string;
  readonly raw_text: string;
}

export interface CourseData {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly credits: number;
  readonly formula: string;
  readonly sections: readonly Section[];
}

export interface EnrichedSection extends Section {
  readonly courseCode: string;
  readonly courseName: string;
  readonly isSelected?: boolean;
  readonly isConflicted?: boolean;
  readonly isDeactivated?: boolean;
}

// Schedule management types
export interface Schedule {
  readonly id: string;
  readonly name: string;
  readonly selectedSectionIds: Readonly<Record<number, boolean>>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ConflictInfo {
  readonly type: ConflictType;
  readonly message: string;
  readonly affectedSections: readonly number[];
  readonly severity: ConflictSeverity;
}

// Analysis types
export interface CourseSelectionCounts {
  readonly lectures: number;
  readonly labs: number;
  readonly practices: number;
}

export interface CourseLimits {
  readonly maxLectures: number;
  readonly maxLabs: number;
  readonly maxPractices: number;
}

export interface CourseAnalysis {
  readonly course: CourseData;
  readonly currentSelection: CourseSelectionCounts;
  readonly limits: CourseLimits;
  readonly violations: readonly ConflictInfo[];
}

// Smart recommendations types
export type RecommendationType = 'optimal_schedule' | 'conflict_resolution' | 'completion_suggestion';

export interface SmartRecommendation {
  readonly type: RecommendationType;
  readonly title: string;
  readonly description: string;
  readonly suggestedSections: readonly number[];
  readonly score: number;
}

// Export types
export type ExportFormat = 'text' | 'csv' | 'ical' | 'json';

export interface ScheduleExportData {
  readonly schedule: Omit<Schedule, 'selectedSectionIds'>;
  readonly sections: readonly EnrichedSection[];
}

// UI State types
export interface ExpandedSections {
  readonly schedules: boolean;
  readonly courses: boolean;
  readonly analysis: boolean;
  readonly recommendations: boolean;
  readonly filters: boolean;
}

export interface FilterState {
  readonly days: ReadonlySet<DayOfWeek>;
  readonly timeRanges: ReadonlySet<string>;
  readonly teachers: ReadonlySet<string>;
  readonly rooms: ReadonlySet<string>;
  readonly types: ReadonlySet<SectionType>;
  readonly courses: ReadonlySet<string>;
}