import React, { memo } from 'react';
import { BookOpen } from 'lucide-react';
import type { CourseData } from '../../types';

interface CourseCardProps {
  readonly course: CourseData;
}

const CourseCard: React.FC<CourseCardProps> = memo(({ course }) => (
  <div className="bg-neutral-700 p-3 rounded-lg transition-colors hover:bg-neutral-600">
    <div className="flex items-start justify-between mb-2">
      <p className="font-bold text-white">{course.code}</p>
      <span className="text-xs text-gray-400 bg-neutral-600 px-2 py-1 rounded">
        {course.credits} кр.
      </span>
    </div>
    <p className="text-sm text-gray-300 truncate mb-1" title={course.name}>
      {course.name}
    </p>
    <div className="flex items-center justify-between">
      <p className="text-xs text-gray-400">{course.formula}</p>
      <span className="text-xs text-gray-500">
        {course.sections.length} секций
      </span>
    </div>
  </div>
));

CourseCard.displayName = 'CourseCard';

interface CourseListProps {
  readonly courses: readonly CourseData[];
  readonly maxHeight?: string;
}

const EmptyState: React.FC = () => (
  <div className="text-center text-sm text-gray-500 py-8">
    <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
    <p className="font-medium">Курсы не выбраны</p>
    <p className="text-xs">Добавьте курсы для составления расписания</p>
  </div>
);

export const CourseList: React.FC<CourseListProps> = memo(({ 
  courses, 
  maxHeight = 'max-h-48' 
}) => {
  if (courses.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={`space-y-2 ${maxHeight} overflow-y-auto`}>
      {courses.map(course => (
        <CourseCard key={course.code} course={course} />
      ))}
    </div>
  );
});

CourseList.displayName = 'CourseList';