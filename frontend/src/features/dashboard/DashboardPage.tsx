import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
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
  Sparkles,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
  const roleTranslated = user?.role ? t(`roles.${user.role}`, { defaultValue: user.role }) : '';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="primary">
                {t('dashboard.portalBadge', { role: roleTranslated })}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              {t('dashboard.headerTitle')}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              {t('dashboard.headerDesc')}
            </p>
          </div>

          <Button
            variant="primary"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => onNavigate('new-order')}
            className="shrink-0"
          >
            {t('nav.newOrder')}
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title={t('dashboard.totalActiveIngredients')}
          value={isLoading ? '...' : totalIngredients}
          subtitle={t('dashboard.monitoredItems')}
          icon={Package}
          iconColor="text-red-500"
        />

        <StatCard
          title={t('dashboard.lowStockAlerts')}
          value={isLoading ? '...' : lowStockList.length}
          subtitle={t('dashboard.lowStockSubtitle')}
          icon={AlertTriangle}
          iconColor="text-rose-500"
          badge={
            lowStockList.length > 0
              ? { text: t('dashboard.attentionRequired'), variant: 'danger' }
              : { text: t('dashboard.allStockOptimal'), variant: 'success' }
          }
        />

        {isOwnerOrManager ? (
          <StatCard
            title={t('dashboard.registeredStaff')}
            value={isLoading ? '...' : totalStaff}
            subtitle={t('dashboard.activeTeamMembers')}
            icon={Users}
            iconColor="text-sky-500"
          />
        ) : (
          <StatCard
            title={t('dashboard.roleAccess')}
            value={roleTranslated}
            subtitle={t('dashboard.systemPermission')}
            icon={ChefHat}
            iconColor="text-amber-500"
          />
        )}
      </div>

      {/* Critical Low Stock Warning Widget */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{t('dashboard.lowStockWarnings')}</h3>
              <p className="text-xs text-slate-500">{t('dashboard.ingredientsImmediateReplenish')}</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
          >
            <span>{t('dashboard.viewFullInventory')}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {lowStockList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
            <p className="text-xs font-bold text-emerald-700">
              {t('dashboard.allStockHealthy')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('dashboard.onHand')}:{' '}
                    <span className="font-mono text-rose-600 font-bold">
                      {item.quantity_on_hand} {item.unit_of_measure}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {t('dashboard.reorderThreshold')}: {item.reorder_threshold} {item.unit_of_measure}
                  </p>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onNavigate('inventory')}
                >
                  {t('inventory.restock')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('inventory')}
          className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-red-200 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06)] text-left transition-all duration-200 group"
        >
          <div className="p-3 rounded-2xl bg-red-50 text-red-500 w-fit mb-3 group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">{t('dashboard.browseIngredients')}</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t('dashboard.checkQuantities')}</p>
        </button>

        <button
          onClick={() => onNavigate('movements')}
          className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-red-200 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06)] text-left transition-all duration-200 group"
        >
          <div className="p-3 rounded-2xl bg-slate-100 text-slate-700 w-fit mb-3 group-hover:scale-110 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">{t('dashboard.auditMovements')}</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t('dashboard.inspectMovementsLog')}</p>
        </button>

        {isOwnerOrManager && (
          <button
            onClick={() => onNavigate('staff')}
            className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-red-200 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06)] text-left transition-all duration-200 group"
          >
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">{t('dashboard.manageStaff')}</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t('dashboard.manageStaffDesc')}</p>
          </button>
        )}
      </div>
    </div>
  );
};
