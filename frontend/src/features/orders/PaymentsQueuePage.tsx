import React, { useEffect, useState, useCallback } from 'react';
import type { CreatedOrderResponse, OrderStatus } from '../../types';
import { getOrdersApi } from '../../api/orders';
import { OrderCard } from './OrderCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { CreditCard, RefreshCw, Receipt } from 'lucide-react';

export const PaymentsQueuePage: React.FC = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<CreatedOrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaymentOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      // Backend status query: ?status=served
      const data = await getOrdersApi('served');
      setOrders(data);
    } catch (err: unknown) {
      console.error('Failed to fetch payment orders:', err);
      if (!isSilent) {
        showToast('Failed to load payments queue.', 'error');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [showToast]);

  // Initial load + 9-second polling interval with cleanup on unmount
  useEffect(() => {
    fetchPaymentOrders(false);

    const intervalId = setInterval(() => {
      fetchPaymentOrders(true);
    }, 9000);

    return () => clearInterval(intervalId);
  }, [fetchPaymentOrders]);

  // Remove order from list when status changes to paid
  const handleStatusUpdated = (orderId: number, newStatus: OrderStatus, recordedAmount?: number | string) => {
    if (recordedAmount !== undefined) {
      showToast(
        `Payment of $${Number(recordedAmount).toFixed(2)} recorded for Order #${orderId}.`,
        'success'
      );
    } else {
      showToast(`Order #${orderId} marked as "${newStatus.replace('_', ' ')}".`, 'success');
    }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Payments Queue</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Served orders awaiting cashier settlement and billing. Auto-refreshes every 9 seconds.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchPaymentOrders(false)}
          className="flex items-center gap-2 px-4 py-2.5 glass-panel hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl border border-gray-700 text-xs font-semibold transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <LoadingSpinner text="Fetching payment queue orders..." />
      ) : orders.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-gray-800 text-center flex flex-col items-center justify-center">
          <CreditCard className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-gray-300">No pending payments</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            All served orders have been settled and marked as paid!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onStatusUpdated={handleStatusUpdated} />
          ))}
        </div>
      )}
    </div>
  );
};
