import React, { useState } from 'react';
import { UtensilsCrossed, Mail, Lock, ArrowRight, AlertCircle, Globe, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: { detail?: string; non_field_errors?: string[] } } }).response;
        if (resp?.data?.detail) {
          setError(resp.data.detail);
        } else if (resp?.data?.non_field_errors?.[0]) {
          setError(resp.data.non_field_errors[0]);
        } else {
          setError(t('auth.invalidCredentials'));
        }
      } else {
        setError(t('auth.networkError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#f3f7f6] dark:bg-slate-900 relative overflow-y-auto font-sans text-slate-800 dark:text-slate-100">
      {/* Background ambient light soft blur shapes */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-red-200/40 dark:bg-red-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-900/15 rounded-full blur-3xl pointer-events-none" />

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

      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-6 sm:p-8 md:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 z-10 relative mt-12 sm:mt-0">
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25 mb-4 text-white">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">GourmetControl</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{t('auth.portal')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t('auth.emailLabel')}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full pl-11 pr-4 py-3 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t('auth.passwordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full pl-11 pr-12 py-3 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer rounded-xl"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] py-3.5 px-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer mt-2"
          >
            {isSubmitting ? (
              <span>{t('auth.authenticating')}</span>
            ) : (
              <>
                <span>{t('auth.signIn')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400 dark:text-slate-400 mt-6 sm:mt-8 leading-relaxed">
          {t('auth.authorizedNotice')}
        </p>
      </div>
    </div>
  );
};
