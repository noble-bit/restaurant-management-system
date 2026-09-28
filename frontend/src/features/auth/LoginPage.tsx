import React, { useState } from 'react';
import { UtensilsCrossed, Mail, Lock, ArrowRight, AlertCircle, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f3f7f6] relative overflow-hidden font-sans text-slate-800">
      {/* Background ambient light soft blur shapes */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-red-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher Top Right */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-1.5 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
        <Globe className="w-4 h-4 text-slate-400 ml-2" />
        <button
          type="button"
          onClick={() => changeLanguage('en')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
            i18n.language?.startsWith('en')
              ? 'bg-red-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => changeLanguage('am')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
            i18n.language?.startsWith('am')
              ? 'bg-red-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          አማርኛ
        </button>
      </div>

      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 z-10 relative">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25 mb-4 text-white">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">GourmetControl</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">{t('auth.portal')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              {t('auth.emailLabel')}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              {t('auth.passwordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
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

        <p className="text-xs text-center text-slate-400 mt-8 leading-relaxed">
          {t('auth.authorizedNotice')}
        </p>
      </div>
    </div>
  );
};
