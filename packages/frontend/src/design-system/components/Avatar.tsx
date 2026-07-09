import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  className?: string;
  hasBorderShadow?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  isOnline,
  className = '',
  hasBorderShadow = true,
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-28 h-28 text-3xl',
  };

  const badgeSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizes[size]} rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center ${
          hasBorderShadow ? 'border-2 border-white dark:border-gray-900 shadow-sm' : ''
        }`}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 font-bold dark:text-gray-500 uppercase">
            {alt.charAt(0)}
          </span>
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 ${badgeSizes[size]} rounded-full border border-white dark:border-gray-900 ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-350 dark:bg-slate-650'
          }`}
        />
      )}
    </div>
  );
};
export default Avatar;
