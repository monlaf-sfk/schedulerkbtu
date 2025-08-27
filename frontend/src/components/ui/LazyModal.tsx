import React, { Suspense, lazy, type ComponentType } from 'react';

interface LazyModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalComponent: () => Promise<{ default: ComponentType<any> }>;
  modalProps?: any;
  fallback?: React.ReactNode;
}

const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-8 shadow-2xl">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
        <span className="text-gray-700">Загрузка...</span>
      </div>
    </div>
  </div>
);

export const LazyModal: React.FC<LazyModalProps> = ({
  isOpen,
  onClose,
  modalComponent,
  modalProps = {},
  fallback = <LoadingSpinner />
}) => {
  if (!isOpen) return null;

  const LazyComponent = lazy(modalComponent);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent isOpen={isOpen} onClose={onClose} {...modalProps} />
    </Suspense>
  );
};