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
      container: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-semibold',
      dot: 'bg-emerald-500',
    },
    danger: {
      container: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 font-semibold',
      dot: 'bg-rose-500',
    },
    warning: {
      container: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 font-semibold',
      dot: 'bg-amber-500',
    },
    primary: {
      container: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200/60 dark:border-red-800/60 font-semibold',
      dot: 'bg-red-500',
    },
    neutral: {
      container: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 font-medium',
      dot: 'bg-slate-400 dark:bg-slate-500',
    },
    info: {
      container: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60 font-semibold',
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
