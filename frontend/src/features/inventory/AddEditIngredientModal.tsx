import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import type { CreateIngredientPayload, Ingredient, UnitOfMeasure } from '../../types';
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
        showToast(`Ingredient "${formData.name}" updated successfully.`, 'success');
      } else {
        await createIngredientApi(formData);
        showToast(`Ingredient "${formData.name}" created successfully.`, 'success');
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
          setError('Failed to save ingredient.');
        }
      } else {
        setError('Network error. Please check backend.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Ingredient: ${ingredientToEdit?.name}` : 'Add New Ingredient'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Ingredient Name *
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Extra Virgin Olive Oil"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Unit of Measure *
            </label>
            <div className="relative">
              <Scale className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                name="unit_of_measure"
                value={formData.unit_of_measure}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs bg-gray-900"
              >
                <option value="g" className="bg-gray-900">Grams (g)</option>
                <option value="kg" className="bg-gray-900">Kilograms (kg)</option>
                <option value="l" className="bg-gray-900">Liters (l)</option>
                <option value="ml" className="bg-gray-900">Milliliters (ml)</option>
                <option value="pcs" className="bg-gray-900">Pieces (pcs)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Reorder Threshold *
            </label>
            <input
              type="number"
              name="reorder_threshold"
              step="0.01"
              min="0"
              required
              value={formData.reorder_threshold}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Cost Per Unit ($) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                name="cost_per_unit"
                step="0.01"
                min="0"
                required
                value={formData.cost_per_unit}
                onChange={handleChange}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 italic bg-gray-900/50 p-3 rounded-xl border border-gray-800">
          Note: Quantity on hand is omitted from creation/edit forms for audit compliance. Use the Restock action to update stock quantities.
        </p>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <PackagePlus className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Ingredient'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
