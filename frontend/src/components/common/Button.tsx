import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md focus:ring-red-400 active:bg-red-700',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-300',
    outline:
      'border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300 shadow-xs',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 focus:ring-slate-200',
    danger:
      'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 focus:ring-rose-300',
    success:
      'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm focus:ring-emerald-400',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};
