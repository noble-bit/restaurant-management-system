import React, { useState } from 'react';
import { KeyRound, Lock, AlertTriangle, CheckCircle, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

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
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const displayName = user?.first_name || user?.username || '';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f3f7f6] relative overflow-hidden font-sans text-slate-800">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isForced ? t('auth.passwordRequiredTitle') : t('auth.changePasswordTitle')}
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {isForced
              ? t('auth.forcedNotice', { name: displayName })
              : t('auth.voluntaryNotice')}
          </p>
        </div>

        {isForced && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>{t('auth.firstLoginSafety')}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              {t('auth.currentPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('auth.currentPasswordPlaceholder')}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              {t('auth.newPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.newPasswordPlaceholder')}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              {t('auth.confirmPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? t('auth.updatingPassword') : t('auth.updatePasswordBtn')}</span>
          </button>
        </form>

        <div className="mt-6 flex justify-center border-t border-slate-100 pt-4">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('auth.signOutInstead')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
