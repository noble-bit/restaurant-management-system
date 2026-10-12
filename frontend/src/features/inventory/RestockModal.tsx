import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import type { Ingredient } from '../../types';
import { restockIngredientApi } from '../../api/inventory';
import { useToast } from '../../context/ToastContext';
import { RefreshCw, AlertOctagon, Plus, Minus } from 'lucide-react';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
  onSuccess: () => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  ingredient,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  if (!ingredient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    if (quantity <= 0) {
      setConflictError(t('common.error'));
      return;
    }

    setIsSubmitting(true);

    try {
      await restockIngredientApi(ingredient.id, quantity);
      showToast(
        t('inventory.restockSuccess'),
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { status?: number; data?: { detail?: string } } }).response;

        if (resp?.status === 409) {
          const detailMsg = resp.data?.detail || 'Conflict encountered while processing restock.';
          setConflictError(detailMsg);
          showToast(detailMsg, 'error');
        } else if (resp?.data?.detail) {
          setConflictError(resp.data.detail);
          showToast(resp.data.detail, 'error');
        } else {
          setConflictError(t('common.error'));
          showToast(t('common.error'), 'error');
        }
      } else {
        setConflictError(t('auth.networkError'));
        showToast(t('auth.networkError'), 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('inventory.restock')}: ${ingredient.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-400">{t('inventory.currentStock')}</p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-mono">
              {ingredient.quantity_on_hand} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{ingredient.unit_of_measure}</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-400">{t('inventory.reorderThresholdCol')}</p>
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
              {ingredient.reorder_threshold} {ingredient.unit_of_measure}
            </p>
          </div>
        </div>

        {conflictError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3 font-medium">
            <AlertOctagon className="w-5 h-5 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold text-rose-800 dark:text-rose-200">{t('common.error')}</p>
              <p className="mt-0.5">{conflictError}</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {`${t('inventory.quantityAdded')} (${ingredient.unit_of_measure}) *`}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((prev) => Math.max(0.1, Math.round((prev - 1) * 100) / 100))}
              className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-base transition-colors shrink-0 cursor-pointer active:scale-95"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 50"
                className="text-center font-bold text-base"
              />
            </div>
            <button
              type="button"
              onClick={() => setQuantity((prev) => Math.round((prev + 1) * 100) / 100)}
              className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-base transition-colors shrink-0 cursor-pointer active:scale-95"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {/* Quick preset increments */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mr-1">Quick add:</span>
            {[1, 5, 10, 25, 50].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setQuantity((prev) => Math.round((prev + step) * 100) / 100)}
                className="min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold font-mono transition-colors active:scale-95 cursor-pointer"
              >
                +{step}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="success"
            isLoading={isSubmitting}
            icon={<RefreshCw className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? t('common.loading') : t('common.confirm')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
