import React from 'react';

interface BadgeProps {
  variant?: 'premium' | 'elite' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const styles = {
    premium: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-sm font-semibold',
    elite: 'bg-gradient-to-r from-purple-650 to-indigo-700 text-white shadow-sm font-semibold',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
export default Badge;
