import React from 'react';
import { LazyModal } from '../ui/LazyModal';
import { useLazyModals } from '../../hooks/useLazyModals';

interface ModalManagerProps {
  children: (modalManager: ReturnType<typeof useLazyModals>) => React.ReactNode;
}

export const ModalManager: React.FC<ModalManagerProps> = ({ children }) => {
  const modalManager = useLazyModals();

  return (
    <>
      {children(modalManager)}
      
      {/* Lazy-загружаемые модальные окна */}
      <LazyModal
        isOpen={modalManager.addCourse.isOpen}
        onClose={modalManager.closeAddCourse}
        modalComponent={() => import('./LazyAddCourseModal').then(m => ({ default: m.LazyAddCourseModal }))}
        modalProps={modalManager.addCourse.props}
      />

      <LazyModal
        isOpen={modalManager.courseDetails.isOpen}
        onClose={modalManager.closeCourseDetails}
        modalComponent={() => import('./LazyAddCourseModal').then(m => ({ default: m.LazyCourseDetailsModal }))}
        modalProps={modalManager.courseDetails.props}
      />

      <LazyModal
        isOpen={modalManager.settings.isOpen}
        onClose={modalManager.closeSettings}
        modalComponent={() => import('./LazyAddCourseModal').then(m => ({ default: m.LazySettingsModal }))}
        modalProps={modalManager.settings.props}
      />
    </>
  );
};