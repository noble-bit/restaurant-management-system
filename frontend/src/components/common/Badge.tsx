import React from 'react';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'primary' | 'neutral' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantClasses: Record<BadgeVariant, { container: string; dot: string }> = {
    success: {
      container: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold',
      dot: 'bg-emerald-500',
    },
    danger: {
      container: 'bg-rose-50 text-rose-700 border border-rose-200/60 font-semibold',
      dot: 'bg-rose-500',
    },
    warning: {
      container: 'bg-amber-50 text-amber-700 border border-amber-200/60 font-semibold',
      dot: 'bg-amber-500',
    },
    primary: {
      container: 'bg-red-50 text-red-600 border border-red-200/60 font-semibold',
      dot: 'bg-red-500',
    },
    neutral: {
      container: 'bg-slate-100 text-slate-700 border border-slate-200/60 font-medium',
      dot: 'bg-slate-400',
    },
    info: {
      container: 'bg-sky-50 text-sky-700 border border-sky-200/60 font-semibold',
      dot: 'bg-sky-500',
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] rounded-full',
    md: 'px-2.5 py-1 text-xs rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${variantClasses[variant].container} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${variantClasses[variant].dot}`} />}
      <span>{children}</span>
    </span>
  );
};
