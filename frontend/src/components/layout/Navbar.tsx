import React, { useState, useRef, useEffect } from 'react';
import {
  LogOut,
  Globe,
  ChevronDown,
  ShoppingCart,
  Bell,
  Menu,
  Plus,
  Sun,
  Moon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';

interface NavbarProps {
  onChangePasswordClick: () => void;
  onProfileClick: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onProfileClick,
  onNavigateTab,
  onOpenMobileSidebar,
}) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { cartCount, activeOrdersCount } = useCart();
  const { theme, toggleTheme } = useTheme();

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const currentLang = i18n.language.startsWith('am') ? 'am' : 'en';

  const roleKey = user?.role ? `roles.${user.role}` : '';
  const translatedRole = user?.role ? t(roleKey, { defaultValue: user.role }) : '';

  const canPlaceOrder = user?.role && ['owner', 'manager', 'waiter'].includes(user.role);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: 'en' | 'am') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    setIsLangDropdownOpen(false);
  };

  const handleBellClick = () => {
    if (!user) return;
    if (user.role === 'chef') {
      onNavigateTab('orders-kitchen');
    } else if (user.role === 'waiter') {
      onNavigateTab('orders-ready');
    } else if (user.role === 'cashier') {
      onNavigateTab('orders-payments');
    } else {
      onNavigateTab('orders-kitchen');
    }
  };

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs shrink-0">
      {/* Left Greeting & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base md:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
            {t('nav.welcomeBack')}{' '}
            <span className="text-red-500 font-extrabold">
              {user?.first_name || user?.username}
            </span>
          </h2>
          <p className="hidden md:block text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            GourmetControl Management Portal
          </p>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* Primary Red Pill Button for New Order (if role permits) */}
        {canPlaceOrder && (
          <button
            onClick={() => onNavigateTab('new-order')}
            className="hidden sm:flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{t('nav.newOrder')}</span>
          </button>
        )}

        {/* Cart Icon Button with Real Badge */}
        {canPlaceOrder && (
          <button
            onClick={() => onNavigateTab('new-order')}
            className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all border border-slate-100 dark:border-slate-800"
            title={t('orders.currentCart')}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        )}

        {/* Bell Icon Button with Real Queue Badge */}
        <button
          onClick={handleBellClick}
          className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all border border-slate-100 dark:border-slate-800"
          title="Active Orders Queue"
        >
          <Bell className="w-5 h-5" />
          {activeOrdersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
              {activeOrdersCount}
            </span>
          )}
        </button>

        {/* Dark Mode Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl transition-all cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 shrink-0" />
          )}
        </button>

        {/* Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all"
          >
            <Globe className="w-4 h-4 text-red-500 shrink-0" />
            <span>{currentLang === 'am' ? 'አማርኛ' : 'EN'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {isLangDropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 py-1.5 z-50">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full flex items-center justify-between px-4 py-2 text-xs font-semibold ${
                  currentLang === 'en'
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span>English</span>
                {currentLang === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
              </button>
              <button
                onClick={() => handleLanguageChange('am')}
                className={`w-full flex items-center justify-between px-4 py-2 text-xs font-semibold ${
                  currentLang === 'am'
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span>አማርኛ</span>
                {currentLang === 'am' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
              </button>
            </div>
          )}
        </div>

        {/* User Info Capsule */}
        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 p-1.5 pr-3 rounded-full transition-all cursor-pointer group"
          title="View profile & account settings"
        >
          <Avatar
            src={user?.avatar}
            name={user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            size="sm"
            showOnlineStatus={true}
          />
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 leading-tight">
              {translatedRole}
            </p>
          </div>
        </button>

        {/* Logout Button */}
        <button
          onClick={logout}
          title={t('nav.logout')}
          className="p-2.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
