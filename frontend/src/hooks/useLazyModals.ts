import { useState, useCallback } from 'react';

interface ModalState {
  isOpen: boolean;
  props?: any;
}

interface LazyModalManager {
  addCourse: ModalState;
  courseDetails: ModalState;
  settings: ModalState;
  openAddCourse: (props?: any) => void;
  closeAddCourse: () => void;
  openCourseDetails: (props?: any) => void;
  closeCourseDetails: () => void;
  openSettings: (props?: any) => void;
  closeSettings: () => void;
}

export const useLazyModals = (): LazyModalManager => {
  const [addCourse, setAddCourse] = useState<ModalState>({ isOpen: false });
  const [courseDetails, setCourseDetails] = useState<ModalState>({ isOpen: false });
  const [settings, setSettings] = useState<ModalState>({ isOpen: false });

  const openAddCourse = useCallback((props?: any) => {
    setAddCourse({ isOpen: true, props });
  }, []);

  const closeAddCourse = useCallback(() => {
    setAddCourse({ isOpen: false });
  }, []);

  const openCourseDetails = useCallback((props?: any) => {
    setCourseDetails({ isOpen: true, props });
  }, []);

  const closeCourseDetails = useCallback(() => {
    setCourseDetails({ isOpen: false });
  }, []);

  const openSettings = useCallback((props?: any) => {
    setSettings({ isOpen: true, props });
  }, []);

  const closeSettings = useCallback(() => {
    setSettings({ isOpen: false });
  }, []);

  return {
    addCourse,
    courseDetails,
    settings,
    openAddCourse,
    closeAddCourse,
    openCourseDetails,
    closeCourseDetails,
    openSettings,
    closeSettings
  };
};