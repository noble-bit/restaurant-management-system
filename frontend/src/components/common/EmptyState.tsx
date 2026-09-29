import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-12 text-center flex flex-col items-center justify-center shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)] ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-400 mb-4">
        {icon || <PackageOpen className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">{description}</p>}
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-5">
          {actionText}
        </Button>
      )}
    </div>
  );
};
