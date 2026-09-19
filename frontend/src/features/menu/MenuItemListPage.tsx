import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { MenuCategory, MenuItem } from '../../types';
import { getMenuItemsApi, getMenuCategoriesApi, deleteMenuItemApi } from '../../api/menu';
import { AddMenuItemModal } from './AddMenuItemModal';
import { EditMenuItemModal } from './EditMenuItemModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
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

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

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

  const handleDelete = async (item: MenuItem) => {
    if (!window.confirm(t('menu.deleteItemConfirm', { name: item.name }))) return;

    try {
      await deleteMenuItemApi(item.id);
      showToast(t('menu.itemDeletedToast', { name: item.name }), 'info');
      fetchMenuItemsAndCategories();
    } catch (err: unknown) {
      console.error('Failed to delete menu item:', err);
      showToast(t('menu.deleteFailedToast'), 'error');
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
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('menu.catalogTitle')}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {t('menu.catalogSubtitle')}
            </p>
          </div>
        </div>

        {isOwnerOrManager && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>{t('menu.addNewMenuItem')}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Category Filter Dropdown */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl glass-input text-xs bg-gray-900"
            >
              <option value="all" className="bg-gray-900">
                {t('menu.allCategories')}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-gray-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter Toggle */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs bg-gray-900"
          >
            <option value="all" className="bg-gray-900">
              {t('menu.allStatuses')}
            </option>
            <option value="available" className="bg-gray-900">
              {t('menu.availableOnly')}
            </option>
            <option value="unavailable" className="bg-gray-900">
              {t('menu.unavailableOnly')}
            </option>
          </select>

          <button
            onClick={fetchMenuItemsAndCategories}
            title={t('inventory.refresh')}
            className="p-2.5 glass-panel border border-gray-700 text-gray-300 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Menu Items Table */}
      {isLoading ? (
        <LoadingSpinner text={t('menu.loadingCatalog')} />
      ) : filteredItems.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center">
          <UtensilsCrossed className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-gray-300">{t('menu.noItemsTitle')}</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            {searchQuery || selectedCategoryFilter !== 'all' || availabilityFilter !== 'all'
              ? t('menu.noItemsMatching')
              : t('menu.addFirstItem')}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold border-b border-gray-800 tracking-wider">
                <tr>
                  <th className="py-4 px-6">{t('menu.menuItemCol')}</th>
                  <th className="py-4 px-6">{t('menu.categoryCol')}</th>
                  <th className="py-4 px-6">{t('menu.priceCol')}</th>
                  <th className="py-4 px-6">{t('menu.recipeCol')}</th>
                  <th className="py-4 px-6">{t('menu.stockAvailabilityCol')}</th>
                  <th className="py-4 px-6 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {filteredItems.map((item) => {
                  const categoryName =
                    typeof item.category === 'object' && item.category !== null
                      ? item.category.name
                      : t('menu.generalMenu');

                  return (
                    <tr key={item.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <span className="font-semibold text-white text-sm block">{item.name}</span>
                          {item.description && (
                            <span className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {categoryName}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-sm text-emerald-400">
                        <div className="flex items-center gap-0.5">
                          <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                          <span>{Number(item.price).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {item.ingredients && item.ingredients.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {item.ingredients.map((ri, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-gray-800/80 text-gray-300 border border-gray-700"
                              >
                                <Scale className="w-2.5 h-2.5 text-gray-500" />
                                <span>
                                  {ri.ingredient?.name || `${t('inventory.ingredientCol')} #${ri.ingredient_id}`}:{' '}
                                  <strong className="text-white">{ri.quantity_required}</strong>
                                  {ri.ingredient?.unit_of_measure ? ri.ingredient.unit_of_measure : ''}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic text-[11px]">{t('menu.noRecipe')}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {item.is_available ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            {t('menu.available')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            {t('menu.unavailable')}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="px-3 py-1.5 glass-panel hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-gray-700 flex items-center gap-1.5"
                          >
                            {isOwnerOrManager ? (
                              <>
                                <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{t('common.edit')}</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-gray-400" />
                                <span>{t('common.viewDetails')}</span>
                              </>
                            )}
                          </button>

                          {isOwnerOrManager && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
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
          onSuccess={() => fetchMenuItemsAndCategories()}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditMenuItemModal
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          menuItem={editingItem}
          onSuccess={fetchMenuItemsAndCategories}
          isOwnerOrManager={isOwnerOrManager}
        />
      )}
    </div>
  );
};
