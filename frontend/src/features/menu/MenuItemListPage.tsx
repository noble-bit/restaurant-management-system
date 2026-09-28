import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { MenuCategory, MenuItem } from '../../types';
import { getMenuItemsApi, getMenuCategoriesApi, deleteMenuItemApi } from '../../api/menu';
import { AddMenuItemModal } from './AddMenuItemModal';
import { EditMenuItemModal } from './EditMenuItemModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  DollarSign,
  Filter,
  Eye,
  Scale,
} from 'lucide-react';

export const MenuItemListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

  // Modals & Confirmation state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMenuItemsAndCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const [itemsData, catsData] = await Promise.all([
        getMenuItemsApi(),
        getMenuCategoriesApi(),
      ]);
      setMenuItems(itemsData);
      setCategories(catsData);
    } catch (err: unknown) {
      console.error('Failed to fetch menu items:', err);
      showToast(t('menu.loadFailedToast'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchMenuItemsAndCategories();
  }, [fetchMenuItemsAndCategories]);

  const handleItemSaved = (savedItem?: MenuItem) => {
    if (savedItem) {
      setMenuItems((prev) => {
        const idx = prev.findIndex((i) => i.id === savedItem.id);
        if (idx > -1) {
          const next = [...prev];
          next[idx] = savedItem;
          return next;
        }
        return [savedItem, ...prev];
      });
    }
    fetchMenuItemsAndCategories();
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);

    try {
      await deleteMenuItemApi(deletingItem.id);
      showToast(t('menu.itemDeletedToast', { name: deletingItem.name }), 'info');
      setDeletingItem(null);
      fetchMenuItemsAndCategories();
    } catch (err: unknown) {
      console.error('Failed to delete menu item:', err);
      showToast(t('menu.deleteFailedToast'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const itemCatId =
      typeof item.category === 'object' && item.category !== null
        ? item.category.id
        : Number(item.category || item.category_id || 0);

    const matchesCategory =
      selectedCategoryFilter === 'all' || itemCatId === Number(selectedCategoryFilter);

    const matchesAvailability =
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && item.is_available) ||
      (availabilityFilter === 'unavailable' && !item.is_available);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('menu.catalogTitle')}
        subtitle={t('menu.catalogSubtitle')}
        icon={<UtensilsCrossed className="w-6 h-6" />}
        actions={
          isOwnerOrManager && (
            <Button
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              {t('menu.addNewMenuItem')}
            </Button>
          )
        }
      />

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Category Filter Dropdown */}
          <div className="w-full sm:w-48">
            <Select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              leftIcon={<Filter className="w-4 h-4 text-slate-400" />}
            >
              <option value="all">{t('menu.allCategories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Availability Filter Toggle */}
          <div className="w-full sm:w-48">
            <Select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
            >
              <option value="all">{t('menu.allStatuses')}</option>
              <option value="available">{t('menu.availableOnly')}</option>
              <option value="unavailable">{t('menu.unavailableOnly')}</option>
            </Select>
          </div>

          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchMenuItemsAndCategories}
            title={t('inventory.refresh')}
          />
        </div>
      </div>

      {/* Menu Items Table */}
      {isLoading ? (
        <LoadingSpinner text={t('menu.loadingCatalog')} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="w-8 h-8 text-slate-400" />}
          title={t('menu.noItemsTitle')}
          description={
            searchQuery || selectedCategoryFilter !== 'all' || availabilityFilter !== 'all'
              ? t('menu.noItemsMatching')
              : t('menu.addFirstItem')
          }
          actionText={isOwnerOrManager ? t('menu.addNewMenuItem') : undefined}
          onAction={isOwnerOrManager ? () => setIsAddModalOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold border-b border-slate-100 tracking-wider">
                <tr>
                  <th className="py-4 px-6">{t('menu.menuItemCol')}</th>
                  <th className="py-4 px-6">{t('menu.categoryCol')}</th>
                  <th className="py-4 px-6">{t('menu.priceCol')}</th>
                  <th className="py-4 px-6">{t('menu.recipeCol')}</th>
                  <th className="py-4 px-6">{t('menu.stockAvailabilityCol')}</th>
                  <th className="py-4 px-6 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((item) => {
                  const categoryName =
                    typeof item.category === 'object' && item.category !== null
                      ? item.category.name
                      : t('menu.generalMenu');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400 shrink-0">
                            {item.avatar ? (
                              <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <UtensilsCrossed className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">{item.name}</span>
                            {item.description && (
                              <span className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="primary">{categoryName}</Badge>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-sm text-emerald-600">
                        <div className="flex items-center gap-0.5">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          <span>{Number(item.price).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {item.ingredients && item.ingredients.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {item.ingredients.map((ri, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200/60"
                              >
                                <Scale className="w-2.5 h-2.5 text-slate-400" />
                                <span>
                                  {ri.ingredient?.name || `${t('inventory.ingredientCol')} #${ri.ingredient_id}`}:{' '}
                                  <strong className="text-slate-800">{ri.quantity_required}</strong>
                                  {ri.ingredient?.unit_of_measure ? ri.ingredient.unit_of_measure : ''}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">{t('menu.noRecipe')}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {item.is_available ? (
                          <Badge variant="success" dot={true}>
                            {t('menu.available')}
                          </Badge>
                        ) : (
                          <Badge variant="danger" dot={true}>
                            {t('menu.unavailable')}
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={isOwnerOrManager ? <Edit2 className="w-3.5 h-3.5 text-red-500" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                            onClick={() => setEditingItem(item)}
                          >
                            {isOwnerOrManager ? t('common.edit') : t('common.viewDetails')}
                          </Button>

                          {isOwnerOrManager && (
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <AddMenuItemModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleItemSaved}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditMenuItemModal
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          menuItem={editingItem}
          onSuccess={handleItemSaved}
          isOwnerOrManager={isOwnerOrManager}
        />
      )}

      {/* Confirm Delete Dialog */}
      {deletingItem && (
        <ConfirmDialog
          isOpen={Boolean(deletingItem)}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleConfirmDelete}
          title={t('common.delete')}
          message={t('menu.deleteItemConfirm', { name: deletingItem.name })}
          confirmText={t('common.delete')}
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
