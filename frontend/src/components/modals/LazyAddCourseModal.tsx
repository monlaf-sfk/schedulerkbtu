import { lazy } from 'react';

// Lazy loading для AddCourseModal
export const LazyAddCourseModal = lazy(() => 
  import('../course/AddCourseModal').then(module => ({
    default: module.AddCourseModal
  }))
);

// Заглушки для других модальных окон (пока не созданы)
export const LazyCourseDetailsModal = lazy(() => 
  Promise.resolve({
    default: () => <div className="p-4 text-white">Детали курса (в разработке)</div>
  })
);

export const LazySettingsModal = lazy(() => 
  Promise.resolve({
    default: () => <div className="p-4 text-white">Настройки (в разработке)</div>
  })
);