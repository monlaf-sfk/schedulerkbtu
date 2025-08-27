import React, { memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  readonly title: string;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
  readonly badge?: string | number;
  readonly icon?: React.ReactNode;
  readonly className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = memo(({
  title,
  isExpanded,
  onToggle,
  children,
  badge,
  icon,
  className = ''
}) => (
  <div className={`space-y-2 ${className}`}>
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between text-left font-medium text-white hover:text-gray-300 transition-colors"
      aria-expanded={isExpanded}
      aria-controls={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{title}</span>
        {badge !== undefined && (
          <span className="bg-neutral-600 text-white text-xs px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
    
    {isExpanded && (
      <div 
        id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className="animate-in slide-in-from-top-2 duration-200"
      >
        {children}
      </div>
    )}
  </div>
));

CollapsibleSection.displayName = 'CollapsibleSection';