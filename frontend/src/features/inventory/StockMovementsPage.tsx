import React, { useEffect, useState, useCallback } from 'react';
import type { StockMovement, MovementReason } from '../../types';
import { getStockMovementsApi } from '../../api/inventory';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { History, TrendingUp, TrendingDown, RefreshCw, Filter } from 'lucide-react';

export const StockMovementsPage: React.FC = () => {
  const { showToast } = useToast();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReason, setSelectedReason] = useState<string>('all');

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStockMovementsApi();
      setMovements(data);
    } catch (err: unknown) {
      console.error('Failed to fetch stock movements:', err);
      showToast('Failed to load stock movements audit log.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const filteredMovements = movements.filter(
    (m) => selectedReason === 'all' || m.reason === selectedReason
  );

  const getReasonBadge = (reason: MovementReason) => {
    const map: Record<MovementReason, { style: string; label: string }> = {
      restock: { style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Restock' },
      order_deduction: { style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: 'Order Deduction' },
      waste: { style: 'bg-rose-500/20 text-rose-300 border-rose-500/30', label: 'Waste' },
      correction: { style: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Correction' },
    };
    const info = map[reason] || { style: 'bg-gray-800 text-gray-300 border-gray-700', label: reason };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${info.style}`}>
        {info.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Stock Movement Audit Log</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Read-only historical trail of all ingredient additions, deductions, waste, and corrections.
            </p>
          </div>
        </div>

        <button
          onClick={fetchMovements}
          className="flex items-center gap-2 px-4 py-2.5 glass-panel hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl border border-gray-700 text-xs font-semibold transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Movement Reason:
          </span>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs bg-gray-900"
          >
            <option value="all" className="bg-gray-900">All Reasons</option>
            <option value="restock" className="bg-gray-900">Restock (+)</option>
            <option value="order_deduction" className="bg-gray-900">Order Deduction (-)</option>
            <option value="waste" className="bg-gray-900">Waste (-)</option>
            <option value="correction" className="bg-gray-900">Correction</option>
          </select>
        </div>

        <p className="text-xs text-gray-500">
          Showing {filteredMovements.length} log entry records
        </p>
      </div>

      {/* Movements Table */}
      {isLoading ? (
        <LoadingSpinner text="Fetching audit movements..." />
      ) : filteredMovements.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center">
          <History className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-gray-300">No stock movements recorded</h3>
          <p className="text-xs text-gray-500 mt-1">
            Stock movements will automatically populate when restocks or order deductions occur.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold border-b border-gray-800 tracking-wider">
                <tr>
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Ingredient ID / Reference</th>
                  <th className="py-4 px-6">Quantity Delta</th>
                  <th className="py-4 px-6">Movement Reason</th>
                  <th className="py-4 px-6">Staff ID / Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {filteredMovements.map((item) => {
                  const numDelta = Number(item.quantity_delta);
                  const isPositive = numDelta > 0;

                  return (
                    <tr key={item.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="py-4 px-6 text-gray-400 font-mono text-[11px]">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-medium text-white">
                        Ingredient #{item.ingredient}
                      </td>
                      <td className="py-4 px-6 font-mono text-sm font-bold">
                        <div className="flex items-center gap-1.5">
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-rose-400" />
                          )}
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPositive ? `+${numDelta}` : numDelta}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">{getReasonBadge(item.reason)}</td>
                      <td className="py-4 px-6 text-gray-400">
                        {item.staff ? `Staff #${item.staff}` : 'System Automated'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
