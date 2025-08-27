import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  readonly size?: number;
  readonly className?: string;
  readonly text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({
  size = 24,
  className = '',
  text
}) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="flex flex-col items-center gap-2">
      <Loader2 size={size} className="animate-spin text-blue-400" />
      {text && (
        <p className="text-sm text-gray-400">{text}</p>
      )}
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

interface LoadingOverlayProps {
  readonly isLoading: boolean;
  readonly text?: string;
  readonly children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = memo(({
  isLoading,
  text = 'Загрузка...',
  children
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
        <LoadingSpinner size={32} text={text} />
      </div>
    )}
  </div>
));

LoadingOverlay.displayName = 'LoadingOverlay';