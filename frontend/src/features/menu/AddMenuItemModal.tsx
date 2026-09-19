import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/common/Modal';
import type {
  CreateMenuItemPayload,
  Ingredient,
  MenuCategory,
  MenuItemIngredientPayload,
} from '../../types';
import { parseApiFieldErrors } from '../../types';
import { createMenuItemApi, getMenuCategoriesApi } from '../../api/menu';
import { getIngredientsApi } from '../../api/inventory';
import { useToast } from '../../context/ToastContext';
import {
  UtensilsCrossed,
  Tag,
  DollarSign,
  FolderTree,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Scale,
} from 'lucide-react';

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface IngredientRowState {
  ingredient_id: number;
  quantity_required: number | string;
}

export const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>(0);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [ingredientRows, setIngredientRows] = useState<IngredientRowState[]>([
    { ingredient_id: 0, quantity_required: 1 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [cats, ings] = await Promise.all([getMenuCategoriesApi(), getIngredientsApi()]);
        setCategories(cats);
        setAllIngredients(ings);

        if (cats.length > 0) {
          setCategoryId(cats[0].id);
        }
        if (ings.length > 0) {
          setIngredientRows([{ ingredient_id: ings[0].id, quantity_required: 1 }]);
        }
      } catch (err) {
        console.error('Failed to load menu categories or ingredients:', err);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    if (isOpen) {
      loadOptions();
      setName('');
      setDescription('');
      setPrice(0);
      setFieldErrors({});
    }
  }, [isOpen]);

  const handleAddIngredientRow = () => {
    const defaultIngId = allIngredients.length > 0 ? allIngredients[0].id : 0;
    setIngredientRows((prev) => [...prev, { ingredient_id: defaultIngId, quantity_required: 1 }]);
    if (fieldErrors.ingredients) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.ingredients;
        return next;
      });
    }
  };

  const handleRemoveIngredientRow = (index: number) => {
    setIngredientRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIngredientRowChange = (
    index: number,
    field: keyof IngredientRowState,
    value: string | number
  ) => {
    setIngredientRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'ingredient_id' ? Number(value) : value,
      };
      return updated;
    });
    if (fieldErrors.ingredients) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.ingredients;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!categoryId) {
      setFieldErrors({ category_id: 'Please select a valid menu category.' });
      return;
    }

    const compiledIngredients: MenuItemIngredientPayload[] = ingredientRows
      .filter((r) => r.ingredient_id > 0)
      .map((r) => ({
        ingredient_id: Number(r.ingredient_id),
        quantity_required: Number(r.quantity_required),
      }));

    const payload: CreateMenuItemPayload = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category_id: Number(categoryId),
      ingredients: compiledIngredients,
    };

    setIsSubmitting(true);

    try {
      await createMenuItemApi(payload);
      showToast(`Menu item "${payload.name}" created successfully.`, 'success');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const parsedErrors = parseApiFieldErrors(err);
      setFieldErrors(parsedErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('menu.addMenuItem')} maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {(fieldErrors.detail || fieldErrors.non_field_errors) && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fieldErrors.detail || fieldErrors.non_field_errors}</span>
          </div>
        )}

        {/* Section 1: Item Basic Details */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-2">
            {t('menu.menuItemCol')}
          </h4>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {t('common.name')} *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Margherita Pizza"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs ${
                  fieldErrors.name ? 'border-rose-500/60 focus:border-rose-500' : ''
                }`}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.name}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {t('menu.categoryCol')} *
              </label>
              <div className="relative">
                <FolderTree className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  name="category_id"
                  required
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(Number(e.target.value));
                    if (fieldErrors.category_id) setFieldErrors((prev) => ({ ...prev, category_id: '' }));
                  }}
                  disabled={isLoadingOptions}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs bg-gray-900 ${
                    fieldErrors.category_id ? 'border-rose-500/60' : ''
                  }`}
                >
                  {categories.length === 0 ? (
                    <option value={0}>No categories available</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-gray-900">
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {fieldErrors.category_id && (
                <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.category_id}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {t('menu.priceCol')} ($) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: '' }));
                  }}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs ${
                    fieldErrors.price ? 'border-rose-500/60 focus:border-rose-500' : ''
                  }`}
                />
              </div>
              {fieldErrors.price && (
                <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.price}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {t('common.description')}
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <textarea
                name="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Recipe Ingredients */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>{t('menu.recipeCol')} *</span>
            </h4>

            <button
              type="button"
              onClick={handleAddIngredientRow}
              disabled={allIngredients.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('menu.addIngredientToRecipe')}</span>
            </button>
          </div>

          {fieldErrors.ingredients && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fieldErrors.ingredients}</span>
            </div>
          )}

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {ingredientRows.map((row, idx) => {
              const selectedIng = allIngredients.find((i) => i.id === row.ingredient_id);
              const unit = selectedIng ? selectedIng.unit_of_measure : '';

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl glass-card border border-gray-800"
                >
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">
                      {t('inventory.ingredientCol')} #{idx + 1}
                    </label>
                    <select
                      value={row.ingredient_id}
                      onChange={(e) =>
                        handleIngredientRowChange(idx, 'ingredient_id', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-gray-900"
                    >
                      {allIngredients.length === 0 ? (
                        <option value={0}>No ingredients available</option>
                      ) : (
                        allIngredients.map((ing) => (
                          <option key={ing.id} value={ing.id} className="bg-gray-900">
                            {ing.name} ({ing.unit_of_measure})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="w-36">
                    <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">
                      {t('common.quantity')} ({unit || 'unit'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={row.quantity_required}
                      onChange={(e) =>
                        handleIngredientRowChange(idx, 'quantity_required', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveIngredientRow(idx)}
                    disabled={ingredientRows.length <= 1}
                    className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors mt-4 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
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
            disabled={isSubmitting || categories.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>{isSubmitting ? t('common.saving') : t('menu.addMenuItem')}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
