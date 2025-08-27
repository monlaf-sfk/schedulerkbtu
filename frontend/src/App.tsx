import { useState, useMemo, useCallback, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header, Sidebar } from './components/layout';
import { ScheduleGrid, ScheduleFilters } from './components/schedule';
import { AddCourseModal } from './components/course';
import { ScheduleComparison, ScheduleExport } from './components/schedule';
import { useScheduleManager } from './hooks/useScheduleManager';
import { useLocalStorage } from './hooks/useLocalStorage';
import { resetColorAssignments } from './utils/colors';
import type { CourseData, EnrichedSection } from './types';
import LandingPage from './components/LandingPage';

interface AppState {
  readonly isModalOpen: boolean;
  readonly isComparisonOpen: boolean;
  readonly exportScheduleId: string | null;
  readonly isFinalView: boolean;
  readonly isLoading: boolean;
}

const INITIAL_STATE: AppState = {
  isModalOpen: false,
  isComparisonOpen: false,
  exportScheduleId: null,
  isFinalView: false,
  isLoading: false
};

function BuilderApp() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [selectedCourses, setSelectedCourses] = useLocalStorage<CourseData[]>('selected_courses', []);
  const [hiddenCourseCodes, setHiddenCourseCodes] = useState<string[]>([]);
  const [filteredSections, setFilteredSections] = useState<EnrichedSection[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const handleFiltersChange = useCallback((sections: EnrichedSection[]) => {
    setFilteredSections(sections);
  }, []);

  const openFilterModal = useCallback(() => setIsFilterModalOpen(true), []);
  const closeFilterModal = useCallback(() => setIsFilterModalOpen(false), []);

 
  useEffect(() => {
    console.log('Selected courses changed:', selectedCourses.length, selectedCourses.map(c => c.code));
  }, [selectedCourses]);

  // Memoized sections calculation
  const allSections = useMemo((): EnrichedSection[] => 
    selectedCourses.flatMap(course => 
      course.sections.map(section => ({
        ...section,
        courseCode: course.code,
        courseName: course.name
      }))
    ), [selectedCourses]);

  // Schedule management
  const {
    schedules,
    activeSchedule,
    activeScheduleId,
    setActiveScheduleId,
    createSchedule,
    updateActiveSchedule,
    deleteSchedule,
    duplicateSchedule,
    analyzeConflicts,
    courseAnalysis,
    conflicts,
    recommendations,
    applyRecommendation
  } = useScheduleManager(selectedCourses, allSections);
  // Обработчик скрытия/показа курса
  const handleToggleCourseVisibility = useCallback((courseCode: string) => {
    setHiddenCourseCodes(prev =>
      prev.includes(courseCode)
        ? prev.filter(code => code !== courseCode)
        : [...prev, courseCode]
    );
  }, []);

  useEffect(() => {
    if (schedules.length === 0) {
      createSchedule('Расписание 1');
    }
  }, [schedules.length, createSchedule]);

  const selectedSectionIds = activeSchedule?.selectedSectionIds || {};

  const handleConfirmSelection = useCallback(async (selectedCodes: readonly string[]) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const axios = (await import('axios')).default;
      const coursePromises = selectedCodes.map(code =>
        axios.get(`http://localhost:5001/api/courses/${code}`)
      );
      
      const responses = await Promise.all(coursePromises);
      const coursesData = responses.map(res => res.data);
      
      // Сбрасываем назначения цветов при изменении курсов
      resetColorAssignments();
      
      // Сохраняем курсы в localStorage
      setSelectedCourses(coursesData);
      
      setState(prev => ({ 
        ...prev, 
        isModalOpen: false,
        isLoading: false
      }));
    } catch (error) { 
      console.error("Ошибка загрузки курсов", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const handleSectionSelect = useCallback((section: EnrichedSection) => {
    if (!activeSchedule) return;

    const newSelected = { ...selectedSectionIds };
    
    if (newSelected[section.id]) {
      delete newSelected[section.id];
      updateActiveSchedule(newSelected);
      return;
    }

    const parentCourse = selectedCourses.find(c => c.code === section.courseCode);
    if (!parentCourse) {
      updateActiveSchedule(newSelected);
      return;
    }

    const selectedSections = allSections.filter(s => selectedSectionIds[s.id]);
    const [maxLectures = 0, maxLabs = 0, maxPractices = 0] = parentCourse.formula.split('/').map(Number);
    
    const currentCounts = selectedSections
      .filter(s => s.courseCode === parentCourse.code)
      .reduce((acc, s) => {
        if (s.type === 'Лекция') acc.lectures++;
        else if (s.type === 'Лабораторная') acc.labs++;
        else if (s.type === 'Практика') acc.practices++;
        return acc;
      }, { lectures: 0, labs: 0, practices: 0 });

    if (section.type === 'Лекция' && currentCounts.lectures >= maxLectures) {
      alert(`Лимит лекций (${maxLectures}) для курса ${parentCourse.code} достигнут.`);
      return;
    }
    if (section.type === 'Лабораторная' && currentCounts.labs >= maxLabs) {
      alert(`Лимит лаб (${maxLabs}) для курса ${parentCourse.code} достигнут.`);
      return;
    }
    if (section.type === 'Практика' && currentCounts.practices >= maxPractices) {
      alert(`Лимит практик (${maxPractices}) для курса ${parentCourse.code} достигнут.`);
      return;
    }

    const conflictingSections = selectedSections.filter(s => 
      s.day === section.day && 
      s.time === section.time &&
      s.id !== section.id
    );

    if (conflictingSections.length > 0) {
      const confirmAdd = confirm(
        `Обнаружен конфликт времени в ${section.day} ${section.time}. Добавить секцию всё равно?`
      );
      if (!confirmAdd) return;
    }

    newSelected[section.id] = true;
    updateActiveSchedule(newSelected);
  }, [selectedCourses, allSections, selectedSectionIds, activeSchedule, updateActiveSchedule]);

  const handleResetSchedule = useCallback(() => {
    if (activeSchedule) {
      updateActiveSchedule({});
    }
    // Сбрасываем назначения цветов при сбросе расписания
    resetColorAssignments();
  }, [activeSchedule, updateActiveSchedule]);

  const openModal = useCallback(() => 
    setState(prev => ({ ...prev, isModalOpen: true })), []);
  
  const closeModal = useCallback(() => 
    setState(prev => ({ ...prev, isModalOpen: false })), []);

  const openComparison = useCallback(() => 
    setState(prev => ({ ...prev, isComparisonOpen: true })), []);
  
  const closeComparison = useCallback(() => 
    setState(prev => ({ ...prev, isComparisonOpen: false })), []);

  const openExport = useCallback((scheduleId: string) => 
    setState(prev => ({ ...prev, exportScheduleId: scheduleId })), []);
  
  const closeExport = useCallback(() => 
    setState(prev => ({ ...prev, exportScheduleId: null })), []);

  const toggleFinalView = useCallback((value: boolean) => 
    setState(prev => ({ ...prev, isFinalView: value })), []);

  const exportSchedule = state.exportScheduleId 
    ? schedules.find(s => s.id === state.exportScheduleId)
    : null;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <Header onFilterClick={openFilterModal} />
      <div className="flex flex-grow overflow-hidden">
        {state.isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="text-white">Загрузка курсов...</div>
          </div>
        )}
        <Sidebar 
          selectedCourses={selectedCourses}
          onAddCourseClick={openModal}
          onResetClick={handleResetSchedule}
          isFinalView={state.isFinalView}
          setIsFinalView={toggleFinalView}
          schedules={schedules}
          activeScheduleId={activeScheduleId}
          onScheduleSelect={setActiveScheduleId}
          onCreateSchedule={createSchedule}
          onDuplicateSchedule={duplicateSchedule}
          onDeleteSchedule={deleteSchedule}
          onCompareSchedules={openComparison}
          onExportSchedule={openExport}
          conflicts={conflicts}
          courseAnalysis={courseAnalysis}
          allSections={allSections}
          recommendations={recommendations}
          onApplyRecommendation={applyRecommendation}
          hiddenCourseCodes={hiddenCourseCodes}
          onToggleCourseVisibility={handleToggleCourseVisibility}
        />
        <main className="flex-grow overflow-auto">
          <ScheduleGrid
            courses={selectedCourses.filter(c => !hiddenCourseCodes.includes(c.code))}
            allSections={filteredSections.length > 0 ? filteredSections : allSections.filter(s => !hiddenCourseCodes.includes(s.courseCode))}
            selectedSectionIds={selectedSectionIds}
            onSectionSelect={handleSectionSelect}
            isFinalView={state.isFinalView}
          />
        </main>
      </div>
      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-700/95 border border-slate-500/50 rounded-3xl shadow-2xl p-8 max-w-lg w-full transition-all duration-300 scale-100">
            <button
              onClick={closeFilterModal}
              className="absolute top-6 right-6 text-slate-300 hover:text-white text-2xl p-2 rounded-full bg-slate-700/70 hover:bg-slate-600/50 transition-all duration-200 border border-slate-500/30"
              aria-label="Закрыть фильтры"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="pt-2 pb-2">
              <ScheduleFilters allSections={allSections} onFiltersChange={handleFiltersChange} />
            </div>
          </div>
        </div>
      )}
      {/* Modals */}
      {state.isModalOpen && (
        <AddCourseModal
          isOpen={state.isModalOpen}
          onClose={closeModal}
          onConfirm={handleConfirmSelection}
          alreadySelectedCodes={selectedCourses.map(c => c.code)}
        />
      )}
      {state.isComparisonOpen && (
        <ScheduleComparison
          schedules={schedules}
          allSections={allSections}
          onClose={closeComparison}
          analyzeConflicts={analyzeConflicts}
        />
      )}
      {exportSchedule && (
        <ScheduleExport
          schedule={exportSchedule}
          allSections={allSections}
          onClose={closeExport}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/builder" element={<BuilderApp />} />
    </Routes>
  );
}

export default App;

 