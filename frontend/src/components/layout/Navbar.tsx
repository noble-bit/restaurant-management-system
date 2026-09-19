import React from 'react';
import { LogOut, User as UserIcon, Shield, Lock, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onChangePasswordClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onChangePasswordClick }) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language.startsWith('am') ? 'am' : 'en';

  const roleKey = user?.role ? `roles.${user.role}` : '';
  const translatedRole = user?.role ? t(roleKey, { defaultValue: user.role }) : '';

  return (
    <header className="h-16 glass-panel border-b border-gray-800/80 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {t('nav.welcomeBack')}{' '}
          <span className="text-indigo-400">{user?.first_name || user?.username}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Segmented Toggle */}
        <div className="flex items-center p-1 bg-gray-900/80 border border-gray-800 rounded-xl shadow-inner">
          <Languages className="w-3.5 h-3.5 text-gray-400 ml-1.5 mr-1" />
          <button
            onClick={() => i18n.changeLanguage('en')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              currentLang === 'en'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => i18n.changeLanguage('am')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              currentLang === 'am'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            አማ
          </button>
        </div>

        {/* User Info Capsule */}
        <div className="flex items-center gap-3 bg-gray-800/80 border border-gray-700/80 px-4 py-1.5 rounded-full">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-white leading-tight">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </p>
            <p className="text-[10px] text-gray-400 flex items-center gap-1 leading-tight">
              <Shield className="w-2.5 h-2.5 text-indigo-400" />
              <span>{translatedRole}</span>
            </p>
          </div>
        </div>

        {/* Change Password Button */}
        <button
          onClick={onChangePasswordClick}
          title={t('nav.changePassword')}
          className="p-2 text-gray-400 hover:text-indigo-300 hover:bg-gray-800/80 rounded-xl transition-all border border-transparent hover:border-gray-700"
        >
          <Lock className="w-5 h-5" />
        </button>

        {/* Logout Button */}
        <button
          onClick={logout}
          title={t('nav.logout')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </header>
  );
};
