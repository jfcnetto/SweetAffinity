// Design System Tokens for SweetAffinity.com

export const TOKENS = {
  colors: {
    brand: {
      primary: 'bg-gradient-to-r from-gradient-pink to-gradient-orange',
      pink: '#E30A17',
      orange: '#FF6B6B',
      red: '#9E0810',
    },
    neutral: {
      light: '#F5F5F5',
      dark: '#424242',
      white: '#FFFFFF',
      gray50: '#F9FAFB',
      gray100: '#F3F4F6',
      gray200: '#E5E7EB',
      gray300: '#D1D5DB',
      gray400: '#9CA3AF',
      gray500: '#6B7280',
      gray600: '#4B5563',
      gray700: '#374151',
      gray800: '#1F2937',
      gray900: '#111827',
    },
    status: {
      success: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800/30',
        fill: 'fill-emerald-500',
      },
      warning: {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800/30',
        fill: 'fill-amber-500',
      },
      error: {
        bg: 'bg-rose-50 dark:bg-rose-950/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800/30',
        fill: 'fill-rose-500',
      },
      info: {
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800/30',
        fill: 'fill-blue-500',
      },
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  radius: {
    sm: 'rounded-sm',     // 2px
    md: 'rounded-md',     // 4px
    lg: 'rounded-lg',     // 8px
    xl: 'rounded-xl',     // 12px
    '2xl': 'rounded-2xl', // 16px
    full: 'rounded-full',
  },
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    none: 'shadow-none',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    sizes: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
    },
    weights: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
    },
  },
};
