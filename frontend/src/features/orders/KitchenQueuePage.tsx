import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreatedOrderResponse, OrderStatus } from '../../types';
import { getOrdersApi } from '../../api/orders';
import { OrderCard } from './OrderCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { Flame, RefreshCw, ChefHat } from 'lucide-react';

export const KitchenQueuePage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<CreatedOrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchKitchenOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const data = await getOrdersApi('pending,preparing');
      setOrders(data);
    } catch (err: unknown) {
      console.error('Failed to fetch kitchen orders:', err);
      if (!isSilent) {
        showToast(t('common.error'), 'error');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchKitchenOrders(false);

    const intervalId = setInterval(() => {
      fetchKitchenOrders(true);
    }, 9000);

    return () => clearInterval(intervalId);
  }, [fetchKitchenOrders]);

  const handleStatusUpdated = (orderId: number, _newStatus: OrderStatus) => {
    showToast(t('orders.orderSuccess', { id: orderId }), 'success');
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('orders.kitchenWorkingQueue')}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {t('orders.kitchenQueueDesc')}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchKitchenOrders(false)}
          className="flex items-center gap-2 px-4 py-2.5 glass-panel hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl border border-gray-700 text-xs font-semibold transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t('orders.refreshQueue')}</span>
        </button>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <LoadingSpinner text={t('orders.fetchingKitchen')} />
      ) : orders.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-gray-800 text-center flex flex-col items-center justify-center">
          <Flame className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-gray-300">{t('orders.noActiveKitchen')}</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            {t('orders.allKitchenCompleted')}
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
