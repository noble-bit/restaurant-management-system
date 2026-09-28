import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreatedOrderResponse, OrderStatus } from '../../types';
import { getOrdersApi } from '../../api/orders';
import { OrderCard } from './OrderCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import { Flame, RefreshCw, ChefHat } from 'lucide-react';

export const KitchenQueuePage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const { refreshActiveOrders } = useCart();
  const [orders, setOrders] = useState<CreatedOrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchKitchenOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const data = await getOrdersApi('pending,preparing');
      setOrders(data);
      refreshActiveOrders();
    } catch (err: unknown) {
      console.error('Failed to fetch kitchen orders:', err);
      if (!isSilent) {
        showToast(t('common.error'), 'error');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [showToast, t, refreshActiveOrders]);

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
    refreshActiveOrders();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('orders.kitchenWorkingQueue')}
        subtitle={t('orders.kitchenQueueDesc')}
        icon={<ChefHat className="w-6 h-6" />}
        actions={
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => fetchKitchenOrders(false)}
          >
            {t('orders.refreshQueue')}
          </Button>
        }
      />

      {/* Orders Grid */}
      {isLoading ? (
        <LoadingSpinner text={t('orders.fetchingKitchen')} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Flame className="w-8 h-8 text-slate-400" />}
          title={t('orders.noActiveKitchen')}
          description={t('orders.allKitchenCompleted')}
        />
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
