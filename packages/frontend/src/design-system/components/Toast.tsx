import { toast as hotToast } from 'react-hot-toast';

export const toast = {
  success: (message: string) => {
    hotToast.success(message, {
      className: 'bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 rounded-xl border border-emerald-100 dark:border-emerald-950/20 shadow-lg text-sm font-medium',
      iconTheme: {
        primary: '#10B981',
        secondary: '#FFFFFF',
      },
    });
  },
  error: (message: string) => {
    hotToast.error(message, {
      className: 'bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 rounded-xl border border-rose-100 dark:border-rose-950/20 shadow-lg text-sm font-medium',
      iconTheme: {
        primary: '#EF4444',
        secondary: '#FFFFFF',
      },
    });
  },
  info: (message: string) => {
    hotToast(message, {
      className: 'bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 rounded-xl border border-blue-100 dark:border-blue-950/20 shadow-lg text-sm font-medium',
      icon: 'ℹ️',
    });
  },
};

export default toast;
