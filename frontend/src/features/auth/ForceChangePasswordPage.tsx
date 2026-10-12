import React, { useState } from 'react';
import { KeyRound, Lock, AlertTriangle, CheckCircle, LogOut, Globe, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

interface ForceChangePasswordPageProps {
  onSuccess?: () => void;
  isForced?: boolean;
}

export const ForceChangePasswordPage: React.FC<ForceChangePasswordPageProps> = ({
  onSuccess,
  isForced = true,
}) => {
  const { updatePassword, logout, user } = useAuth();
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(currentPassword, newPassword);
      showToast(t('auth.passwordUpdateSuccess'), 'success');
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: Record<string, string[]> } }).response;
        if (resp?.data?.current_password) {
          setError(`${t('auth.currentPasswordLabel')}: ${resp.data.current_password.join(' ')}`);
        } else if (resp?.data?.new_password) {
          setError(`${t('auth.newPasswordLabel')}: ${resp.data.new_password.join(' ')}`);
        } else {
          setError(t('auth.passwordUpdateFailed'));
        }
      } else {
        setError(t('common.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const displayName = user?.first_name || user?.username || '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#f3f7f6] dark:bg-slate-900 relative overflow-y-auto font-sans text-slate-800 dark:text-slate-100">
      {/* Top Bar: Theme & Language Switchers */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto z-20 flex items-center justify-between sm:justify-end gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-xs">
          <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500 ml-1.5 hidden sm:block" />
          <button
            type="button"
            onClick={() => changeLanguage('en')}
            className={`px-3 py-1.5 min-h-[34px] text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center justify-center ${
              i18n.language?.startsWith('en')
                ? 'bg-red-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => changeLanguage('am')}
            className={`px-3 py-1.5 min-h-[34px] text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center justify-center ${
              i18n.language?.startsWith('am')
                ? 'bg-red-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            አማርኛ
          </button>
        </div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-6 sm:p-8 md:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xl dark:shadow-2xl relative z-10 mt-12 sm:mt-0">
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isForced ? t('auth.passwordRequiredTitle') : t('auth.changePasswordTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {isForced
              ? t('auth.forcedNotice', { name: displayName })
              : t('auth.voluntaryNotice')}
          </p>
        </div>

        {isForced && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>{t('auth.firstLoginSafety')}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('auth.currentPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('auth.currentPasswordPlaceholder')}
                className="w-full pl-11 pr-12 py-3 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer rounded-xl"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('auth.newPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.newPasswordPlaceholder')}
                className="w-full pl-11 pr-12 py-3 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer rounded-xl"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('auth.confirmPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                className="w-full pl-11 pr-12 py-3 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer rounded-xl"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] py-3.5 px-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? t('auth.updatingPassword') : t('auth.updatePasswordBtn')}</span>
          </button>
        </form>

        <div className="mt-6 flex justify-center border-t border-slate-100 dark:border-slate-700 pt-4">
          <button
            onClick={logout}
            className="flex items-center gap-2 min-h-[44px] px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('auth.signOutInstead')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
