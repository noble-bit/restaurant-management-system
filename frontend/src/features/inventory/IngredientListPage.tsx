import React, { useEffect, useState, useCallback } from 'react';
import type { Ingredient } from '../../types';
import { getIngredientsApi, getLowStockIngredientsApi, deleteIngredientApi } from '../../api/inventory';
import { AddEditIngredientModal } from './AddEditIngredientModal';
import { RestockModal } from './RestockModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Plus,
  AlertTriangle,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Scale,
  DollarSign,
} from 'lucide-react';

export const IngredientListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // Modals & Confirmation State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockingIngredient, setRestockingIngredient] = useState<Ingredient | null>(null);

  const [deactivatingIngredient, setDeactivatingIngredient] = useState<Ingredient | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const fetchIngredients = useCallback(async () => {
    setIsLoading(true);
    try {
      if (showOnlyLowStock) {
        const data = await getLowStockIngredientsApi();
        setIngredients(data);
      } else {
        const data = await getIngredientsApi();
        setIngredients(data);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch ingredients:', err);
      showToast(t('inventory.loadFailedToast'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showOnlyLowStock, showToast, t]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleConfirmDeactivate = async () => {
    if (!deactivatingIngredient) return;
    setIsDeactivating(true);

    try {
      await deleteIngredientApi(deactivatingIngredient.id);
      showToast(t('inventory.deactivatedToast', { name: deactivatingIngredient.name }), 'info');
      setDeactivatingIngredient(null);
      fetchIngredients();
    } catch (err: unknown) {
      console.error('Failed to delete ingredient:', err);
      showToast(t('inventory.deactivateFailedToast'), 'error');
    } finally {
      setIsDeactivating(false);
    }
  };

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = ingredients.filter((i) => i.is_low_stock).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <PageHeader
        title={t('inventory.ingredientsTitle')}
        subtitle={t('inventory.subtitle')}
        icon={<Package className="w-6 h-6" />}
        actions={
          isOwnerOrManager && (
            <Button
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => {
                setEditingIngredient(null);
                setIsAddEditModalOpen(true);
              }}
            >
              {t('inventory.addIngredient')}
            </Button>
          )
        }
      />

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Low Stock Toggle Button */}
          <Button
            variant={showOnlyLowStock ? 'danger' : 'outline'}
            icon={<AlertTriangle className="w-4 h-4" />}
            onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
          >
            <span>{t('inventory.lowStockFilter')}</span>
            {lowStockCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-500 text-white shadow-xs">
                {lowStockCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchIngredients}
            title={t('inventory.refresh')}
          />
        </div>
      </div>

      {/* Ingredients Table */}
      {isLoading ? (
        <LoadingSpinner text={t('inventory.loading')} />
      ) : filteredIngredients.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-slate-400 dark:text-slate-500" />}
          title={t('inventory.noIngredientsTitle')}
          description={
            showOnlyLowStock
              ? t('inventory.noLowStockMsg')
              : t('inventory.noIngredientsMsg')
          }
          actionText={isOwnerOrManager ? t('inventory.addIngredient') : undefined}
          onAction={
            isOwnerOrManager
              ? () => {
                  setEditingIngredient(null);
                  setIsAddEditModalOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-slate-700 tracking-wider">
                <tr>
                  <th className="py-4 px-6">{t('inventory.ingredientCol')}</th>
                  <th className="py-4 px-6">{t('inventory.quantityOnHandCol')}</th>
                  <th className="py-4 px-6">{t('inventory.reorderThresholdCol')}</th>
                  <th className="py-4 px-6">{t('inventory.costPerUnitCol')}</th>
                  <th className="py-4 px-6">{t('inventory.statusBadgeCol')}</th>
                  {isOwnerOrManager && <th className="py-4 px-6 text-right">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                {filteredIngredients.map((item) => {
                  const isLow = item.is_low_stock;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isLow
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100 text-sm">
                        <span>{item.name}</span>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm font-bold">
                        <span className={isLow ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                          {item.quantity_on_hand}
                        </span>{' '}
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {item.unit_of_measure}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>
                            {item.reorder_threshold} {item.unit_of_measure}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-mono">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{Number(item.cost_per_unit).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {isLow ? (
                          <Badge variant="danger" dot={true}>
                            {t('inventory.lowStockAlert')}
                          </Badge>
                        ) : (
                          <Badge variant="success" dot={true}>
                            {t('inventory.optimalLevel')}
                          </Badge>
                        )}
                      </td>
                      {isOwnerOrManager && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Restock Button */}
                            <Button
                              variant="success"
                              size="sm"
                              icon={<RefreshCw className="w-3.5 h-3.5" />}
                              onClick={() => {
                                setRestockingIngredient(item);
                                setIsRestockModalOpen(true);
                              }}
                            >
                              {t('inventory.restock')}
                            </Button>

                            {/* Edit Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Edit2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />}
                              onClick={() => {
                                setEditingIngredient(item);
                                setIsAddEditModalOpen(true);
                              }}
                            >
                              {t('common.edit')}
                            </Button>

                            {/* Delete/Deactivate Button */}
                            <button
                              onClick={() => setDeactivatingIngredient(item)}
                              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isAddEditModalOpen && (
        <AddEditIngredientModal
          isOpen={isAddEditModalOpen}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setEditingIngredient(null);
          }}
          ingredientToEdit={editingIngredient}
          onSuccess={fetchIngredients}
        />
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && (
        <RestockModal
          isOpen={isRestockModalOpen}
          onClose={() => {
            setIsRestockModalOpen(false);
            setRestockingIngredient(null);
          }}
          ingredient={restockingIngredient}
          onSuccess={fetchIngredients}
        />
      )}

      {/* Confirm Deactivate Dialog */}
      {deactivatingIngredient && (
        <ConfirmDialog
          isOpen={Boolean(deactivatingIngredient)}
          onClose={() => setDeactivatingIngredient(null)}
          onConfirm={handleConfirmDeactivate}
          title={t('common.delete')}
          message={t('inventory.deactivateConfirm', { name: deactivatingIngredient.name })}
          confirmText={t('common.delete')}
          variant="danger"
          isLoading={isDeactivating}
        />
      )}
    </div>
  );
};
