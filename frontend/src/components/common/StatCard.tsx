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
  iconColor = 'text-red-500',
  badge,
  className = '',
}) => {
  return (
    <div
      className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06)] transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`p-3 rounded-2xl bg-red-50/80 border border-red-100/80 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h4>
          {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
};
