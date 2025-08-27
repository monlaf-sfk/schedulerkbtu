import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedCourseListProps {
  courses: any[];
  height: number;
  itemHeight: number;
  onCourseSelect: (course: any) => void;
  renderItem: (course: any) => React.ReactNode;
  selectedCourseId?: string;
}

interface ItemData {
  courses: any[];
  onCourseSelect: (course: any) => void;
  renderItem: (course: any) => React.ReactNode;
  selectedCourseId?: string;
}

const VirtualizedItem = memo(({ index, style, data }: {
  index: number;
  style: React.CSSProperties;
  data: ItemData;
}) => {
  const { courses, onCourseSelect, renderItem } = data;
  const course = courses[index];

  return (
    <div style={style}>
      <div 
        onClick={() => onCourseSelect(course)}
        className="cursor-pointer"
      >
        {renderItem(course)}
      </div>
    </div>
  );
});

VirtualizedItem.displayName = 'VirtualizedItem';

export const VirtualizedCourseList: React.FC<VirtualizedCourseListProps> = memo(({
  courses,
  height,
  itemHeight,
  onCourseSelect,
  renderItem,
  selectedCourseId
}) => {
  const itemData: ItemData = {
    courses,
    onCourseSelect,
    renderItem,
    selectedCourseId
  };

  return (
    <List
      height={height}
      width="100%"
      itemCount={courses.length}
      itemSize={itemHeight}
      itemData={itemData}
      overscanCount={5}
    >
      {VirtualizedItem}
    </List>
  );
});

VirtualizedCourseList.displayName = 'VirtualizedCourseList';