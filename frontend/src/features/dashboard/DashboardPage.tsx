import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { getIngredientsApi, getLowStockIngredientsApi } from '../../api/inventory';
import { getStaffListApi } from '../../api/staff';
import type { Ingredient } from '../../types';
import {
  Package,
  AlertTriangle,
  Users,
  UtensilsCrossed,
  ChefHat,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [totalIngredients, setTotalIngredients] = useState<number>(0);
  const [lowStockList, setLowStockList] = useState<Ingredient[]>([]);
  const [totalStaff, setTotalStaff] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const ingredients = await getIngredientsApi();
        setTotalIngredients(ingredients.length);

        const lowStock = await getLowStockIngredientsApi();
        setLowStockList(lowStock);

        if (user?.role === 'owner' || user?.role === 'manager') {
          const staff = await getStaffListApi();
          setTotalStaff(staff.length);
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden glass-card p-8 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-gray-900">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              {user?.role} Portal
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Restaurant Operations Dashboard
          </h1>
          <p className="text-sm text-gray-300 mt-2 max-w-2xl leading-relaxed">
            Monitor active inventory, inspect low stock warnings, audit movements, and manage staff operations.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Active Ingredients"
          value={isLoading ? '...' : totalIngredients}
          subtitle="Monitored items in pantry"
          icon={Package}
          iconColor="text-indigo-400"
        />

        <StatCard
          title="Low Stock Alerts"
          value={isLoading ? '...' : lowStockList.length}
          subtitle="Items below reorder threshold"
          icon={AlertTriangle}
          iconColor="text-rose-400"
          badge={
            lowStockList.length > 0
              ? { text: 'Attention Required', variant: 'danger' }
              : { text: 'All Stock Optimal', variant: 'success' }
          }
        />

        {isOwnerOrManager ? (
          <StatCard
            title="Registered Staff"
            value={isLoading ? '...' : totalStaff}
            subtitle="Active team members"
            icon={Users}
            iconColor="text-purple-400"
          />
        ) : (
          <StatCard
            title="Role Access"
            value={user?.role?.toUpperCase() || ''}
            subtitle="System permission level"
            icon={ChefHat}
            iconColor="text-amber-400"
          />
        )}
      </div>

      {/* Critical Low Stock Warning Widget */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Low Stock Warnings</h3>
              <p className="text-xs text-gray-400">Ingredients requiring immediate replenishment</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View Full Inventory</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {lowStockList.length === 0 ? (
          <div className="p-6 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
            <p className="text-sm font-medium text-emerald-400">
              ✓ All ingredient stock levels are currently above reorder thresholds.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl glass-card border border-rose-500/30 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-white text-sm">{item.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    On Hand:{' '}
                    <span className="font-mono text-rose-400 font-bold">
                      {item.quantity_on_hand} {item.unit_of_measure}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Reorder Threshold: {item.reorder_threshold} {item.unit_of_measure}
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('inventory')}
                  className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors shrink-0"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('inventory')}
          className="p-5 glass-card rounded-2xl border border-gray-800 hover:border-indigo-500/50 text-left transition-all group"
        >
          <Package className="w-6 h-6 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-white text-sm">Browse Ingredients</h4>
          <p className="text-xs text-gray-400 mt-1">Check quantities and unit costs</p>
        </button>

        <button
          onClick={() => onNavigate('movements')}
          className="p-5 glass-card rounded-2xl border border-gray-800 hover:border-purple-500/50 text-left transition-all group"
        >
          <UtensilsCrossed className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-white text-sm">Audit Movements</h4>
          <p className="text-xs text-gray-400 mt-1">Inspect stock movements log</p>
        </button>

        {isOwnerOrManager && (
          <button
            onClick={() => onNavigate('staff')}
            className="p-5 glass-card rounded-2xl border border-gray-800 hover:border-emerald-500/50 text-left transition-all group"
          >
            <Users className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-sm">Manage Staff</h4>
            <p className="text-xs text-gray-400 mt-1">Add staff and handle temp passwords</p>
          </button>
        )}
      </div>
    </div>
  );
};
