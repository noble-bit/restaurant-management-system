import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreatedOrderResponse, OrderStatus, PaymentMethod, UserRole } from '../../types';
import { processPaymentApi, updateOrderStatusApi } from '../../api/orders';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import {
  Clock,
  MapPin,
  Flame,
  CheckCircle2,
  Utensils,
  UtensilsCrossed,
  CreditCard,
  XCircle,
  AlertTriangle,
  FileText,
  User,
} from 'lucide-react';

interface OrderCardProps {
  order: CreatedOrderResponse;
  onStatusUpdated: (orderId: number, newStatus: OrderStatus, recordedAmount?: number | string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusUpdated }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const role: UserRole = user?.role || 'waiter';
  const isOwnerOrManager = role === 'owner' || role === 'manager';

  const [isUpdating, setIsUpdating] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');

  // Status Badge Colors & Info
  const getStatusBadge = (st: OrderStatus | string) => {
    const map: Record<string, { variant: 'warning' | 'info' | 'success' | 'danger' | 'neutral'; labelKey: string }> = {
      pending: { variant: 'warning', labelKey: 'orders.statusPending' },
      preparing: { variant: 'info', labelKey: 'orders.statusPreparing' },
      ready: { variant: 'success', labelKey: 'orders.statusReady' },
      served: { variant: 'info', labelKey: 'orders.statusServed' },
      paid: { variant: 'success', labelKey: 'orders.paid' },
      cancelled: { variant: 'danger', labelKey: 'orders.statusCancelled' },
    };
    const info = map[st] || { variant: 'neutral', labelKey: st };
    return (
      <Badge variant={info.variant} dot={true}>
        {t(info.labelKey, { defaultValue: st })}
      </Badge>
    );
  };

  // Perform Status Transition
  const handleTransition = async (newStatus: OrderStatus) => {
    setCardError(null);
    setIsUpdating(true);

    try {
      await updateOrderStatusApi(order.id, newStatus);
      onStatusUpdated(order.id, newStatus);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { status?: number; data?: { detail?: string } } }).response;
        const statusCode = resp?.status;
        const detailMsg = resp?.data?.detail;

        if (statusCode === 403) {
          setCardError("You don't have permission to perform this status transition.");
        } else if (statusCode === 400 && detailMsg) {
          setCardError(detailMsg);
        } else if (detailMsg) {
          setCardError(detailMsg);
        } else {
          setCardError('Failed to update order status. Please try again.');
        }
      } else {
        setCardError('Network error. Unable to update status.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Perform Dedicated Payment Processing
  const handleConfirmPayment = async () => {
    setCardError(null);
    setIsUpdating(true);

    try {
      const payment = await processPaymentApi(order.id, selectedMethod);
      onStatusUpdated(order.id, 'paid', payment.amount);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as {
          response?: { status?: number; data?: { detail?: string; method?: string[] | string } };
        }).response;
        const statusCode = resp?.status;
        const detailMsg = resp?.data?.detail;
        const methodMsg = Array.isArray(resp?.data?.method)
          ? resp?.data?.method.join(' ')
          : resp?.data?.method;

        if (statusCode === 403) {
          setCardError(detailMsg || "You don't have permission to process payments.");
        } else if (statusCode === 400) {
          setCardError(detailMsg || methodMsg || 'Invalid payment request.');
        } else if (detailMsg) {
          setCardError(detailMsg);
        } else {
          setCardError('Failed to process payment. Please try again.');
        }
      } else {
        setCardError('Network error. Unable to process payment.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const canStartPreparing = order.status === 'pending' && (role === 'chef' || isOwnerOrManager);
  const canMarkReady = order.status === 'preparing' && (role === 'chef' || isOwnerOrManager);
  const canMarkServed = order.status === 'ready' && (role === 'waiter' || isOwnerOrManager);
  const canMarkPaid = order.status === 'served' && (role === 'cashier' || isOwnerOrManager);

  const canCancelPending = order.status === 'pending' && (role === 'waiter' || isOwnerOrManager);
  const canCancelPreparing = order.status === 'preparing' && isOwnerOrManager;
  const canCancel = canCancelPending || canCancelPreparing;

  return (
    <Card padding="md" className="flex flex-col justify-between shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06)] transition-all">
      <div>
        {/* Header: Order ID, Type, Status, Total */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-base font-extrabold text-slate-800">
                {t('orders.orderId')}{order.id}
              </span>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
              <span className="capitalize font-bold text-red-500">
                {t(`orders.${order.order_type === 'dine_in' ? 'dineIn' : order.order_type}`, {
                  defaultValue: order.order_type.replace('_', ' '),
                })}
              </span>
              {order.table_number && (
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <MapPin className="w-3 h-3" />
                  {t('dashboard.table')} {order.table_number}
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-400 font-medium">
                <Clock className="w-3 h-3" />
                {new Date(order.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">{t('common.total')}</span>
            <span className="font-mono font-extrabold text-emerald-600 text-lg">
              ${Number(order.total_price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Card Error Banner */}
        {cardError && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{cardError}</span>
          </div>
        )}

        {/* Order Items List */}
        <div className="py-4 space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t('dashboard.items')} ({order.items.length})
          </p>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {order.items.map((item) => {
              const priceSnap = Number(item.price_at_order);
              const itemTotal = priceSnap * item.quantity;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* Small circular thumbnail */}
                      {item.menu_item_avatar ? (
                        <img
                          src={item.menu_item_avatar}
                          alt={item.menu_item_name || ''}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <UtensilsCrossed className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="w-6 h-6 rounded-full bg-red-50 text-red-600 font-extrabold text-xs flex items-center justify-center border border-red-100 shrink-0">
                        {item.quantity}×
                      </span>
                      <span className="font-bold text-slate-800 text-xs">
                        {item.menu_item_name || `Dish #${item.menu_item}`}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-bold text-emerald-600">
                      ${itemTotal.toFixed(2)}
                    </span>
                  </div>

                  {item.note && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-1.5 font-medium">
                      <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        {t('common.notes')}: <strong className="text-amber-900">{item.note}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('staff.role')}: {order.staff_name || `#${order.staff}`}</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canStartPreparing && (
            <Button
              variant="primary"
              size="sm"
              fullWidth={true}
              isLoading={isUpdating}
              icon={<Flame className="w-4 h-4" />}
              onClick={() => handleTransition('preparing')}
            >
              {t('orders.startPreparing')}
            </Button>
          )}

          {canMarkReady && (
            <Button
              variant="success"
              size="sm"
              fullWidth={true}
              isLoading={isUpdating}
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => handleTransition('ready')}
            >
              {t('orders.markReady')}
            </Button>
          )}

          {canMarkServed && (
            <Button
              variant="primary"
              size="sm"
              fullWidth={true}
              isLoading={isUpdating}
              icon={<Utensils className="w-4 h-4" />}
              onClick={() => handleTransition('served')}
            >
              {t('orders.markServed')}
            </Button>
          )}

          {canMarkPaid && !showPaymentSelector && (
            <Button
              variant="success"
              size="sm"
              fullWidth={true}
              isLoading={isUpdating}
              icon={<CreditCard className="w-4 h-4" />}
              onClick={() => {
                setCardError(null);
                setShowPaymentSelector(true);
              }}
            >
              {t('orders.markPaidBtn', { amount: Number(order.total_price).toFixed(2) })}
            </Button>
          )}

          {canMarkPaid && showPaymentSelector && (
            <div className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-red-500" />
                  {t('orders.paymentMethod')}:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentSelector(false);
                    setCardError(null);
                  }}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                >
                  <XCircle className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {(['cash', 'card', 'mobile'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-xl capitalize border transition-all ${
                      selectedMethod === method
                        ? 'bg-red-500 text-white border-red-500 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t(`orders.${method === 'mobile' ? 'digital' : method}`, { defaultValue: method })}
                  </button>
                ))}
              </div>

              <Button
                variant="success"
                size="sm"
                fullWidth={true}
                isLoading={isUpdating}
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleConfirmPayment}
              >
                {t('orders.confirmPaymentBtn', { amount: Number(order.total_price).toFixed(2) })}
              </Button>
            </div>
          )}

          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              isLoading={isUpdating}
              icon={<XCircle className="w-4 h-4" />}
              onClick={() => {
                if (window.confirm(t('orders.cancelConfirm', { id: order.id }))) {
                  handleTransition('cancelled');
                }
              }}
            >
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
