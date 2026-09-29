import React from 'react';
import { User as UserIcon } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showOnlineStatus?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  showOnlineStatus = false,
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusDotSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  const getInitials = (n?: string) => {
    if (!n) return '';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div className="relative inline-block shrink-0" onClick={onClick}>
      <div
        className={`${sizeClasses[size]} rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 overflow-hidden shadow-xs ${
          onClick ? 'cursor-pointer hover:ring-2 hover:ring-red-400 transition-all' : ''
        } ${className}`}
      >
        {src ? (
          <img src={src} alt={name || 'User avatar'} className="w-full h-full object-cover" />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          <UserIcon className="w-1/2 h-1/2 text-slate-400 dark:text-slate-500" />
        )}
      </div>

      {showOnlineStatus && (
        <span
          className={`absolute bottom-0 right-0 ${statusDotSizes[size]} bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full ring-1 ring-slate-900/5`}
          title="Online"
        />
      )}
    </div>
  );
};
