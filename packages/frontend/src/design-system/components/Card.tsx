import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = true,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-5 ${
        hoverEffect ? 'hover:shadow-md transition-all duration-200 group' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
export default Card;
