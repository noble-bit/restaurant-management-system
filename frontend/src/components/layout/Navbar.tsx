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
  User,
  KeyRound,
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
  onChangePasswordClick,
  onProfileClick,
  onNavigateTab,
  onOpenMobileSidebar,
}) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { cartCount, activeOrdersCount } = useCart();
  const { theme, toggleTheme } = useTheme();

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const currentLang = i18n.language.startsWith('am') ? 'am' : 'en';

  const roleKey = user?.role ? `roles.${user.role}` : '';
  const translatedRole = user?.role ? t(roleKey, { defaultValue: user.role }) : '';

  const canPlaceOrder = user?.role && ['owner', 'manager', 'waiter'].includes(user.role);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
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
    <header className="h-16 sm:h-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs shrink-0">
      {/* Left Greeting & Mobile Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
          title="Open menu"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base md:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight truncate">
            <span className="hidden sm:inline">{t('nav.welcomeBack')}{' '}</span>
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
      <div className="flex items-center gap-1 sm:gap-2.5 md:gap-3.5 shrink-0">
        {/* Primary Red Pill Button for New Order (if role permits, desktop/tablet only) */}
        {canPlaceOrder && (
          <button
            onClick={() => onNavigateTab('new-order')}
            className="hidden sm:flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('nav.newOrder')}</span>
          </button>
        )}

        {/* Cart Icon Button with Real Badge */}
        {canPlaceOrder && (
          <button
            onClick={() => onNavigateTab('new-order')}
            className="relative p-2 sm:p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl sm:rounded-2xl transition-all border border-slate-100 dark:border-slate-800 shrink-0 cursor-pointer"
            title={t('orders.currentCart')}
            aria-label={t('orders.currentCart')}
          >
            <ShoppingCart className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        )}

        {/* Bell Icon Button with Real Queue Badge */}
        <button
          onClick={handleBellClick}
          className="relative p-2 sm:p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl sm:rounded-2xl transition-all border border-slate-100 dark:border-slate-800 shrink-0 cursor-pointer"
          title="Active Orders Queue"
          aria-label="Active Orders Queue"
        >
          <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          {activeOrdersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-xs">
              {activeOrdersCount}
            </span>
          )}
        </button>

        {/* Dark Mode Theme Toggle (Desktop / Tablet) */}
        <button
          onClick={toggleTheme}
          className="hidden md:flex p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl transition-all cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 shrink-0" />
          )}
        </button>

        {/* Language Selector Dropdown (Desktop / Tablet) */}
        <div className="relative hidden md:block" ref={langRef}>
          <button
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 text-red-500 shrink-0" />
            <span>{currentLang === 'am' ? 'አማርኛ' : 'EN'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {isLangDropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 py-1.5 z-50">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full flex items-center justify-between px-4 py-2 text-xs font-semibold cursor-pointer ${
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
                className={`w-full flex items-center justify-between px-4 py-2 text-xs font-semibold cursor-pointer ${
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

        {/* User Info Capsule & Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 p-1 sm:p-1.5 sm:pr-3 rounded-full transition-all cursor-pointer group min-h-[40px]"
            title="User menu"
            aria-label="User menu"
            aria-expanded={isUserMenuOpen}
          >
            <Avatar
              src={user?.avatar}
              name={user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
              size="sm"
              showOnlineStatus={true}
            />
            <div className="text-left hidden lg:block max-w-[90px] truncate">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 leading-tight truncate">
                {translatedRole}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-slate-100 dark:border-slate-700 mb-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                  @{user?.username}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] font-bold capitalize">
                  {translatedRole}
                </span>
              </div>

              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onProfileClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{t('profile.title')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onChangePasswordClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <span>{t('nav.changePassword')}</span>
                </button>

                {/* Mobile-only quick toggles inside avatar dropdown */}
                <div className="md:hidden pt-1 border-t border-slate-100 dark:border-slate-700 my-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-slate-600" />
                      )}
                      <span>Theme</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{theme}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextLang = currentLang === 'am' ? 'en' : 'am';
                      handleLanguageChange(nextLang);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-red-500" />
                      <span>Language</span>
                    </div>
                    <span className="text-[10px] text-red-500 font-bold">{currentLang === 'am' ? 'አማርኛ' : 'EN'}</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-700 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Direct Header Logout Button */}
        <button
          onClick={logout}
          title={t('nav.logout')}
          aria-label={t('nav.logout')}
          className="p-2 sm:p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl sm:rounded-2xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 shrink-0 cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
};
