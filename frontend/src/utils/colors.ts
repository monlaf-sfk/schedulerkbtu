import type { SectionType } from '../types';

// Базовая палитра цветов для курсов
const BASE_COLORS = [
  'blue', 'emerald', 'purple', 'orange', 'pink', 'indigo',
  'red', 'yellow', 'cyan', 'lime', 'violet', 'amber',
  'teal', 'rose', 'fuchsia', 'sky', 'green', 'slate'
] as const;

type ColorName = typeof BASE_COLORS[number];

// Интенсивность цветов для разных типов занятий
const TYPE_INTENSITIES: Record<SectionType, number> = {
  'Лекция': 500,        // Средний-светлый (более яркий)
  'Практика': 600,      // Средний
  'Лабораторная': 700,  // Средний-темный (не слишком темный)
};

// Интенсивность для состояний
const STATE_INTENSITIES = {
  normal: 600,
  selected: 500,
  hover: 500,
  disabled: 300,
  conflict: 700,
} as const;

// Хранилище назначенных цветов для курсов
const courseColorAssignments = new Map<string, ColorName>();
const usedColors = new Set<ColorName>();

// Генератор дополнительных цветов когда базовые закончились
function generateAdditionalColor(index: number): ColorName {
  const baseColorIndex = index % BASE_COLORS.length;
  return BASE_COLORS[baseColorIndex];
}

/**
 * Назначает уникальный цвет для курса
 */
export const getCourseColor = (courseCode: string): ColorName => {
  // Если цвет уже назначен, возвращаем его
  if (courseColorAssignments.has(courseCode)) {
    return courseColorAssignments.get(courseCode)!;
  }

  // Находим первый неиспользованный цвет
  let assignedColor: ColorName;

  if (usedColors.size < BASE_COLORS.length) {
    // Есть неиспользованные базовые цвета
    assignedColor = BASE_COLORS.find(color => !usedColors.has(color))!;
  } else {
    // Все базовые цвета использованы, генерируем дополнительные
    const additionalIndex = usedColors.size - BASE_COLORS.length;
    assignedColor = generateAdditionalColor(additionalIndex);
  }

  // Сохраняем назначение
  courseColorAssignments.set(courseCode, assignedColor);
  usedColors.add(assignedColor);

  return assignedColor;
};

/**
 * Сбрасывает назначения цветов (для перезапуска)
 */
export const resetColorAssignments = () => {
  courseColorAssignments.clear();
  usedColors.clear();
};

/**
 * Генерирует CSS классы для секции
 */
export const getSectionColorClasses = (
  courseCode: string,
  sectionType: SectionType,
  state: 'normal' | 'selected' | 'hover' | 'disabled' | 'conflict' = 'normal'
) => {
  const color = getCourseColor(courseCode);
  const intensity = TYPE_INTENSITIES[sectionType];

  // Базовый цвет
  let bgClass = `bg-${color}-${intensity}`;
  let borderClass = `border-${color}-${Math.max(intensity - 100, 300)}`;
  let textClass = 'text-white';

  // Модификации для состояний
  switch (state) {
    case 'selected':
      bgClass = `bg-${color}-${Math.max(intensity - 100, 400)}`;
      borderClass = `border-amber-400`;
      break;
    case 'hover':
      bgClass = `bg-${color}-${Math.max(intensity - 100, 500)}`;
      break;
    case 'disabled':
      bgClass = `bg-${color}-${STATE_INTENSITIES.disabled}`;
      textClass = 'text-gray-400';
      break;
    case 'conflict':
      borderClass = 'border-red-500';
      break;
  }

  return {
    background: bgClass,
    border: borderClass,
    text: textClass,
  };
};

/**
 * Генерирует inline стили для более точного контроля цветов
 */
export const getSectionInlineStyles = (
  courseCode: string,
  sectionType: SectionType,
  state: 'normal' | 'selected' | 'hover' | 'disabled' | 'conflict' = 'normal'
) => {
  const color = getCourseColor(courseCode);
  const intensity = TYPE_INTENSITIES[sectionType];

  // Цветовые значения для каждого цвета и интенсивности
  const colorMap: Record<ColorName, Record<number, string>> = {
    blue: {
      300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af'
    },
    emerald: {
      300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46'
    },
    purple: {
      300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6'
    },
    orange: {
      300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412'
    },
    pink: {
      300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d'
    },
    indigo: {
      300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3'
    },
    red: {
      300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b'
    },
    yellow: {
      300: '#fde047', 400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207', 800: '#854d0e'
    },
    cyan: {
      300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75'
    },
    lime: {
      300: '#bef264', 400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f', 800: '#365314'
    },
    violet: {
      300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7c2d12', 800: '#581c87'
    },
    amber: {
      300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e'
    },
    teal: {
      300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59'
    },
    rose: {
      300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239'
    },
    fuchsia: {
      300: '#f0abfc', 400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf', 800: '#86198f'
    },
    sky: {
      300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985'
    },
    green: {
      300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534'
    },
    slate: {
      300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b'
    },
  };

  let backgroundColor = colorMap[color][intensity];
  let borderColor = colorMap[color][Math.max(intensity - 100, 300)];

  // Модификации для состояний
  switch (state) {
    case 'selected':
      backgroundColor = colorMap[color][Math.max(intensity - 100, 400)];
      borderColor = '#fbbf24'; // amber-400
      break;
    case 'hover':
      backgroundColor = colorMap[color][Math.max(intensity - 100, 500)];
      break;
    case 'disabled':
      backgroundColor = colorMap[color][300] + '60'; // Добавляем прозрачность
      break;
    case 'conflict':
      borderColor = '#ef4444'; // red-500
      break;
  }

  return {
    backgroundColor,
    borderColor,
    borderWidth: '2px',
    borderStyle: 'solid',
  };
};

/**
 * Генерирует градиентные стили для секций
 */
export const getSectionGradientStyles = (
  courseCode: string,
  sectionType: SectionType,
  state: 'normal' | 'selected' | 'hover' | 'disabled' | 'conflict' = 'normal'
) => {
  const color = getCourseColor(courseCode);
  const intensity = TYPE_INTENSITIES[sectionType];

  // Обновленная цветовая палитра для минималистичного дизайна
  const colorMap: Record<ColorName, Record<number, string>> = {
    blue: {
      400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8'
    },
    emerald: {
      400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857'
    },
    purple: {
      400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9'
    },
    orange: {
      400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c'
    },
    pink: {
      400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d'
    },
    indigo: {
      400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca'
    },
    red: {
      400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c'
    },
    yellow: {
      400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207'
    },
    cyan: {
      400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490'
    },
    lime: {
      400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f'
    },
    violet: {
      400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7c2d12'
    },
    amber: {
      400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309'
    },
    teal: {
      400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e'
    },
    rose: {
      400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c'
    },
    fuchsia: {
      400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf'
    },
    sky: {
      400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1'
    },
    green: {
      400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d'
    },
    slate: {
      400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155'
    },
  };

  const baseColor = colorMap[color][intensity];
  const lightColor = colorMap[color][Math.max(intensity - 100, 400)];
  const darkColor = colorMap[color][Math.min(intensity + 100, 700)];

  // Более мягкие градиенты для минималистичного дизайна
  let background = `linear-gradient(145deg, ${lightColor}E6 0%, ${baseColor}CC 50%, ${darkColor}E6 100%)`;
  let borderColor = `${baseColor}80`;

  // Модификации для состояний
  switch (state) {
    case 'selected':
      background = `linear-gradient(145deg, ${lightColor} 0%, ${baseColor} 40%, ${darkColor} 100%)`;
      borderColor = '#10b981'; // emerald-600
      break;
    case 'hover':
      background = `linear-gradient(145deg, ${lightColor}F0 0%, ${baseColor}E6 50%, ${darkColor}F0 100%)`;
      borderColor = `${baseColor}B3`;
      break;
    case 'disabled':
      background = `linear-gradient(145deg, ${colorMap[color][400]}40 0%, ${colorMap[color][500]}30 100%)`;
      borderColor = `${colorMap[color][400]}40`;
      break;
    case 'conflict':
      background = `linear-gradient(145deg, ${lightColor}80 0%, ${baseColor}60 50%, ${darkColor}80 100%)`;
      borderColor = '#ef4444'; // red-500
      break;
  }

  return {
    background,
    borderColor,
    borderWidth: '1px',
    borderStyle: 'solid',
  };
};

/**
 * Генерирует цвет для легенды курса
 */
export const getCourseLegendColor = (courseCode: string): string => {
  const color = getCourseColor(courseCode);
  const colorMap: Record<ColorName, string> = {
    blue: '#3b82f6',
    emerald: '#10b981',
    purple: '#8b5cf6',
    orange: '#f97316',
    pink: '#ec4899',
    indigo: '#6366f1',
    red: '#ef4444',
    yellow: '#eab308',
    cyan: '#06b6d4',
    lime: '#84cc16',
    violet: '#a855f7',
    amber: '#f59e0b',
    teal: '#14b8a6',
    rose: '#f43f5e',
    fuchsia: '#d946ef',
    sky: '#0ea5e9',
    green: '#22c55e',
    slate: '#64748b',
  };

  return colorMap[color];
};

/**
 * Генерирует светлый цвет для фона легенды
 */
export const getCourseLegendBackgroundColor = (courseCode: string): string => {
  const color = getCourseColor(courseCode);
  const colorMap: Record<ColorName, string> = {
    blue: '#dbeafe',
    emerald: '#d1fae5',
    purple: '#e9d5ff',
    orange: '#fed7aa',
    pink: '#fce7f3',
    indigo: '#e0e7ff',
    red: '#fee2e2',
    yellow: '#fef3c7',
    cyan: '#cffafe',
    lime: '#ecfccb',
    violet: '#f3e8ff',
    amber: '#fef3c7',
    teal: '#ccfbf1',
    rose: '#ffe4e6',
    fuchsia: '#fae8ff',
    sky: '#e0f2fe',
    green: '#dcfce7',
    slate: '#f1f5f9',
  };

  return colorMap[color];
};