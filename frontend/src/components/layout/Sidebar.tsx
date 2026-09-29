import React from 'react';
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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
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
  const { t } = useTranslation();
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

  const sidebarContent = (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500 rounded-2xl text-white shadow-sm shadow-red-500/30 flex items-center justify-center">
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
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto min-h-0 p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
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
              <span>{t(item.translationKey)}</span>
            </button>
          );
        })}
      </nav>

      {/* Role Badge Footer */}
      <div className="p-4 m-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-700 text-red-500 dark:text-red-400 rounded-xl shadow-xs border border-slate-100 dark:border-slate-600">
            <RoleBadgeIcon className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">
              {t('nav.currentRole')}
            </p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{translatedRole}</p>
          </div>
          <Sparkles className="w-4 h-4 text-red-400 ml-auto shrink-0 opacity-60" />
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
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl z-10 flex flex-col min-h-0">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
