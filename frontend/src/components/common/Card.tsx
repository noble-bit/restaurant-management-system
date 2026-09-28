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
      className={`bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] ${
        paddingMap[padding]
      } ${
        hoverEffect
          ? 'transition-all duration-200 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] hover:border-slate-200/80 cursor-pointer'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
