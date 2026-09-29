import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  padding = 'md',
  hoverEffect = false,
}) => {
  const paddingMap = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)] ${
        paddingMap[padding]
      } ${
        hoverEffect
          ? 'transition-all duration-200 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] hover:border-slate-200/80 dark:hover:border-slate-600 cursor-pointer'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
