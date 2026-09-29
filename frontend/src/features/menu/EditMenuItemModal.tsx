import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
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
  Upload,
} from 'lucide-react';

interface EditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem;
  onSuccess: (updatedItem?: MenuItem) => void;
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
  const { t } = useTranslation();

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(menuItem.avatar || null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
      setAvatarFile(null);
      setAvatarPreview(menuItem.avatar || null);
      const rows: IngredientRowState[] = (menuItem.ingredients || []).map((ri) => ({
        ingredient_id: ri.ingredient?.id || ri.ingredient_id || 0,
        quantity_required: ri.quantity_required,
      }));
      setIngredientRows(rows.length > 0 ? rows : [{ ingredient_id: 0, quantity_required: 1 }]);
      setFieldErrors({});
    }
  }, [isOpen, menuItem, initialCatId]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFieldErrors((prev) => ({
        ...prev,
        avatar: 'Invalid file type. Please select an image file.',
      }));
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        avatar: 'Image size exceeds 5MB limit.',
      }));
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.avatar;
      return next;
    });

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

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
      avatar: avatarFile,
    };

    setIsSubmitting(true);

    try {
      const updatedItem = await updateMenuItemApi(menuItem.id, payload);
      showToast(`Menu item "${payload.name}" updated successfully.`, 'success');
      onSuccess(updatedItem);
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
      title={`${t('menu.editMenuItem')}: ${menuItem.name}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Availability Readiness Pill */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-5 h-5 text-red-500 dark:text-red-400" />
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('menu.stockAvailabilityCol')}</p>
            </div>
          </div>
          {menuItem.is_available ? (
            <Badge variant="success" dot={true}>
              {t('menu.available')}
            </Badge>
          ) : (
            <Badge variant="danger" dot={true}>
              {t('menu.unavailable')}
            </Badge>
          )}
        </div>

        {(fieldErrors.detail || fieldErrors.non_field_errors) && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{fieldErrors.detail || fieldErrors.non_field_errors}</span>
          </div>
        )}

        {/* Section 1: Item Basic Details */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">
            {t('menu.menuItemCol')}
          </h4>

          <div>
            <Input
              label={`${t('common.name')} *`}
              name="name"
              required
              disabled={!isOwnerOrManager}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
              }}
              leftIcon={<Tag className="w-4 h-4" />}
              error={fieldErrors.name}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label={`${t('menu.categoryCol')} *`}
                name="category_id"
                required
                disabled={!isOwnerOrManager || isLoadingOptions}
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(Number(e.target.value));
                  if (fieldErrors.category_id) setFieldErrors((prev) => ({ ...prev, category_id: '' }));
                }}
                leftIcon={<FolderTree className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                error={fieldErrors.category_id}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Input
                label={`${t('menu.priceCol')} ($) *`}
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
                leftIcon={<DollarSign className="w-4 h-4" />}
                error={fieldErrors.price}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('common.description')}
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <textarea
                name="description"
                rows={2}
                disabled={!isOwnerOrManager}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-red-400 focus:ring-3 focus:ring-red-50 dark:focus:ring-red-950/40 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Menu Item Photo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Item Photo (Optional)
            </label>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0 shadow-xs">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <UtensilsCrossed className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                {isOwnerOrManager && (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={avatarInputRef}
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Upload className="w-3.5 h-3.5" />}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {avatarFile ? 'Change Photo' : 'Upload New Photo'}
                    </Button>

                    {avatarFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(menuItem.avatar || null);
                          if (avatarInputRef.current) avatarInputRef.current.value = '';
                        }}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 dark:text-slate-400">Supported formats: JPG, PNG, WEBP (Max 5MB)</p>
              </div>
            </div>
            {fieldErrors.avatar && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-semibold mt-1 leading-tight">{fieldErrors.avatar}</p>
            )}
          </div>
        </div>

        {/* Section 2: Recipe Ingredients */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-red-500 dark:text-red-400" />
              <span>{t('menu.recipeCol')} *</span>
            </h4>

            {isOwnerOrManager && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddIngredientRow}
                disabled={allIngredients.length === 0}
              >
                {t('menu.addIngredientToRecipe')}
              </Button>
            )}
          </div>

          {fieldErrors.ingredients && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {fieldErrors.ingredients}
            </div>
          )}

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {ingredientRows.map((row, idx) => {
              const selectedIng = allIngredients.find((i) => i.id === row.ingredient_id);
              const unit = selectedIng ? selectedIng.unit_of_measure : '';

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex-1">
                    <Select
                      label={`${t('inventory.ingredientCol')} #${idx + 1}`}
                      value={row.ingredient_id}
                      disabled={!isOwnerOrManager}
                      onChange={(e) =>
                        handleIngredientRowChange(idx, 'ingredient_id', e.target.value)
                      }
                    >
                      {allIngredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit_of_measure})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="w-36">
                    <Input
                      label={`${t('common.quantity')} (${unit || 'unit'})`}
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      disabled={!isOwnerOrManager}
                      value={row.quantity_required}
                      onChange={(e) =>
                        handleIngredientRowChange(idx, 'quantity_required', e.target.value)
                      }
                    />
                  </div>

                  {isOwnerOrManager && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      disabled={ingredientRows.length <= 1}
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors mt-5 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose}>
            {isOwnerOrManager ? t('common.cancel') : t('common.close')}
          </Button>
          {isOwnerOrManager && (
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<UtensilsCrossed className="w-4 h-4" />}
            >
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
