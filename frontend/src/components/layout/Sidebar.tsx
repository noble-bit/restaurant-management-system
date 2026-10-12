import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  BellRing,
  Receipt,
  Users,
  Package,
  History,
  UtensilsCrossed,
  UserCheck,
  FolderTree,
  X,
  Sparkles,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  translationKey: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    translationKey: 'nav.dashboard',
    icon: LayoutDashboard,
    roles: ['owner', 'manager', 'chef', 'waiter', 'cashier'],
  },
  {
    id: 'new-order',
    translationKey: 'nav.newOrder',
    icon: ShoppingCart,
    roles: ['owner', 'manager', 'waiter'],
  },
  {
    id: 'orders-kitchen',
    translationKey: 'nav.kitchenQueue',
    icon: ChefHat,
    roles: ['chef', 'manager', 'owner'],
  },
  {
    id: 'orders-ready',
    translationKey: 'nav.readyToServe',
    icon: BellRing,
    roles: ['waiter', 'manager', 'owner'],
  },
  {
    id: 'orders-payments',
    translationKey: 'nav.paymentsQueue',
    icon: Receipt,
    roles: ['cashier', 'manager', 'owner'],
  },
  {
    id: 'order-history',
    translationKey: 'nav.orderHistory',
    icon: History,
    roles: ['owner', 'manager'],
  },
  {
    id: 'menu-items',
    translationKey: 'nav.menuItems',
    icon: UtensilsCrossed,
    roles: ['owner', 'manager', 'chef', 'waiter', 'cashier'],
  },
  {
    id: 'menu-categories',
    translationKey: 'nav.menuCategories',
    icon: FolderTree,
    roles: ['owner', 'manager', 'chef', 'waiter', 'cashier'],
  },
  {
    id: 'inventory',
    translationKey: 'nav.inventory',
    icon: Package,
    roles: ['owner', 'manager', 'chef', 'waiter', 'cashier'],
  },
  {
    id: 'movements',
    translationKey: 'nav.stockMovements',
    icon: History,
    roles: ['owner', 'manager', 'chef', 'waiter', 'cashier'],
  },
  {
    id: 'staff',
    translationKey: 'nav.staffManagement',
    icon: Users,
    roles: ['owner', 'manager'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const role = user?.role || 'waiter';

  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  const roleIconMap: Record<UserRole, React.ComponentType<{ className?: string }>> = {
    owner: UtensilsCrossed,
    manager: UserCheck,
    chef: ChefHat,
    waiter: UtensilsCrossed,
    cashier: Receipt,
  };

  const RoleBadgeIcon = roleIconMap[role] || UtensilsCrossed;
  const translatedRole = user?.role ? t(`roles.${user.role}`, { defaultValue: user.role }) : '';
  const currentLang = i18n.language.startsWith('am') ? 'am' : 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'am' ? 'en' : 'am';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('i18nextLng', nextLang);
  };

  // Lock body scroll on mobile when drawer is open
  useEffect(() => {
    if (isOpenMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpenMobile]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenMobile && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenMobile, onCloseMobile]);

  const sidebarContent = (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      {/* Brand Header */}
      <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500 rounded-2xl text-white shadow-sm shadow-red-500/30 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg leading-tight">
              Gourmet<span className="text-red-500">Control</span>
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{t('nav.subBrand')}</p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto overscroll-contain min-h-0 p-3 sm:p-4 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {t('nav.navigation')}
        </div>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 min-h-[44px] rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100/80 dark:border-red-900/40 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isActive
                    ? 'bg-red-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate">{t(item.translationKey)}</span>
            </button>
          );
        })}
      </nav>

      {/* Drawer Bottom: Quick Controls (Mobile) & Role Badge */}
      <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2.5">
        {/* Quick controls on mobile screens */}
        <div className="lg:hidden grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span>Dark</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center justify-center gap-2 p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4 text-red-500" />
            <span>{currentLang === 'am' ? 'English' : 'አማርኛ'}</span>
          </button>
        </div>

        {/* Role Badge Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-700 text-red-500 dark:text-red-400 rounded-xl shadow-xs border border-slate-100 dark:border-slate-600 shrink-0">
              <RoleBadgeIcon className="w-4 h-4" />
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">
                {t('nav.currentRole')}
              </p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{translatedRole}</p>
            </div>
            <Sparkles className="w-4 h-4 text-red-400 ml-auto shrink-0 opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 h-screen sticky top-0 z-40 shrink-0 min-h-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl z-10 flex flex-col min-h-0 transform transition-transform ease-out duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
