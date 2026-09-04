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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[]; // Which roles can see this tab
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['owner', 'manager', 'chef', 'waiter', 'cashier'],
  },
  {
    id: 'new-order',
    label: 'New Order',
    icon: ShoppingCart,
    roles: ['owner', 'manager', 'waiter'],
  },
  {
    id: 'orders-kitchen',
    label: 'Kitchen Queue',
    icon: ChefHat,
    roles: ['chef', 'manager', 'owner'],
  },
  {
    id: 'orders-ready',
    label: 'Ready to Serve',
    icon: BellRing,
    roles: ['waiter', 'manager', 'owner'],
  },
  {
    id: 'orders-payments',
    label: 'Payments Queue',
    icon: Receipt,
    roles: ['cashier', 'manager', 'owner'],
  },
  {
    id: 'menu-items',
    label: 'Menu Items',
    icon: UtensilsCrossed,
    roles: ['owner', 'manager', 'chef', 'waiter', 'cashier'],
  },
  {
    id: 'menu-categories',
    label: 'Menu Categories',
    icon: FolderTree,
    roles: ['owner', 'manager', 'chef', 'waiter', 'cashier'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    roles: ['owner', 'manager', 'chef', 'waiter', 'cashier'],
  },
  {
    id: 'movements',
    label: 'Stock Movements',
    icon: History,
    roles: ['owner', 'manager', 'chef', 'waiter', 'cashier'],
  },
  {
    id: 'staff',
    label: 'Staff Management',
    icon: Users,
    roles: ['owner', 'manager'], // Staff Management: Visible ONLY to owner and manager
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user } = useAuth();
  const role = user?.role || 'waiter';

  // Filter navigation links dynamically based on user role
  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  const roleIconMap: Record<UserRole, React.ComponentType<{ className?: string }>> = {
    owner: UtensilsCrossed,
    manager: UserCheck,
    chef: ChefHat,
    waiter: UtensilsCrossed,
    cashier: Receipt,
  };

  const RoleBadgeIcon = roleIconMap[role] || UtensilsCrossed;

  return (
    <aside className="w-64 glass-panel border-r border-gray-800/80 flex flex-col justify-between h-screen sticky top-0 z-40">
      <div>
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-800/80">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-lg">GourmetControl</h1>
            <p className="text-xs text-indigo-400 font-medium">Restaurant Suite</p>
          </div>
        </div>

        {/* Dynamic Navigation */}
        <nav className="p-4 space-y-1.5 mt-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Menu Navigation
          </div>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/50 font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Badge Footer */}
      <div className="p-4 m-4 glass-card rounded-xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <RoleBadgeIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Current Role</p>
            <p className="text-sm font-bold capitalize text-white">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
