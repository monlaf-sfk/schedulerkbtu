import { useState, useCallback } from 'react';
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
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    ...DEFAULT_EXPANDED_SECTIONS,
    ...initialState
  });

  const toggleSection = useCallback((section: keyof ExpandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const expandAll = useCallback(() => {
    setExpandedSections(prev =>
      Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: true
      }), {} as ExpandedSections)
    );
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedSections(prev =>
      Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: false
      }), {} as ExpandedSections)
    );
  }, []);

  return {
    expandedSections,
    toggleSection,
    expandAll,
    collapseAll
  };
};