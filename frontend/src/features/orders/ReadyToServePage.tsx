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
import { Utensils, RefreshCw, BellRing } from 'lucide-react';

export const ReadyToServePage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const { refreshActiveOrders } = useCart();
  const [orders, setOrders] = useState<CreatedOrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReadyOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const data = await getOrdersApi('ready');
      setOrders(data);
      refreshActiveOrders();
    } catch (err: unknown) {
      console.error('Failed to fetch ready orders:', err);
      if (!isSilent) {
        showToast(t('common.error'), 'error');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [showToast, t, refreshActiveOrders]);

  useEffect(() => {
    fetchReadyOrders(false);

    const intervalId = setInterval(() => {
      fetchReadyOrders(true);
    }, 9000);

    return () => clearInterval(intervalId);
  }, [fetchReadyOrders]);

  const handleStatusUpdated = (orderId: number, _newStatus: OrderStatus) => {
    showToast(t('orders.orderSuccess', { id: orderId }), 'success');
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    refreshActiveOrders();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('nav.readyToServe')}
        subtitle={t('orders.readyQueueDesc')}
        icon={<BellRing className="w-6 h-6" />}
        actions={
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => fetchReadyOrders(false)}
          >
            {t('orders.refreshQueue')}
          </Button>
        }
      />

      {/* Orders Grid */}
      {isLoading ? (
        <LoadingSpinner text={t('orders.fetchingReady')} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Utensils className="w-8 h-8 text-slate-400" />}
          title={t('orders.noReadyOrders')}
          description={t('orders.kitchenWillAppear')}
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
