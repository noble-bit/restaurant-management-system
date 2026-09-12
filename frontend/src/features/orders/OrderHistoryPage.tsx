import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { CreatedOrderResponse, OrderPaymentDetailsResponse, PaymentMethod } from '../../types';
import { getOrdersApi, getOrderPaymentDetailsApi } from '../../api/orders';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatCard } from '../../components/common/StatCard';
import { useToast } from '../../context/ToastContext';
import {
  History,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Receipt,
  TrendingUp,
  MapPin,
  Clock,
  User,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Smartphone,
  UserCheck,
} from 'lucide-react';

type DateFilterOption = 'all' | 'today' | '7days' | '30days';

export const OrderHistoryPage: React.FC = () => {
  const { showToast } = useToast();

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
      // 1. Fetch paid orders: GET /api/v1/orders/?status=paid
      const data = await getOrdersApi('paid');
      setOrders(data);

      // 2. Fetch per-row payment details using GET /api/v1/orders/{id}/payment/
      const paymentPromises = data.map(async (order) => {
        try {
          const paymentData = await getOrderPaymentDetailsApi(order.id);
          return { orderId: order.id, payment: paymentData };
        } catch {
          // Graceful fallback for missing/unrecorded payment details
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
      showToast('Failed to load order history.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPaidOrders();
  }, [fetchPaidOrders]);

  const toggleExpand = (orderId: number) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Helper to render Payment Method badge
  const getPaymentMethodBadge = (method: PaymentMethod) => {
    const map: Record<PaymentMethod, { style: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
      cash: { style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Cash', icon: Banknote },
      card: { style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: 'Card', icon: CreditCard },
      mobile: { style: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'Mobile', icon: Smartphone },
    };
    const info = map[method] || { style: 'bg-gray-800 text-gray-300 border-gray-700', label: method, icon: DollarSign };
    const Icon = info.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${info.style}`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{info.label}</span>
      </span>
    );
  };

  // Filter Logic
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return orders.filter((order) => {
      // Search Filter
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

      // Order Type Filter
      const matchesType =
        orderTypeFilter === 'all' || order.order_type === orderTypeFilter;

      // Date Filter
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

  // Statistics Calculations
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + Number(order.total_price), 0);
  }, [filteredOrders]);

  const totalCount = filteredOrders.length;
  const avgOrderValue = totalCount > 0 ? totalRevenue / totalCount : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Order History</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Read-only historical ledger of all completed and paid customer orders.
            </p>
          </div>
        </div>

        <button
          onClick={fetchPaidOrders}
          className="flex items-center gap-2 px-4 py-2.5 glass-panel hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl border border-gray-700 text-xs font-semibold transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Total Settled Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          subtitle="Sum of paid transactions"
          icon={DollarSign}
          iconColor="text-emerald-400"
        />

        <StatCard
          title="Paid Transactions"
          value={isLoading ? '...' : totalCount}
          subtitle="Completed order records"
          icon={Receipt}
          iconColor="text-purple-400"
        />

        <StatCard
          title="Average Order Value"
          value={`$${avgOrderValue.toFixed(2)}`}
          subtitle="Revenue per paid order"
          icon={TrendingUp}
          iconColor="text-indigo-400"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order #, table, staff, dish, or payment method..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>

        {/* Date & Order Type Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Date Filter Dropdown */}
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
              className="pl-8 pr-3 py-2.5 rounded-xl glass-input text-xs bg-gray-900"
            >
              <option value="all" className="bg-gray-900">All Time</option>
              <option value="today" className="bg-gray-900">Today Only</option>
              <option value="7days" className="bg-gray-900">Last 7 Days</option>
              <option value="30days" className="bg-gray-900">Last 30 Days</option>
            </select>
          </div>

          {/* Order Type Filter Dropdown */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="pl-8 pr-3 py-2.5 rounded-xl glass-input text-xs bg-gray-900"
            >
              <option value="all" className="bg-gray-900">All Order Types</option>
              <option value="dine_in" className="bg-gray-900">Dine In</option>
              <option value="takeout" className="bg-gray-900">Takeout</option>
              <option value="delivery" className="bg-gray-900">Delivery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dense Scannable Table */}
      {isLoading ? (
        <LoadingSpinner text="Loading paid order records & payment details..." />
      ) : filteredOrders.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-gray-800 text-center flex flex-col items-center justify-center">
          <History className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-gray-300">No paid orders match filter</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            {orders.length === 0
              ? 'No orders have been marked as paid yet.'
              : 'Try adjusting your search query or date range filters.'}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/90 text-gray-400 uppercase font-semibold border-b border-gray-800 tracking-wider">
                <tr>
                  <th className="py-4 px-6">Order Ref & Type</th>
                  <th className="py-4 px-6">Date & Time Placed</th>
                  <th className="py-4 px-6">Ordered Items Summary</th>
                  <th className="py-4 px-6">Payment Method</th>
                  <th className="py-4 px-6">Staff / Cashier</th>
                  <th className="py-4 px-6">Total Settled</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {filteredOrders.map((order) => {
                  const isExpanded = Boolean(expandedOrders[order.id]);
                  const itemsCount = order.items.length;
                  const payment = paymentsMap[order.id];

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-800/40 transition-colors">
                        {/* Order ID & Type */}
                        <td className="py-4 px-6 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-extrabold">Order #{order.id}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              {order.order_type.replace('_', ' ')}
                            </span>
                          </div>
                          {order.table_number && (
                            <p className="text-xs text-amber-400 font-bold flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              Table {order.table_number}
                            </p>
                          )}
                        </td>

                        {/* Date & Time */}
                        <td className="py-4 px-6 text-gray-400 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
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
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800 text-gray-200 border border-gray-700 text-[11px]"
                                >
                                  <strong className="text-indigo-400 font-bold">{item.quantity}×</strong>
                                  <span>{item.menu_item_name || `Dish #${item.menu_item}`}</span>
                                </span>
                              ))}

                              {itemsCount > 3 && (
                                <button
                                  onClick={() => toggleExpand(order.id)}
                                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 ml-1"
                                >
                                  <span>{isExpanded ? 'Less' : `+${itemsCount - 3} more`}</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                            </div>

                            {/* Show notes if present */}
                            {order.items.some((i) => i.note) && (
                              <div className="flex items-center gap-1 text-[11px] text-amber-300 italic mt-1">
                                <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">
                                  Notes:{' '}
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
                                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 font-mono">
                                  <UserCheck className="w-3 h-3 text-gray-500" />
                                  <span>By {payment.processed_by}</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 font-mono text-xs">—</span>
                          )}
                        </td>

                        {/* Staff */}
                        <td className="py-4 px-6 text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-500" />
                            <span>{order.staff_name || `Staff #${order.staff}`}</span>
                          </div>
                        </td>

                        {/* Total Price */}
                        <td className="py-4 px-6 font-mono text-sm font-extrabold text-emerald-400">
                          ${Number(order.total_price).toFixed(2)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                            Paid
                          </span>
                        </td>
                      </tr>

                      {/* Expandable full items drawer */}
                      {isExpanded && (
                        <tr className="bg-gray-900/60">
                          <td colSpan={7} className="py-3 px-8">
                            <div className="p-3 rounded-xl glass-card border border-gray-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                  Full Order Item Breakdown:
                                </p>
                                {payment?.processed_by && (
                                  <p className="text-[11px] text-indigo-300 font-medium">
                                    Payment Processed By: <strong className="text-white">{payment.processed_by}</strong> ({payment.method})
                                  </p>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {order.items.map((item, i) => (
                                  <div
                                    key={i}
                                    className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-xs flex justify-between items-center"
                                  >
                                    <div>
                                      <span className="font-bold text-white">
                                        {item.quantity}× {item.menu_item_name}
                                      </span>
                                      {item.note && (
                                        <p className="text-[11px] text-amber-300 italic mt-0.5">
                                          "{item.note}"
                                        </p>
                                      )}
                                    </div>
                                    <span className="font-mono text-emerald-400 font-bold ml-2">
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
