import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { StockMovement, MovementReason } from '../../types';
import { getStockMovementsApi } from '../../api/inventory';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { History, TrendingUp, TrendingDown, RefreshCw, Filter } from 'lucide-react';

export const StockMovementsPage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReason, setSelectedReason] = useState<string>('all');

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStockMovementsApi();
      setMovements(data);
    } catch (err: unknown) {
      console.error('Failed to fetch stock movements:', err);
      showToast(t('common.error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const filteredMovements = movements.filter(
    (m) => selectedReason === 'all' || m.reason === selectedReason
  );

  const getReasonBadge = (reason: MovementReason) => {
    const map: Record<MovementReason, { variant: 'success' | 'info' | 'danger' | 'warning'; labelKey: string }> = {
      restock: { variant: 'success', labelKey: 'inventory.restock' },
      order_deduction: { variant: 'info', labelKey: 'inventory.orderDeduction' },
      waste: { variant: 'danger', labelKey: 'inventory.waste' },
      correction: { variant: 'warning', labelKey: 'inventory.correction' },
    };
    const info = map[reason] || { variant: 'neutral', labelKey: reason };
    return (
      <Badge variant={info.variant}>
        {t(info.labelKey, { defaultValue: reason })}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <PageHeader
        title={t('inventory.stockMovementsTitle')}
        subtitle={t('inventory.subtitle')}
        icon={<History className="w-6 h-6" />}
        actions={
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchMovements}
          >
            {t('inventory.refreshBtn')}
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-64">
          <Select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            leftIcon={<Filter className="w-4 h-4 text-slate-400" />}
          >
            <option value="all">{t('inventory.allReasons')}</option>
            <option value="restock">{t('inventory.restock')}</option>
            <option value="order_deduction">{t('inventory.orderDeduction')}</option>
            <option value="waste">{t('inventory.waste')}</option>
            <option value="correction">{t('inventory.correction')}</option>
          </Select>
        </div>

        <p className="text-xs text-slate-500 font-semibold">
          {t('inventory.showingCount', { count: filteredMovements.length })}
        </p>
      </div>

      {/* Movements Table */}
      {isLoading ? (
        <LoadingSpinner text={t('inventory.loading')} />
      ) : filteredMovements.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-slate-400" />}
          title={t('inventory.noMovementsTitle')}
          description={t('inventory.noMovementsDesc')}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold border-b border-slate-100 tracking-wider">
                <tr>
                  <th className="py-4 px-6">{t('inventory.timestampCol')}</th>
                  <th className="py-4 px-6">{t('inventory.ingredientRefCol')}</th>
                  <th className="py-4 px-6">{t('inventory.quantityDeltaCol')}</th>
                  <th className="py-4 px-6">{t('inventory.movementReasonCol')}</th>
                  <th className="py-4 px-6">{t('inventory.recordedByCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredMovements.map((item) => {
                  const numDelta = Number(item.quantity_delta);
                  const isPositive = numDelta > 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {item.ingredient_name || t('inventory.ingredientId', { id: item.ingredient })}
                      </td>
                      <td className="py-4 px-6 font-mono text-sm font-bold">
                        <div className="flex items-center gap-1.5">
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-rose-500" />
                          )}
                          <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                            {isPositive ? `+${numDelta}` : numDelta}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">{getReasonBadge(item.reason)}</td>
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {item.staff_name || (item.staff ? t('inventory.staffId', { id: item.staff }) : t('inventory.systemAutomated'))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
