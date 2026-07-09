import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  variant?: 'light' | 'dark';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  variant = 'light',
}) => {
  if (!isOpen) return null;

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Content wrapper */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className={`w-full ${widths[maxWidth]} transform overflow-hidden rounded-3xl ${
            variant === 'dark'
              ? 'bg-slate-950 text-white border-slate-900 shadow-2xl'
              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/50'
          } p-8 text-left align-middle shadow-2xl transition-all duration-300 border scale-100`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between border-b ${
            variant === 'dark' ? 'border-gray-850' : 'border-gray-100 dark:border-gray-700/50'
          } pb-3 mb-4`}>
            {title && (
              <h3 className="text-lg font-bold leading-none">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className={`text-gray-400 hover:text-gray-250 transition-colors p-1.5 rounded-full ${
                variant === 'dark' ? 'hover:bg-slate-900' : 'hover:bg-gray-55 dark:hover:bg-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto max-h-[75vh]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Modal;
