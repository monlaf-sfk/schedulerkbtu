import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { ExpandedSections } from '../types';

interface UseUIStateReturn {
  readonly expandedSections: ExpandedSections;
  readonly toggleSection: (section: keyof ExpandedSections) => void;
  readonly expandAll: () => void;
  readonly collapseAll: () => void;
}

const DEFAULT_EXPANDED_SECTIONS: ExpandedSections = {
  schedules: true,
  courses: true,
  analysis: true,
  recommendations: true,
  filters: false
};

export const useUIState = (
  initialState: Partial<ExpandedSections> = {}
): UseUIStateReturn => {
  const [expandedSections, setExpandedSections] = useLocalStorage<ExpandedSections>(
    'ui_expanded_sections',
    { ...DEFAULT_EXPANDED_SECTIONS, ...initialState }
  );

  const toggleSection = useCallback((section: keyof ExpandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, [setExpandedSections]);

  const expandAll = useCallback(() => {
    setExpandedSections(prev =>
      Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: true
      }), {} as ExpandedSections)
    );
  }, [setExpandedSections]);

  const collapseAll = useCallback(() => {
    setExpandedSections(prev =>
      Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: false
      }), {} as ExpandedSections)
    );
  }, [setExpandedSections]);

  return {
    expandedSections,
    toggleSection,
    expandAll,
    collapseAll
  };
};