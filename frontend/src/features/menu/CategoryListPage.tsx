import React, { useEffect, useState, useCallback } from 'react';
import type { MenuCategory } from '../../types';
import { getMenuCategoriesApi, deleteMenuCategoryApi } from '../../api/menu';
import { AddEditCategoryModal } from './AddEditCategoryModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FolderTree, Plus, Search, Edit2, Trash2, RefreshCw, Hash, CheckCircle2, XCircle } from 'lucide-react';

export const CategoryListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMenuCategoriesApi();
      setCategories(data);
    } catch (err: unknown) {
      console.error('Failed to fetch menu categories:', err);
      showToast('Failed to load menu categories.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async (category: MenuCategory) => {
    if (!window.confirm(`Are you sure you want to delete category "${category.name}"?`)) return;

    try {
      await deleteMenuCategoryApi(category.id);
      showToast(`Category "${category.name}" deleted.`, 'info');
      fetchCategories();
    } catch (err: unknown) {
      console.error('Failed to delete category:', err);
      showToast('Failed to delete category.', 'error');
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Menu Categories</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Organize food and drink offerings by category and set display priority.
            </p>
          </div>
        </div>

        {isOwnerOrManager && (
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Category</span>
          </button>
        )}
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>

        <button
          onClick={fetchCategories}
          title="Refresh list"
          className="p-2.5 glass-panel border border-gray-700 text-gray-300 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Categories Table */}
      {isLoading ? (
        <LoadingSpinner text="Loading menu categories..." />
      ) : filteredCategories.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center">
          <FolderTree className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-gray-300">No menu categories found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            {searchQuery
              ? 'No categories match your search filter.'
              : 'Start by adding menu categories to group your dishes.'}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold border-b border-gray-800 tracking-wider">
                <tr>
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Category Name</th>
                  <th className="py-4 px-6">Display Order</th>
                  <th className="py-4 px-6">Status</th>
                  {isOwnerOrManager && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-gray-500 text-xs">#{cat.id}</td>
                    <td className="py-4 px-6 font-semibold text-white text-sm">{cat.name}</td>
                    <td className="py-4 px-6 font-mono text-sm">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Hash className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{cat.display_order ?? 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {cat.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-gray-800 text-gray-400 border border-gray-700">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    {isOwnerOrManager && (
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-700"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                            title="Delete Category"
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
    </div>
  );
};
