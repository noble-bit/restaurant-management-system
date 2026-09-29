import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { MenuCategory } from '../../types';
import { getMenuCategoriesApi, deleteMenuCategoryApi } from '../../api/menu';
import { AddEditCategoryModal } from './AddEditCategoryModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FolderTree, Plus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';

export const CategoryListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & Delete Confirmation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<MenuCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMenuCategoriesApi();
      setCategories(data);
    } catch (err: unknown) {
      console.error('Failed to fetch menu categories:', err);
      showToast(t('common.error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);

    try {
      await deleteMenuCategoryApi(deletingCategory.id);
      showToast(t('menu.categoryDeletedToast', { name: deletingCategory.name }), 'info');
      setDeletingCategory(null);
      fetchCategories();
    } catch (err: unknown) {
      console.error('Failed to delete category:', err);
      showToast(t('common.error'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <PageHeader
        title={t('menu.categoriesTitle')}
        subtitle={t('menu.catalogSubtitle')}
        icon={<FolderTree className="w-6 h-6" />}
        actions={
          isOwnerOrManager && (
            <Button
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => {
                setEditingCategory(null);
                setIsModalOpen(true);
              }}
            >
              {t('menu.addCategory')}
            </Button>
          )
        }
      />

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
          />
        </div>

        <Button
          variant="outline"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={fetchCategories}
          title={t('inventory.refresh')}
        />
      </div>

      {/* Categories Table */}
      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="w-8 h-8 text-slate-400 dark:text-slate-500" />}
          title={t('menu.noCategories')}
          description={
            searchQuery ? t('menu.noItemsMatching') : t('menu.categoriesTitle')
          }
          actionText={isOwnerOrManager ? t('menu.addCategory') : undefined}
          onAction={
            isOwnerOrManager
              ? () => {
                  setEditingCategory(null);
                  setIsModalOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-slate-700 tracking-wider">
                <tr>
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">{t('menu.categoryName')}</th>
                  <th className="py-4 px-6">{t('common.status')}</th>
                  {isOwnerOrManager && <th className="py-4 px-6 text-right">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-400 dark:text-slate-500 text-xs">#{cat.id}</td>
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100 text-sm">{cat.name}</td>
                    <td className="py-4 px-6">
                      {cat.is_active ? (
                        <Badge variant="success" dot={true}>
                          {t('staff.statusActive')}
                        </Badge>
                      ) : (
                        <Badge variant="neutral" dot={true}>
                          {t('staff.statusInactive')}
                        </Badge>
                      )}
                    </td>
                    {isOwnerOrManager && (
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />}
                            onClick={() => {
                              setEditingCategory(cat);
                              setIsModalOpen(true);
                            }}
                          >
                            {t('common.edit')}
                          </Button>
                          <button
                            onClick={() => setDeletingCategory(cat)}
                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <AddEditCategoryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          categoryToEdit={editingCategory}
          onSuccess={fetchCategories}
        />
      )}

      {/* Confirm Delete Dialog */}
      {deletingCategory && (
        <ConfirmDialog
          isOpen={Boolean(deletingCategory)}
          onClose={() => setDeletingCategory(null)}
          onConfirm={handleConfirmDelete}
          title={t('common.delete')}
          message={t('menu.deleteCategoryConfirm', { name: deletingCategory.name })}
          confirmText={t('common.delete')}
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
