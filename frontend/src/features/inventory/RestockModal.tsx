import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/common/Modal';
import type { Ingredient } from '../../types';
import { restockIngredientApi } from '../../api/inventory';
import { useToast } from '../../context/ToastContext';
import { RefreshCw, PlusCircle, AlertOctagon } from 'lucide-react';

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
        <div className="p-4 rounded-xl glass-card border border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{t('inventory.currentStock')}</p>
            <p className="text-lg font-bold text-white">
              {ingredient.quantity_on_hand} <span className="text-xs font-medium text-gray-400">{ingredient.unit_of_measure}</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400">{t('inventory.reorderThresholdCol')}</p>
            <p className="text-sm font-semibold text-amber-400">
              {ingredient.reorder_threshold} {ingredient.unit_of_measure}
            </p>
          </div>
        </div>

        {conflictError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">{t('common.error')}</p>
              <p className="mt-0.5">{conflictError}</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {t('inventory.quantityAdded')} ({ingredient.unit_of_measure}) *
          </label>
          <div className="relative">
            <PlusCircle className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="e.g. 50"
              className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm font-bold text-emerald-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>{isSubmitting ? t('common.loading') : t('common.confirm')}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
