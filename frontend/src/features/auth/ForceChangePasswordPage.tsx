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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0f19] relative overflow-hidden">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-gray-800 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-4 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 mb-4">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            {isForced ? t('auth.passwordRequiredTitle') : t('auth.changePasswordTitle')}
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            {isForced
              ? t('auth.forcedNotice', { name: displayName })
              : t('auth.voluntaryNotice')}
          </p>
        </div>

        {isForced && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              {t('auth.firstLoginSafety')}
            </span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {t('auth.currentPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('auth.currentPasswordPlaceholder')}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {t('auth.newPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.newPasswordPlaceholder')}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {t('auth.confirmPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{isSubmitting ? t('auth.updatingPassword') : t('auth.updatePasswordBtn')}</span>
          </button>
        </form>

        <div className="mt-6 flex justify-center border-t border-gray-800 pt-4">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('auth.signOutInstead')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
