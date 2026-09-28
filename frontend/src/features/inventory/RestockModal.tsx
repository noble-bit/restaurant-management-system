import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
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
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">{t('inventory.currentStock')}</p>
            <p className="text-lg font-extrabold text-slate-800 font-mono">
              {ingredient.quantity_on_hand} <span className="text-xs font-semibold text-slate-500">{ingredient.unit_of_measure}</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold text-slate-400">{t('inventory.reorderThresholdCol')}</p>
            <p className="text-sm font-bold text-amber-600 font-mono">
              {ingredient.reorder_threshold} {ingredient.unit_of_measure}
            </p>
          </div>
        </div>

        {conflictError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3 font-medium">
            <AlertOctagon className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold text-rose-800">{t('common.error')}</p>
              <p className="mt-0.5">{conflictError}</p>
            </div>
          </div>
        )}

        <div>
          <Input
            label={`${t('inventory.quantityAdded')} (${ingredient.unit_of_measure}) *`}
            type="number"
            step="0.01"
            min="0.01"
            required
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder="e.g. 50"
            leftIcon={<PlusCircle className="w-5 h-5 text-slate-400" />}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="success"
            isLoading={isSubmitting}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            {isSubmitting ? t('common.loading') : t('common.confirm')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
