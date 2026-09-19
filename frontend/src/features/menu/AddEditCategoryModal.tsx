import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/common/Modal';
import type { CreateMenuCategoryPayload, MenuCategory } from '../../types';
import { parseApiFieldErrors } from '../../types';
import { createMenuCategoryApi, updateMenuCategoryApi } from '../../api/menu';
import { useToast } from '../../context/ToastContext';
import { FolderPlus, Tag, AlertCircle } from 'lucide-react';

interface AddEditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: MenuCategory | null;
  onSuccess: () => void;
}

export const AddEditCategoryModal: React.FC<AddEditCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const isEditing = Boolean(categoryToEdit);

  const [formData, setFormData] = useState<CreateMenuCategoryPayload>({
    name: '',
    display_order: 0,
    is_active: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (categoryToEdit) {
      setFormData({
        name: categoryToEdit.name,
        display_order: categoryToEdit.display_order ?? 0,
        is_active: categoryToEdit.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        display_order: 0,
        is_active: true,
      });
    }
    setFieldErrors({});
  }, [categoryToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'display_order' ? Number(value) : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setIsSubmitting(true);

    const payload: CreateMenuCategoryPayload = {
      name: formData.name.trim(),
      display_order: Math.max(0, parseInt(String(formData.display_order), 10) || 0),
      is_active: formData.is_active,
    };

    try {
      if (isEditing && categoryToEdit) {
        await updateMenuCategoryApi(categoryToEdit.id, payload);
        showToast(`Category "${payload.name}" updated successfully.`, 'success');
      } else {
        await createMenuCategoryApi(payload);
        showToast(`Category "${payload.name}" created successfully.`, 'success');
      }
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
      title={isEditing ? `${t('menu.editCategory')}: ${categoryToEdit?.name}` : t('menu.addCategory')}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {(fieldErrors.detail || fieldErrors.non_field_errors) && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fieldErrors.detail || fieldErrors.non_field_errors}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            {t('menu.categoryName')} *
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Appetizers, Main Courses, Desserts"
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

        <div className="flex items-center gap-3 py-1">
          <input
            type="checkbox"
            id="cat_is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="cat_is_active" className="text-xs font-semibold text-gray-300">
            {t('staff.statusActive')}
          </label>
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
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{isSubmitting ? t('common.saving') : t('common.save')}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
