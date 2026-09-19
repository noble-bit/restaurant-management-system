import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { MenuItem, MenuCategory, OrderType, CreatedOrderResponse } from '../../types';
import { getMenuItemsApi, getMenuCategoriesApi } from '../../api/menu';
import { createOrderApi } from '../../api/orders';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Search,
  Filter,
  Utensils,
  Sparkles,
  RefreshCw,
  Clock,
  MapPin,
  FileText,
} from 'lucide-react';

interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  note: string;
}

interface ApiErrorState {
  code: 400 | 403 | 409 | 500 | 0;
  title: string;
  message: string;
}

export const NewOrderPage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Menu Catalog State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Order Details Form State
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Submission & API Error State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<ApiErrorState | null>(null);

  // Post-201 Order Confirmation State
  const [confirmedOrder, setConfirmedOrder] = useState<CreatedOrderResponse | null>(null);

  const fetchMenu = useCallback(async () => {
    setIsLoadingMenu(true);
    try {
      const [itemsData, catsData] = await Promise.all([
        getMenuItemsApi(),
        getMenuCategoriesApi(),
      ]);
      setMenuItems(itemsData);
      setCategories(catsData);
    } catch (err: unknown) {
      console.error('Failed to fetch menu items:', err);
      showToast(t('common.error'), 'error');
    } finally {
      setIsLoadingMenu(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleAddToCart = (item: MenuItem) => {
    if (!item.is_available) {
      showToast(t('orders.outOfStock'), 'warning');
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((ci) => ci.menu_item.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prevCart, { menu_item: item, quantity: 1, note: '' }];
    });
  };

  const handleUpdateQuantity = (itemId: number, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((ci) => {
          if (ci.menu_item.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter((ci): ci is CartItem => ci !== null)
    );
  };

  const handleSetExactQuantity = (itemId: number, qty: number) => {
    if (qty < 1) return;
    setCart((prevCart) =>
      prevCart.map((ci) => (ci.menu_item.id === itemId ? { ...ci, quantity: qty } : ci))
    );
  };

  const handleUpdateNote = (itemId: number, note: string) => {
    setCart((prevCart) =>
      prevCart.map((ci) => (ci.menu_item.id === itemId ? { ...ci, note } : ci))
    );
  };

  const handleRemoveFromCart = (itemId: number) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.menu_item.id !== itemId));
  };

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + Number(item.menu_item.price) * item.quantity,
    0
  );

  const isTableNumberMissing = orderType === 'dine_in' && !tableNumber.trim();
  const isSubmitDisabled = cart.length === 0 || isTableNumberMissing || isSubmitting;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (cart.length === 0) {
      setApiError({
        code: 400,
        title: t('orders.emptyCart'),
        message: t('orders.cartEmptyMsg'),
      });
      return;
    }

    if (orderType === 'dine_in' && !tableNumber.trim()) {
      setApiError({
        code: 400,
        title: t('orders.tableNumLabel'),
        message: t('orders.tableEnterPrompt'),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        order_type: orderType,
        table_number: orderType === 'dine_in' ? tableNumber.trim() : '',
        items: cart.map((ci) => ({
          menu_item_id: ci.menu_item.id,
          quantity: ci.quantity,
          note: ci.note.trim() || undefined,
        })),
      };

      const response = await createOrderApi(payload);
      setConfirmedOrder(response);
      showToast(t('orders.orderSuccess', { id: response.id }), 'success');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (
          err as {
            response?: {
              status?: number;
              data?: { detail?: string; table_number?: string[]; items?: string[] };
            };
          }
        ).response;

        const statusCode = resp?.status || 0;
        const respData = resp?.data;
        const detailMsg =
          respData?.detail ||
          respData?.table_number?.[0] ||
          respData?.items?.[0] ||
          'An unexpected error occurred while placing the order.';

        if (statusCode === 409) {
          setApiError({
            code: 409,
            title: 'Stock Conflict (409)',
            message: detailMsg,
          });
        } else if (statusCode === 403) {
          setApiError({
            code: 403,
            title: 'Access Restricted (403)',
            message: detailMsg,
          });
        } else {
          setApiError({
            code: statusCode as 400,
            title: `${t('common.error')} (${statusCode})`,
            message: detailMsg,
          });
        }
      } else {
        setApiError({
          code: 0,
          title: t('auth.networkError'),
          message: t('auth.networkError'),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartAnotherOrder = () => {
    setConfirmedOrder(null);
    setCart([]);
    setTableNumber('');
    setOrderType('dine_in');
    setApiError(null);
    fetchMenu();
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const itemCatId =
      typeof item.category === 'object' && item.category !== null
        ? item.category.id
        : Number(item.category || item.category_id || 0);

    const matchesCategory =
      selectedCategoryFilter === 'all' || itemCatId === Number(selectedCategoryFilter);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl text-white shadow-lg shadow-indigo-500/25">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('orders.placementTitle')}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {t('orders.placementDesc')}
            </p>
          </div>
        </div>

        <button
          onClick={fetchMenu}
          title={t('orders.refreshMenu')}
          className="flex items-center gap-2 px-4 py-2.5 glass-panel hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl border border-gray-700 text-xs font-semibold transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t('orders.refreshMenu')}</span>
        </button>
      </div>

      {/* CONFIRMED ORDER VIEW */}
      {confirmedOrder ? (
        <div className="glass-panel p-8 rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-gray-900 to-gray-950 shadow-2xl space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-white">{t('orders.orderPlacedTitle')}</h2>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    #{confirmedOrder.id}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    {new Date(confirmedOrder.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span>•</span>
                  <span className="capitalize font-semibold text-indigo-400">
                    {t(`orders.${confirmedOrder.order_type === 'dine_in' ? 'dineIn' : confirmedOrder.order_type}`, { defaultValue: confirmedOrder.order_type.replace('_', ' ') })}
                  </span>
                  {confirmedOrder.table_number && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 font-bold">
                        {t('dashboard.table')} {confirmedOrder.table_number}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={handleStartAnotherOrder}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('orders.startAnotherOrder')}</span>
            </button>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t('orders.snapshotsTitle')}
            </h3>
            <div className="glass-card rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-5">{t('menu.menuItemCol')}</th>
                    <th className="py-3 px-5">{t('orders.priceAtOrder')}</th>
                    <th className="py-3 px-5">{t('common.quantity')}</th>
                    <th className="py-3 px-5">{t('orders.lineSubtotal')}</th>
                    <th className="py-3 px-5">{t('orders.specialNotes')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-gray-300">
                  {confirmedOrder.items.map((item) => {
                    const priceSnap = Number(item.price_at_order);
                    const lineTotal = priceSnap * item.quantity;
                    return (
                      <tr key={item.id} className="hover:bg-gray-800/40">
                        <td className="py-3.5 px-5 font-semibold text-white">
                          {item.menu_item_name || `Item #${item.menu_item}`}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-gray-300">
                          ${priceSnap.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-indigo-400">{item.quantity}</td>
                        <td className="py-3.5 px-5 font-mono font-bold text-emerald-400">
                          ${lineTotal.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-5 italic text-gray-400">
                          {item.note ? `"${item.note}"` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-900/90 border-t border-gray-800 font-bold">
                  <tr>
                    <td colSpan={3} className="py-4 px-5 text-right text-gray-400 uppercase">
                      {t('orders.confirmedTotal')}
                    </td>
                    <td className="py-4 px-5 text-emerald-400 text-base font-mono">
                      ${Number(confirmedOrder.total_price).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN ORDER FORM */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MENU CATALOG */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.search')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="relative w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 rounded-xl glass-input text-xs bg-gray-900"
                >
                  <option value="all" className="bg-gray-900">
                    {t('menu.allCategories')}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-gray-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoadingMenu ? (
              <LoadingSpinner text={t('menu.loadingCatalog')} />
            ) : filteredMenuItems.length === 0 ? (
              <div className="glass-card p-12 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center">
                <Utensils className="w-12 h-12 text-gray-600 mb-3" />
                <h3 className="text-base font-bold text-gray-300">{t('orders.dishesNoMatch')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('orders.adjustSearch')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMenuItems.map((item) => {
                  const categoryName =
                    typeof item.category === 'object' && item.category !== null
                      ? item.category.name
                      : t('menu.generalMenu');

                  const isAvailable = item.is_available;

                  return (
                    <div
                      key={item.id}
                      className={`glass-card p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                        isAvailable
                          ? 'border-gray-800 hover:border-indigo-500/40'
                          : 'border-rose-900/30 opacity-75 bg-gray-950/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-white text-sm leading-tight">{item.name}</h4>
                          <span className="font-mono font-bold text-emerald-400 text-sm shrink-0">
                            ${Number(item.price).toFixed(2)}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {categoryName}
                          </span>

                          {isAvailable ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {t('menu.available')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              {t('menu.unavailable')}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!isAvailable}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                          isAvailable
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isAvailable ? t('orders.addToOrder') : t('orders.outOfStock')}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RUNNING CART */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-gray-800 shadow-xl sticky top-20">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-base">{t('orders.currentCart')}</h3>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-300">
                  {cart.reduce((s, i) => s + i.quantity, 0)} {t('dashboard.items')}
                </span>
              </div>

              {apiError && (
                <div
                  className={`mb-5 p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                    apiError.code === 409
                      ? 'bg-rose-950/80 border-rose-600 text-rose-200 shadow-lg shadow-rose-900/30'
                      : apiError.code === 403
                      ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                      : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {apiError.code === 409 ? (
                      <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : apiError.code === 403 ? (
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{apiError.title}</span>
                  </div>
                  <p className="mt-1 font-medium">{apiError.message}</p>
                </div>
              )}

              <form onSubmit={handleSubmitOrder} className="space-y-5">
                {/* 1. ORDER TYPE SELECTOR */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {t('orders.orderTypeLabel')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['dine_in', 'takeout', 'delivery'] as OrderType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setOrderType(type);
                          setApiError(null);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                          orderType === type
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                            : 'glass-card border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        {t(`orders.${type === 'dine_in' ? 'dineIn' : type}`, { defaultValue: type.replace('_', ' ') })}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. TABLE NUMBER INPUT */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t('orders.tableNumLabel')} {orderType === 'dine_in' ? '*' : ''}
                    </label>
                    {orderType === 'dine_in' && (
                      <span className="text-[10px] text-amber-400 font-medium">{t('orders.tableRequiredMsg')}</span>
                    )}
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => {
                        setTableNumber(e.target.value);
                        setApiError(null);
                      }}
                      placeholder={orderType === 'dine_in' ? 'e.g. T-12' : ''}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs ${
                        isTableNumberMissing ? 'border-amber-500/60 focus:border-amber-400' : ''
                      }`}
                    />
                  </div>
                  {isTableNumberMissing && (
                    <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{t('orders.tableEnterPrompt')}</span>
                    </p>
                  )}
                </div>

                {/* 3. RUNNING CART ITEMS LIST */}
                <div className="space-y-3 pt-3 border-t border-gray-800">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {t('orders.selectedItems')} ({cart.length})
                  </label>

                  {cart.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-gray-800 text-center">
                      <p className="text-xs text-gray-500">
                        {t('orders.cartEmptyMsg')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {cart.map((item) => {
                        const lineSubtotal = Number(item.menu_item.price) * item.quantity;

                        return (
                          <div
                            key={item.menu_item.id}
                            className="p-3 rounded-xl glass-card border border-gray-800 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-white text-xs">
                                  {item.menu_item.name}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  ${Number(item.menu_item.price).toFixed(2)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(item.menu_item.id)}
                                className="text-gray-500 hover:text-rose-400 p-1 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="relative">
                              <FileText className="w-3 h-3 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={item.note}
                                onChange={(e) =>
                                  handleUpdateNote(item.menu_item.id, e.target.value)
                                }
                                placeholder={t('orders.lineNotePlaceholder')}
                                className="w-full pl-7 pr-2 py-1 text-[11px] glass-input rounded-lg"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.menu_item.id, -1)}
                                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-gray-800"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleSetExactQuantity(
                                      item.menu_item.id,
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="w-8 text-center text-xs font-bold bg-transparent text-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.menu_item.id, 1)}
                                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-gray-800"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="font-mono font-bold text-xs text-emerald-400">
                                ${lineSubtotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. TOTAL SUMMARY */}
                <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">{t('orders.estimatedTotal')}</span>
                  <span className="text-xl font-extrabold font-mono text-emerald-400">
                    ${cartSubtotal.toFixed(2)}
                  </span>
                </div>

                {/* 5. SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>{t('orders.submittingOrder')}</span>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>{t('orders.placeOrder')} (${cartSubtotal.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
