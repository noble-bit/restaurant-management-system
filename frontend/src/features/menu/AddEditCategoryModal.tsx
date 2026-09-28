import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
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
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{fieldErrors.detail || fieldErrors.non_field_errors}</span>
          </div>
        )}

        <div>
          <Input
            label={`${t('menu.categoryName')} *`}
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Appetizers, Main Courses, Desserts"
            leftIcon={<Tag className="w-4 h-4" />}
            error={fieldErrors.name}
          />
        </div>

        <div className="flex items-center gap-3 py-1">
          <input
            type="checkbox"
            id="cat_is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-400"
          />
          <label htmlFor="cat_is_active" className="text-xs font-bold text-slate-700 select-none">
            {t('staff.statusActive')}
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<FolderPlus className="w-4 h-4" />}
          >
            {isSubmitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
