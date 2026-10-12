import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { MenuItem, MenuCategory, OrderType, CreatedOrderResponse } from '../../types';
import { getMenuItemsApi, getMenuCategoriesApi } from '../../api/menu';
import { createOrderApi } from '../../api/orders';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
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
  UtensilsCrossed,
  Sparkles,
  RefreshCw,
  Clock,
  MapPin,
  FileText,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface ApiErrorState {
  code: 400 | 403 | 409 | 500 | 0;
  title: string;
  message: string;
}

export const NewOrderPage: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const {
    cart,
    addToCart,
    updateQuantity,
    setExactQuantity,
    updateNote,
    removeFromCart,
    clearCart,
    refreshActiveOrders,
  } = useCart();

  // Menu Catalog State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(100);

  // Order Details Form State
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState('');

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

      // Dynamically calculate maximum price in catalog for slider range max
      if (itemsData.length > 0) {
        const highest = Math.max(...itemsData.map((i) => Number(i.price) || 0));
        setMaxPriceFilter(Math.ceil(highest) || 100);
      }
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

  // Max price limit calculation
  const maxCatalogPrice = useMemo(() => {
    if (menuItems.length === 0) return 100;
    return Math.ceil(Math.max(...menuItems.map((i) => Number(i.price) || 0))) || 100;
  }, [menuItems]);

  const handleToggleCategory = (catId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setMaxPriceFilter(maxCatalogPrice);
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
      clearCart();
      refreshActiveOrders();
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
    clearCart();
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
      selectedCategories.length === 0 || selectedCategories.includes(itemCatId);

    const itemPrice = Number(item.price) || 0;
    const matchesPrice = itemPrice <= maxPriceFilter;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Mobile Filter Drawer & Mobile Cart Bottom Sheet States
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Lock body scroll when mobile filter or cart bottom sheet is open
  useEffect(() => {
    if (isMobileFilterOpen || isMobileCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFilterOpen, isMobileCartOpen]);

  // Close drawers on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileFilterOpen(false);
        setIsMobileCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalCartItemsCount = cart.reduce((s, i) => s + i.quantity, 0);

  const activeFilterCount =
    (selectedCategories.length > 0 ? selectedCategories.length : 0) +
    (maxPriceFilter < maxCatalogPrice ? 1 : 0);

  const cartContent = (
    <form onSubmit={handleSubmitOrder} className="space-y-5">
      {apiError && (
        <div
          className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
            apiError.code === 409
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 shadow-xs'
              : apiError.code === 403
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {apiError.code === 409 ? (
              <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : apiError.code === 403 ? (
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{apiError.title}</span>
          </div>
          <p className="mt-1 font-medium">{apiError.message}</p>
        </div>
      )}

      {/* 1. ORDER TYPE SELECTOR */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
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
              className={`min-h-[44px] py-2 px-2.5 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer flex items-center justify-center ${
                orderType === type
                  ? 'bg-red-500 text-white border-red-500 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t(`orders.${type === 'dine_in' ? 'dineIn' : type}`, {
                defaultValue: type.replace('_', ' '),
              })}
            </button>
          ))}
        </div>
      </div>

      {/* 2. TABLE NUMBER INPUT */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {t('orders.tableNumLabel')} {orderType === 'dine_in' ? '*' : ''}
          </label>
          {orderType === 'dine_in' && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
              {t('orders.tableRequiredMsg')}
            </span>
          )}
        </div>
        <Input
          leftIcon={<MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
          value={tableNumber}
          onChange={(e) => {
            setTableNumber(e.target.value);
            setApiError(null);
          }}
          placeholder={orderType === 'dine_in' ? 'e.g. T-12' : ''}
          error={isTableNumberMissing ? t('orders.tableEnterPrompt') : undefined}
        />
      </div>

      {/* 3. RUNNING CART ITEMS LIST */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {t('orders.selectedItems')} ({cart.length})
        </label>

        {cart.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('orders.cartEmptyMsg')}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 sm:max-h-72 overflow-y-auto overscroll-contain pr-1">
            {cart.map((item) => {
              const lineSubtotal = Number(item.menu_item.price) * item.quantity;

              return (
                <div
                  key={item.menu_item.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.menu_item.avatar ? (
                        <img
                          src={item.menu_item.avatar}
                          alt={item.menu_item.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 shrink-0">
                          <UtensilsCrossed className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                          {item.menu_item.name}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          ${Number(item.menu_item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.menu_item.id)}
                      className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                      title={t('common.delete')}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) =>
                        updateNote(item.menu_item.id, e.target.value)
                      }
                      placeholder={t('orders.lineNotePlaceholder')}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-400"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-xs">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.menu_item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          setExactQuantity(
                            item.menu_item.id,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-9 text-center text-xs font-bold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.menu_item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
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
      <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
          {t('orders.estimatedTotal')}
        </span>
        <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
          ${cartSubtotal.toFixed(2)}
        </span>
      </div>

      {/* 5. SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full min-h-[48px] py-3.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer"
      >
        {isSubmitting ? (
          <span>{t('orders.submittingOrder')}</span>
        ) : (
          <>
            <ShoppingCart className="w-4.5 h-4.5" />
            <span>
              {t('orders.placeOrder')} (${cartSubtotal.toFixed(2)})
            </span>
          </>
        )}
      </button>
    </form>
  );

  const filterContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-red-500 dark:text-red-400" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">{t('common.filter')}</h3>
        </div>
        <button
          type="button"
          onClick={handleResetFilters}
          className="text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer min-h-[36px] px-2 py-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('common.all')}</span>
        </button>
      </div>

      {/* Search Input (Desktop) */}
      <div className="hidden lg:block">
        <Input
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
        />
      </div>

      {/* Category Checkboxes */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {t('common.category')}
        </label>
        <div className="space-y-1.5 max-h-56 overflow-y-auto overscroll-contain pr-1">
          {categories.map((c) => {
            const isSelected = selectedCategories.includes(c.id);
            return (
              <label
                key={c.id}
                className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none min-h-[40px]"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleCategory(c.id)}
                  className="rounded border-slate-300 dark:border-slate-600 text-red-500 focus:ring-red-400 w-4.5 h-4.5 cursor-pointer"
                />
                <span className={isSelected ? 'font-bold text-red-600 dark:text-red-400' : 'font-medium'}>
                  {c.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {t('common.price')}
          </label>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            ${maxPriceFilter.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={maxCatalogPrice}
          step="1"
          value={maxPriceFilter}
          onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
          className="w-full accent-red-500 cursor-pointer h-2"
        />
        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          <span>$0</span>
          <span>${maxCatalogPrice}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800/90 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl border border-red-100/80 dark:border-red-900/40 shadow-xs shrink-0">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
              {t('orders.placementTitle')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">{t('orders.placementDesc')}</p>
          </div>
        </div>

        <button
          onClick={fetchMenu}
          title={t('orders.refreshMenu')}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 min-h-[40px] bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="hidden sm:inline">{t('orders.refreshMenu')}</span>
        </button>
      </div>

      {/* CONFIRMED ORDER VIEW */}
      {confirmedOrder ? (
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-3xl border border-emerald-200 dark:border-emerald-800/80 shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                    {t('orders.orderPlacedTitle')}
                  </h2>
                  <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 uppercase">
                    #{confirmedOrder.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {new Date(confirmedOrder.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span>•</span>
                  <span className="capitalize font-bold text-red-500 dark:text-red-400">
                    {t(`orders.${confirmedOrder.order_type === 'dine_in' ? 'dineIn' : confirmedOrder.order_type}`, {
                      defaultValue: confirmedOrder.order_type.replace('_', ' '),
                    })}
                  </span>
                  {confirmedOrder.table_number && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {t('dashboard.table')} {confirmedOrder.table_number}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={handleStartAnotherOrder}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-2xl shadow-sm transition-all text-sm shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('orders.startAnotherOrder')}</span>
            </button>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3">
              {t('orders.snapshotsTitle')}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200/80 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-5">{t('menu.menuItemCol')}</th>
                      <th className="py-3.5 px-5">{t('orders.priceAtOrder')}</th>
                      <th className="py-3.5 px-5">{t('common.quantity')}</th>
                      <th className="py-3.5 px-5">{t('orders.lineSubtotal')}</th>
                      <th className="py-3.5 px-5">{t('orders.specialNotes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                    {confirmedOrder.items.map((item) => {
                      const priceSnap = Number(item.price_at_order);
                      const lineTotal = priceSnap * item.quantity;
                      return (
                        <tr key={item.id} className="hover:bg-white dark:hover:bg-slate-800 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-slate-800 dark:text-slate-100">
                            <div className="flex items-center gap-2.5">
                              {item.menu_item_avatar ? (
                                <img
                                  src={item.menu_item_avatar}
                                  alt={item.menu_item_name || ''}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                                  <UtensilsCrossed className="w-4 h-4" />
                                </div>
                              )}
                              <span>{item.menu_item_name || `Item #${item.menu_item}`}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 font-mono text-slate-600 dark:text-slate-400">
                            ${priceSnap.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-red-500 dark:text-red-400">{item.quantity}</td>
                          <td className="py-3.5 px-5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ${lineTotal.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-5 italic text-slate-500 dark:text-slate-400">
                            {item.note ? `"${item.note}"` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 font-bold">
                    <tr>
                      <td colSpan={3} className="py-4 px-5 text-right text-slate-500 dark:text-slate-400 uppercase">
                        {t('orders.confirmedTotal')}
                      </td>
                      <td className="py-4 px-5 text-emerald-600 dark:text-emerald-400 text-base font-mono">
                        ${Number(confirmedOrder.total_price).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN CATALOG & CART LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* MOBILE SEARCH & FILTER BAR (< lg) */}
          <div className="lg:hidden col-span-1 flex items-center gap-2 w-full">
            <div className="flex-1">
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
                activeFilterCount > 0
                  ? 'bg-red-500 text-white border-red-500 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              aria-label="Open filter options"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{t('common.filter')}</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-red-600 text-[10px] font-extrabold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* DESKTOP FILTER PANEL (3 Cols on LG, hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-3 bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)]">
            {filterContent}
          </div>

          {/* PRODUCT CARD GRID (Primary view on mobile, 5 cols on LG) */}
          <div className={`col-span-1 lg:col-span-5 space-y-4 ${cart.length > 0 ? 'pb-24 lg:pb-0' : ''}`}>
            {isLoadingMenu ? (
              <LoadingSpinner text={t('menu.loadingCatalog')} />
            ) : filteredMenuItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-800/90 p-8 sm:p-12 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center flex flex-col items-center justify-center">
                <UtensilsCrossed className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">{t('orders.dishesNoMatch')}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 max-w-xs">{t('orders.adjustSearch')}</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 min-h-[44px] text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  {t('common.all')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {filteredMenuItems.map((item) => {
                  const isAvailable = item.is_available;
                  const isInCart = cart.some((ci) => ci.menu_item.id === item.id);
                  const cartItem = cart.find((ci) => ci.menu_item.id === item.id);

                  return (
                    <div
                      key={item.id}
                      className={`bg-white dark:bg-slate-800/90 p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.4)] ${
                        isAvailable
                          ? 'border-slate-100 dark:border-slate-700/60 hover:border-red-200 dark:hover:border-red-800/60'
                          : 'border-slate-100 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-900/40'
                      }`}
                    >
                      {/* Top Right Price Badge Pill */}
                      <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10">
                        <span className="bg-emerald-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-xs">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      </div>

                      <div>
                        {/* Food Photo / Icon */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-slate-100 dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-600 p-1 flex items-center justify-center overflow-hidden mb-2.5 sm:mb-3 shadow-xs">
                          {item.avatar ? (
                            <img
                              src={item.avatar}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <UtensilsCrossed className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500" />
                          )}
                        </div>

                        {/* Bold Item Name */}
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm text-center leading-tight mb-1">
                          {item.name}
                        </h4>

                        {/* Short Description */}
                        {item.description && (
                          <p className="text-xs text-slate-400 dark:text-slate-400 text-center line-clamp-2 mb-3 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Add Button with 44px min tap target */}
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        disabled={!isAvailable}
                        className={`w-full min-h-[44px] py-2.5 px-3 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer mt-2 ${
                          !isAvailable
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                            : isInCart
                            ? 'bg-red-500 text-white shadow-xs hover:bg-red-600'
                            : 'border-2 border-red-500 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {!isAvailable
                            ? t('orders.outOfStock')
                            : isInCart
                            ? `${t('orders.addToOrder')} (${cartItem?.quantity} in cart)`
                            : t('orders.addToOrder')}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DESKTOP CART PANEL (4 Cols on LG, hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-24">
            <Card padding="md" className="shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-red-500 dark:text-red-400" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{t('orders.currentCart')}</h3>
                </div>
                <Badge variant="primary" size="md">
                  {totalCartItemsCount} {t('dashboard.items')}
                </Badge>
              </div>

              {cartContent}
            </Card>
          </div>
        </div>
      )}

      {/* MOBILE FILTER DRAWER (< lg) */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl z-10 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3 shrink-0" />
            <div className="overflow-y-auto flex-1 min-h-0 pr-1">
              {filterContent}
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full min-h-[44px] py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE PERSISTENT FLOATING CART BAR (< lg) */}
      {!confirmedOrder && cart.length > 0 && !isMobileCartOpen && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative p-2 bg-red-500 text-white rounded-xl shadow-xs shrink-0">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-extrabold px-1.5 rounded-full border border-white dark:border-slate-900 min-w-[18px] text-center">
                  {totalCartItemsCount}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {totalCartItemsCount} {t('dashboard.items')}
                </p>
                <p className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 leading-tight">
                  ${cartSubtotal.toFixed(2)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="min-h-[44px] px-5 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer shrink-0"
            >
              <span>View Order</span>
              <span className="font-mono text-xs opacity-90">(${cartSubtotal.toFixed(2)})</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE EXPANDED CART BOTTOM SHEET (< lg) */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileCartOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-10 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-250 border-t border-slate-200 dark:border-slate-800">
            {/* Top Drag Indicator & Header */}
            <div className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {t('orders.currentCart')}
                  </h3>
                  <Badge variant="primary" size="sm">
                    {totalCartItemsCount}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close cart sheet"
                >
                  <RotateCcw className="w-4 h-4 hidden" />
                  <span className="text-sm font-bold">✕</span>
                </button>
              </div>
            </div>

            {/* Scrollable Cart Content */}
            <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 p-4 sm:p-5">
              {cartContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
