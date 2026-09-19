import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreatedOrderResponse, OrderStatus, PaymentMethod, UserRole } from '../../types';
import { processPaymentApi, updateOrderStatusApi } from '../../api/orders';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  MapPin,
  Flame,
  CheckCircle2,
  Utensils,
  CreditCard,
  XCircle,
  AlertTriangle,
  FileText,
  Loader2,
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
    const map: Record<string, { style: string; labelKey: string }> = {
      pending: { style: 'bg-amber-500/20 text-amber-300 border-amber-500/30', labelKey: 'orders.statusPending' },
      preparing: { style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', labelKey: 'orders.statusPreparing' },
      ready: { style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', labelKey: 'orders.statusReady' },
      served: { style: 'bg-blue-500/20 text-blue-300 border-blue-500/30', labelKey: 'orders.statusServed' },
      paid: { style: 'bg-purple-500/20 text-purple-300 border-purple-500/30', labelKey: 'orders.paid' },
      cancelled: { style: 'bg-rose-500/20 text-rose-300 border-rose-500/30', labelKey: 'orders.statusCancelled' },
    };
    const info = map[st] || { style: 'bg-gray-800 text-gray-300 border-gray-700', labelKey: st };
    return (
      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border capitalize ${info.style}`}>
        {t(info.labelKey, { defaultValue: st })}
      </span>
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
    <div className="glass-card p-6 rounded-3xl border border-gray-800 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all hover:border-gray-700">
      <div>
        {/* Header: Order ID, Type, Status */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-white">{t('orders.orderId')}{order.id}</span>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
              <span className="capitalize font-semibold text-indigo-400">
                {t(`orders.${order.order_type === 'dine_in' ? 'dineIn' : order.order_type}`, { defaultValue: order.order_type.replace('_', ' ') })}
              </span>
              {order.table_number && (
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <MapPin className="w-3 h-3" />
                  {t('dashboard.table')} {order.table_number}
                </span>
              )}
              <span className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3 h-3" />
                {new Date(order.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-500 block uppercase font-semibold">{t('common.total')}</span>
            <span className="font-mono font-extrabold text-emerald-400 text-lg">
              ${Number(order.total_price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Card Error Banner */}
        {cardError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{cardError}</span>
          </div>
        )}

        {/* Order Items List */}
        <div className="py-4 space-y-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            {t('dashboard.items')} ({order.items.length})
          </p>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {order.items.map((item) => {
              const priceSnap = Number(item.price_at_order);
              const itemTotal = priceSnap * item.quantity;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl glass-panel border border-gray-800/80 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                        {item.quantity}×
                      </span>
                      <span className="font-semibold text-white text-xs">
                        {item.menu_item_name || `Dish #${item.menu_item}`}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-bold text-emerald-400">
                      ${itemTotal.toFixed(2)}
                    </span>
                  </div>

                  {item.note && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2 font-medium">
                      <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        {t('common.notes')}: <strong className="text-amber-100">{item.note}</strong>
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
      <div className="pt-4 border-t border-gray-800/80 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-gray-500" />
            <span>{t('staff.role')}: {order.staff_name || `#${order.staff}`}</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canStartPreparing && (
            <button
              onClick={() => handleTransition('preparing')}
              disabled={isUpdating}
              className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>{t('orders.startPreparing')}</span>
                </>
              )}
            </button>
          )}

          {canMarkReady && (
            <button
              onClick={() => handleTransition('ready')}
              disabled={isUpdating}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>{t('orders.markReady')}</span>
                </>
              )}
            </button>
          )}

          {canMarkServed && (
            <button
              onClick={() => handleTransition('served')}
              disabled={isUpdating}
              className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <Utensils className="w-4 h-4 text-blue-200" />
                  <span>{t('orders.markServed')}</span>
                </>
              )}
            </button>
          )}

          {canMarkPaid && !showPaymentSelector && (
            <button
              onClick={() => {
                setCardError(null);
                setShowPaymentSelector(true);
              }}
              disabled={isUpdating}
              className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4 text-purple-200" />
              <span>{t('orders.markPaidBtn', { amount: Number(order.total_price).toFixed(2) })}</span>
            </button>
          )}

          {canMarkPaid && showPaymentSelector && (
            <div className="flex-1 glass-panel p-3 rounded-2xl border border-purple-500/40 bg-purple-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-200 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  {t('orders.paymentMethod')}:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentSelector(false);
                    setCardError(null);
                  }}
                  className="text-gray-400 hover:text-white p-0.5 rounded transition-colors"
                >
                  <XCircle className="w-4 h-4 text-gray-400 hover:text-rose-400" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {(['cash', 'card', 'mobile'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-lg capitalize border transition-all ${
                      selectedMethod === method
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                        : 'bg-gray-800/80 text-gray-400 border-gray-700/80 hover:text-white hover:border-gray-600'
                    }`}
                  >
                    {t(`orders.${method === 'mobile' ? 'digital' : method}`, { defaultValue: method })}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isUpdating}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>{t('orders.confirmPaymentBtn', { amount: Number(order.total_price).toFixed(2) })}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {canCancel && (
            <button
              onClick={() => {
                if (window.confirm(t('orders.cancelConfirm', { id: order.id }))) {
                  handleTransition('cancelled');
                }
              }}
              disabled={isUpdating}
              className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>{t('common.cancel')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
