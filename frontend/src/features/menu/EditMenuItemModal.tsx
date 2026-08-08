import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import type {
  Ingredient,
  MenuCategory,
  MenuItem,
  MenuItemIngredientPayload,
  UpdateMenuItemPayload,
} from '../../types';
import { parseApiFieldErrors } from '../../types';
import { getMenuCategoriesApi, updateMenuItemApi } from '../../api/menu';
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
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface EditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem;
  onSuccess: () => void;
  isOwnerOrManager: boolean;
}

interface IngredientRowState {
  ingredient_id: number;
  quantity_required: number | string;
}

export const EditMenuItemModal: React.FC<EditMenuItemModalProps> = ({
  isOpen,
  onClose,
  menuItem,
  onSuccess,
  isOwnerOrManager,
}) => {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);

  const initialCatId =
    typeof menuItem.category === 'object' && menuItem.category !== null
      ? menuItem.category.id
      : Number(menuItem.category || menuItem.category_id || 0);

  // Form State
  const [name, setName] = useState(menuItem.name);
  const [description, setDescription] = useState(menuItem.description || '');
  const [price, setPrice] = useState<number | string>(menuItem.price);
  const [categoryId, setCategoryId] = useState<number>(initialCatId);

  const initialRows: IngredientRowState[] = (menuItem.ingredients || []).map((ri) => ({
    ingredient_id: ri.ingredient?.id || ri.ingredient_id || 0,
    quantity_required: ri.quantity_required,
  }));

  const [ingredientRows, setIngredientRows] = useState<IngredientRowState[]>(
    initialRows.length > 0 ? initialRows : [{ ingredient_id: 0, quantity_required: 1 }]
  );

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
      } catch (err) {
        console.error('Failed to load categories or ingredients for edit modal:', err);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    if (isOpen) {
      loadOptions();
      setName(menuItem.name);
      setDescription(menuItem.description || '');
      setPrice(menuItem.price);
      setCategoryId(initialCatId);
      const rows: IngredientRowState[] = (menuItem.ingredients || []).map((ri) => ({
        ingredient_id: ri.ingredient?.id || ri.ingredient_id || 0,
        quantity_required: ri.quantity_required,
      }));
      setIngredientRows(rows.length > 0 ? rows : [{ ingredient_id: 0, quantity_required: 1 }]);
      setFieldErrors({});
    }
  }, [isOpen, menuItem, initialCatId]);

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

    const compiledIngredients: MenuItemIngredientPayload[] = ingredientRows
      .filter((r) => r.ingredient_id > 0)
      .map((r) => ({
        ingredient_id: Number(r.ingredient_id),
        quantity_required: Number(r.quantity_required),
      }));

    const payload: UpdateMenuItemPayload = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category_id: Number(categoryId),
      ingredients: compiledIngredients,
    };

    setIsSubmitting(true);

    try {
      await updateMenuItemApi(menuItem.id, payload);
      showToast(`Menu item "${payload.name}" updated successfully.`, 'success');
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Menu Item: ${menuItem.name}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Availability Readiness Pill */}
        <div className="flex items-center justify-between p-4 rounded-xl glass-card border border-gray-800">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-xs text-gray-400">Stock Availability Status</p>
              <p className="text-xs font-semibold text-white mt-0.5">
                Calculated based on required recipe ingredient stock
              </p>
            </div>
          </div>
          {menuItem.is_available ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              AVAILABLE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              UNAVAILABLE
            </span>
          )}
        </div>

        {(fieldErrors.detail || fieldErrors.non_field_errors) && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fieldErrors.detail || fieldErrors.non_field_errors}</span>
          </div>
        )}

        {/* Section 1: Item Basic Details */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-2">
            Item Attributes
          </h4>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Item Name *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="name"
                required
                disabled={!isOwnerOrManager}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs disabled:opacity-60 ${
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
                Category *
              </label>
              <div className="relative">
                <FolderTree className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  name="category_id"
                  required
                  disabled={!isOwnerOrManager || isLoadingOptions}
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(Number(e.target.value));
                    if (fieldErrors.category_id) setFieldErrors((prev) => ({ ...prev, category_id: '' }));
                  }}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs bg-gray-900 disabled:opacity-60 ${
                    fieldErrors.category_id ? 'border-rose-500/60' : ''
                  }`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-gray-900">
                      {c.name}
                    </option>
                  ))}
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
                Price ($) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  required
                  disabled={!isOwnerOrManager}
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: '' }));
                  }}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs disabled:opacity-60 ${
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
              Description
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <textarea
                name="description"
                rows={2}
                disabled={!isOwnerOrManager}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Recipe Ingredients */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>Recipe Ingredients * (Required)</span>
            </h4>

            {isOwnerOrManager && (
              <button
                type="button"
                onClick={handleAddIngredientRow}
                disabled={allIngredients.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Ingredient</span>
              </button>
            )}
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
                      Ingredient #{idx + 1}
                    </label>
                    <select
                      value={row.ingredient_id}
                      disabled={!isOwnerOrManager}
                      onChange={(e) =>
                        handleIngredientRowChange(idx, 'ingredient_id', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-gray-900 disabled:opacity-60"
                    >
                      {allIngredients.map((ing) => (
                        <option key={ing.id} value={ing.id} className="bg-gray-900">
                          {ing.name} ({ing.unit_of_measure})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-36">
                    <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-1">
                      Qty ({unit || 'unit'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      disabled={!isOwnerOrManager}
                      value={row.quantity_required}
                      onChange={(e) =>
                        handleIngredientRowChange(idx, 'quantity_required', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs disabled:opacity-60"
                    />
                  </div>

                  {isOwnerOrManager && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      disabled={ingredientRows.length <= 1}
                      className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors mt-4 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                      title="Remove ingredient row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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
            {isOwnerOrManager ? 'Cancel' : 'Close'}
          </button>
          {isOwnerOrManager && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};
