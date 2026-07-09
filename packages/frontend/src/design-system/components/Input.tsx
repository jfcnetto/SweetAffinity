import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || React.useId();
  
  return (
    <div className="w-full mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wide mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border ${
          error ? 'border-rose-450 focus:ring-rose-500' : 'border-gray-200 focus:ring-purple-550 dark:border-gray-700'
        } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent text-slate-900 dark:text-white transition-all duration-200 ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-rose-500 font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="mt-1 text-xs text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};
export default Input;
