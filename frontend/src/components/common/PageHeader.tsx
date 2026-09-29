import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  icon,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)] flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3.5">
        {icon && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl border border-red-100/80 dark:border-red-900/40 shadow-xs shrink-0">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{subtitle}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
};
