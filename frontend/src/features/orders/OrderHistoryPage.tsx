import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreatedOrderResponse, OrderPaymentDetailsResponse, PaymentMethod } from '../../types';
import { getOrdersApi, getOrderPaymentDetailsApi } from '../../api/orders';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  History,
  RefreshCw,
  Search,
  Calendar,
  DollarSign,
  Receipt,
  TrendingUp,
  MapPin,
  Clock,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Smartphone,
  UserCheck,
  UtensilsCrossed,
} from 'lucide-react';

type DateFilterOption = 'all' | 'today' | '7days' | '30days';

export const OrderHistoryPage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<CreatedOrderResponse[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<Record<number, OrderPaymentDetailsResponse | null>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');

  // Expanded Items Row State
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  const fetchPaidOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getOrdersApi('paid');
      setOrders(data);

      const paymentPromises = data.map(async (order) => {
        try {
          const paymentData = await getOrderPaymentDetailsApi(order.id);
          return { orderId: order.id, payment: paymentData };
        } catch {
          return { orderId: order.id, payment: null };
        }
      });

      const results = await Promise.allSettled(paymentPromises);
      const map: Record<number, OrderPaymentDetailsResponse | null> = {};
      results.forEach((res) => {
        if (res.status === 'fulfilled' && res.value) {
          map[res.value.orderId] = res.value.payment;
        }
      });

      setPaymentsMap(map);
    } catch (err: unknown) {
      console.error('Failed to fetch paid orders history:', err);
      showToast(t('common.error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchPaidOrders();
  }, [fetchPaidOrders]);

  const toggleExpand = (orderId: number) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getPaymentMethodBadge = (method: PaymentMethod) => {
    const map: Record<PaymentMethod, { labelKey: string; icon: React.ComponentType<{ className?: string }> }> = {
      cash: { labelKey: 'orders.cash', icon: Banknote },
      card: { labelKey: 'orders.card', icon: CreditCard },
      mobile: { labelKey: 'orders.digital', icon: Smartphone },
    };
    const info = map[method] || { labelKey: method, icon: DollarSign };
    const Icon = info.icon;

    return (
      <Badge variant="success">
        <Icon className="w-3 h-3" />
        <span>{t(info.labelKey, { defaultValue: method })}</span>
      </Badge>
    );
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return orders.filter((order) => {
      const orderIdStr = `#${order.id}`;
      const tableStr = order.table_number ? `table ${order.table_number}` : '';
      const staffStr = order.staff_name || `staff ${order.staff}`;
      const itemsStr = order.items.map((i) => i.menu_item_name).join(' ');

      const payment = paymentsMap[order.id];
      const methodStr = payment?.method || '';
      const processedByStr = payment?.processed_by || '';

      const matchesSearch =
        searchQuery === '' ||
        orderIdStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tableStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staffStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        itemsStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        methodStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        processedByStr.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        orderTypeFilter === 'all' || order.order_type === orderTypeFilter;

      const orderTime = new Date(order.created_at).getTime();
      let matchesDate = true;

      if (dateFilter === 'today') {
        matchesDate = orderTime >= startOfToday;
      } else if (dateFilter === '7days') {
        matchesDate = orderTime >= sevenDaysAgo;
      } else if (dateFilter === '30days') {
        matchesDate = orderTime >= thirtyDaysAgo;
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [orders, paymentsMap, searchQuery, dateFilter, orderTypeFilter]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + Number(order.total_price), 0);
  }, [filteredOrders]);

  const totalCount = filteredOrders.length;
  const avgOrderValue = totalCount > 0 ? totalRevenue / totalCount : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <PageHeader
        title={t('nav.orderHistory')}
        subtitle={t('orders.historyDesc')}
        icon={<History className="w-6 h-6" />}
        actions={
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchPaidOrders}
          >
            {t('orders.refreshHistory')}
          </Button>
        }
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title={t('orders.totalSettledRevenue')}
          value={`$${totalRevenue.toFixed(2)}`}
          subtitle={t('orders.sumPaidTx')}
          icon={DollarSign}
          iconColor="text-emerald-500"
        />

        <StatCard
          title={t('orders.paidTransactions')}
          value={isLoading ? '...' : totalCount}
          subtitle={t('orders.completedRecords')}
          icon={Receipt}
          iconColor="text-red-500"
        />

        <StatCard
          title={t('orders.avgOrderValue')}
          value={`$${avgOrderValue.toFixed(2)}`}
          subtitle={t('orders.revPerPaidOrder')}
          icon={TrendingUp}
          iconColor="text-sky-500"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="w-full sm:w-80">
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Date & Order Type Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-44">
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
              leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
            >
              <option value="all">{t('orders.allTime')}</option>
              <option value="today">{t('orders.todayOnly')}</option>
              <option value="7days">{t('orders.last7Days')}</option>
              <option value="30days">{t('orders.last30Days')}</option>
            </Select>
          </div>

          <div className="w-full sm:w-44">
            <Select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
            >
              <option value="all">{t('common.all')}</option>
              <option value="dine_in">{t('orders.dineIn')}</option>
              <option value="takeout">{t('orders.takeout')}</option>
              <option value="delivery">{t('orders.delivery')}</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Dense Scannable Table */}
      {isLoading ? (
        <LoadingSpinner text={t('orders.loadingHistory')} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-slate-400" />}
          title={t('orders.noPaidOrdersMatch')}
          description={
            orders.length === 0 ? t('orders.noOrdersMarkedPaid') : t('orders.adjustSearch')
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold border-b border-slate-100 tracking-wider">
                <tr>
                  <th className="py-4 px-6">{t('orders.orderRefAndType')}</th>
                  <th className="py-4 px-6">{t('orders.datePlaced')}</th>
                  <th className="py-4 px-6">{t('orders.itemsSummary')}</th>
                  <th className="py-4 px-6">{t('orders.paymentMethod')}</th>
                  <th className="py-4 px-6">{t('orders.staffCashier')}</th>
                  <th className="py-4 px-6">{t('orders.totalSettled')}</th>
                  <th className="py-4 px-6">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((order) => {
                  const isExpanded = Boolean(expandedOrders[order.id]);
                  const itemsCount = order.items.length;
                  const payment = paymentsMap[order.id];

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        {/* Order ID & Type */}
                        <td className="py-4 px-6 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-extrabold">{t('orders.orderId')}{order.id}</span>
                            <Badge variant="primary">
                              {t(`orders.${order.order_type === 'dine_in' ? 'dineIn' : order.order_type}`, {
                                defaultValue: order.order_type.replace('_', ' '),
                              })}
                            </Badge>
                          </div>
                          {order.table_number && (
                            <p className="text-xs text-amber-600 font-bold flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {t('dashboard.table')} {order.table_number}
                            </p>
                          )}
                        </td>

                        {/* Date & Time */}
                        <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {new Date(order.created_at).toLocaleDateString()}{' '}
                              {new Date(order.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>

                        {/* Items Breakdown */}
                        <td className="py-4 px-6">
                          <div className="space-y-1 max-w-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 text-[11px] font-medium"
                                >
                                  {item.menu_item_avatar ? (
                                    <img
                                      src={item.menu_item_avatar}
                                      alt={item.menu_item_name || ''}
                                      className="w-4 h-4 rounded-full object-cover shrink-0"
                                    />
                                  ) : (
                                    <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <strong className="text-red-500 font-extrabold">{item.quantity}×</strong>
                                  <span>{item.menu_item_name || `Dish #${item.menu_item}`}</span>
                                </span>
                              ))}

                              {itemsCount > 3 && (
                                <button
                                  onClick={() => toggleExpand(order.id)}
                                  className="text-[11px] text-red-500 hover:text-red-600 font-bold flex items-center gap-0.5 ml-1"
                                >
                                  <span>{isExpanded ? 'Less' : `+${itemsCount - 3} more`}</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                            </div>

                            {order.items.some((i) => i.note) && (
                              <div className="flex items-center gap-1 text-[11px] text-amber-700 italic mt-1 font-medium">
                                <FileText className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="truncate">
                                  {t('common.notes')}:{' '}
                                  {order.items
                                    .filter((i) => i.note)
                                    .map((i) => `"${i.note}"`)
                                    .join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Payment Method Badge */}
                        <td className="py-4 px-6">
                          {payment ? (
                            <div>
                              {getPaymentMethodBadge(payment.method)}
                              {payment.processed_by && (
                                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                  <UserCheck className="w-3 h-3 text-slate-400" />
                                  <span>By {payment.processed_by}</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">—</span>
                          )}
                        </td>

                        {/* Staff */}
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.staff_name || `#${order.staff}`}</span>
                          </div>
                        </td>

                        {/* Total Price */}
                        <td className="py-4 px-6 font-mono text-sm font-extrabold text-emerald-600">
                          ${Number(order.total_price).toFixed(2)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-6">
                          <Badge variant="success" dot={true}>
                            {t('orders.paid')}
                          </Badge>
                        </td>
                      </tr>

                      {/* Expandable full items drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="py-3 px-8">
                            <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-2.5 shadow-xs">
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  {t('orders.itemsSummary')}
                                </p>
                                {payment?.processed_by && (
                                  <p className="text-[11px] text-slate-600 font-medium">
                                    Processed By: <strong className="text-slate-800">{payment.processed_by}</strong> ({payment.method})
                                  </p>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {order.items.map((item, i) => (
                                  <div
                                    key={i}
                                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-center"
                                  >
                                    <div className="flex items-center gap-2">
                                      {item.menu_item_avatar ? (
                                        <img
                                          src={item.menu_item_avatar}
                                          alt={item.menu_item_name || ''}
                                          className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200"
                                        />
                                      ) : (
                                        <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                          <UtensilsCrossed className="w-3.5 h-3.5" />
                                        </div>
                                      )}
                                      <div>
                                        <span className="font-bold text-slate-800">
                                          {item.quantity}× {item.menu_item_name}
                                        </span>
                                        {item.note && (
                                          <p className="text-[11px] text-amber-700 italic mt-0.5">
                                            "{item.note}"
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <span className="font-mono text-emerald-600 font-bold ml-2">
                                      ${(Number(item.price_at_order) * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
