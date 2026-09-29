import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge, type BadgeVariant } from './Badge';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  badge?: {
    text: string;
    variant: BadgeVariant;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-red-500 dark:text-red-400',
  badge,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)] flex flex-col justify-between hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.4)] transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
        <div className={`p-3 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border border-red-100/80 dark:border-red-900/40 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{value}</h4>
          {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
        </div>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
};
