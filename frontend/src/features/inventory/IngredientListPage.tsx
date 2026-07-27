import React, { useEffect, useState, useCallback } from 'react';
import type { Ingredient } from '../../types';
import { getIngredientsApi, getLowStockIngredientsApi, deleteIngredientApi } from '../../api/inventory';
import { AddEditIngredientModal } from './AddEditIngredientModal';
import { RestockModal } from './RestockModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Package,
  Plus,
  AlertTriangle,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Scale,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

export const IngredientListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockingIngredient, setRestockingIngredient] = useState<Ingredient | null>(null);

  const fetchIngredients = useCallback(async () => {
    setIsLoading(true);
    try {
      if (showOnlyLowStock) {
        const data = await getLowStockIngredientsApi();
        setIngredients(data);
      } else {
        const data = await getIngredientsApi();
        setIngredients(data);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch ingredients:', err);
      showToast('Failed to load ingredients list.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showOnlyLowStock, showToast]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleDelete = async (ingredient: Ingredient) => {
    if (!window.confirm(`Are you sure you want to deactivate "${ingredient.name}"?`)) return;

    try {
      await deleteIngredientApi(ingredient.id);
      showToast(`Ingredient "${ingredient.name}" deactivated.`, 'info');
      fetchIngredients();
    } catch (err: unknown) {
      console.error('Failed to delete ingredient:', err);
      showToast('Failed to deactivate ingredient.', 'error');
    }
  };

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = ingredients.filter((i) => i.is_low_stock).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Ingredient Inventory</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Track stock levels, reorder thresholds, unit costs, and perform stock replenishments.
            </p>
          </div>
        </div>

        {isOwnerOrManager && (
          <button
            onClick={() => {
              setEditingIngredient(null);
              setIsAddEditModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Ingredient</span>
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
            placeholder="Search ingredients..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Low Stock Toggle Button */}
          <button
            onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              showOnlyLowStock
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/20'
                : 'glass-panel border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${showOnlyLowStock ? 'text-rose-400' : 'text-amber-400'}`} />
            <span>Low Stock Alert Filter</span>
            {lowStockCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={fetchIngredients}
            title="Refresh list"
            className="p-2.5 glass-panel border border-gray-700 text-gray-300 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ingredients Table */}
      {isLoading ? (
        <LoadingSpinner text="Loading inventory records..." />
      ) : filteredIngredients.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center">
          <Package className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-gray-300">No ingredients found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            {showOnlyLowStock
              ? 'Great news! There are currently no low-stock ingredients requiring reorder.'
              : 'No ingredients exist in inventory.'}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold border-b border-gray-800 tracking-wider">
                <tr>
                  <th className="py-4 px-6">Ingredient</th>
                  <th className="py-4 px-6">Quantity On Hand</th>
                  <th className="py-4 px-6">Reorder Threshold</th>
                  <th className="py-4 px-6">Cost / Unit</th>
                  <th className="py-4 px-6">Status Badge</th>
                  {isOwnerOrManager && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {filteredIngredients.map((item) => {
                  const isLow = item.is_low_stock;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isLow ? 'bg-rose-950/30 hover:bg-rose-950/50' : 'hover:bg-gray-800/40'
                      }`}
                    >
                      <td className="py-4 px-6 font-semibold text-white text-sm">
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm font-bold">
                        <span className={isLow ? 'text-rose-400' : 'text-emerald-400'}>
                          {item.quantity_on_hand}
                        </span>{' '}
                        <span className="text-xs font-normal text-gray-400">
                          {item.unit_of_measure}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-gray-500" />
                          <span>
                            {item.reorder_threshold} {item.unit_of_measure}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                          <span>{Number(item.cost_per_unit).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            LOW STOCK ALERT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Optimal Level
                          </span>
                        )}
                      </td>
                      {isOwnerOrManager && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Restock Button */}
                            <button
                              onClick={() => {
                                setRestockingIngredient(item);
                                setIsRestockModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center gap-1"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Restock</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                setEditingIngredient(item);
                                setIsAddEditModalOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete/Deactivate Button */}
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isAddEditModalOpen && (
        <AddEditIngredientModal
          isOpen={isAddEditModalOpen}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setEditingIngredient(null);
          }}
          ingredientToEdit={editingIngredient}
          onSuccess={fetchIngredients}
        />
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && (
        <RestockModal
          isOpen={isRestockModalOpen}
          onClose={() => {
            setIsRestockModalOpen(false);
            setRestockingIngredient(null);
          }}
          ingredient={restockingIngredient}
          onSuccess={fetchIngredients}
        />
      )}
    </div>
  );
};
