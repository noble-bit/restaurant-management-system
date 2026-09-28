import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import type { CreateIngredientPayload, Ingredient } from '../../types';
import { createIngredientApi, updateIngredientApi } from '../../api/inventory';
import { useToast } from '../../context/ToastContext';
import { PackagePlus, Tag, Scale, DollarSign, AlertCircle } from 'lucide-react';

interface AddEditIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredientToEdit?: Ingredient | null;
  onSuccess: () => void;
}

export const AddEditIngredientModal: React.FC<AddEditIngredientModalProps> = ({
  isOpen,
  onClose,
  ingredientToEdit,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const isEditing = Boolean(ingredientToEdit);

  const [formData, setFormData] = useState<CreateIngredientPayload>({
    name: '',
    unit_of_measure: 'g',
    reorder_threshold: 10,
    cost_per_unit: 1.0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ingredientToEdit) {
      setFormData({
        name: ingredientToEdit.name,
        unit_of_measure: ingredientToEdit.unit_of_measure,
        reorder_threshold: Number(ingredientToEdit.reorder_threshold),
        cost_per_unit: Number(ingredientToEdit.cost_per_unit),
      });
    } else {
      setFormData({
        name: '',
        unit_of_measure: 'g',
        reorder_threshold: 10,
        cost_per_unit: 1.0,
      });
    }
  }, [ingredientToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'reorder_threshold' || name === 'cost_per_unit' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEditing && ingredientToEdit) {
        await updateIngredientApi(ingredientToEdit.id, formData);
        showToast(t('inventory.ingredientUpdatedToast', { name: formData.name }), 'success');
      } else {
        await createIngredientApi(formData);
        showToast(t('inventory.ingredientCreatedToast', { name: formData.name }), 'success');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: Record<string, string[]> } }).response;
        if (resp?.data) {
          const firstErrKey = Object.keys(resp.data)[0];
          const firstErrVal = resp.data[firstErrKey];
          setError(`${firstErrKey}: ${Array.isArray(firstErrVal) ? firstErrVal.join(' ') : firstErrVal}`);
        } else {
          setError(t('common.error'));
        }
      } else {
        setError(t('auth.networkError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('inventory.editTitle', { name: ingredientToEdit?.name }) : t('inventory.addTitle')}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Input
            label={`${t('inventory.ingredientNameLabel')} *`}
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder={t('inventory.ingredientNamePlaceholder')}
            leftIcon={<Tag className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Select
              label={`${t('inventory.unitOfMeasureLabel')} *`}
              name="unit_of_measure"
              value={formData.unit_of_measure}
              onChange={handleChange}
              leftIcon={<Scale className="w-4 h-4 text-slate-400" />}
            >
              <option value="g">Grams (g)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="l">Liters (l)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="pcs">Pieces (pcs)</option>
            </Select>
          </div>

          <div>
            <Input
              label={`${t('inventory.reorderThresholdLabel')} *`}
              type="number"
              name="reorder_threshold"
              step="0.01"
              min="0"
              required
              value={formData.reorder_threshold}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label={`${t('inventory.costPerUnitLabel')} *`}
              type="number"
              name="cost_per_unit"
              step="0.01"
              min="0"
              required
              value={formData.cost_per_unit}
              onChange={handleChange}
              leftIcon={<DollarSign className="w-4 h-4" />}
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
          {t('inventory.auditNote')}
        </p>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<PackagePlus className="w-4 h-4" />}
          >
            {isSubmitting ? t('common.saving') : isEditing ? t('inventory.saveChanges') : t('inventory.createIngredient')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
