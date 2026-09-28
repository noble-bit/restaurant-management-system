import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { updateProfileAvatarApi } from '../../api/auth';
import {
  Camera,
  Upload,
  Loader2,
  AlertCircle,
  Shield,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser, updateUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roleKey = user?.role ? `roles.${user.role}` : '';
  const translatedRole = user?.role ? t(roleKey, { defaultValue: user.role }) : '';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation: image only
    if (!file.type.startsWith('image/')) {
      setErrorMsg(t('profile.invalidFileType'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Client-side validation: size limit (5MB)
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(t('profile.fileTooLarge'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      const updatedUser = await updateProfileAvatarApi(selectedFile);
      updateUser(updatedUser);
      await refreshUser();
      showToast(t('profile.photoSuccess'), 'success');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: unknown) {
      console.error('Failed to upload profile photo:', err);
      setErrorMsg(t('profile.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U';

  const avatarSrc = previewUrl || user?.avatar;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('profile.title')} maxWidth="md">
      <div className="space-y-6">
        {/* Inline Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Avatar & Upload Section */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 text-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-red-500/20 shadow-md bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white text-3xl font-bold">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.first_name || user?.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 p-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full shadow-md border-2 border-white transition-all disabled:opacity-50 cursor-pointer"
              title={t('profile.selectPhoto')}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">@{user?.username}</p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl shadow-md shadow-red-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('profile.uploading')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{t('profile.savePhoto')}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClearSelection}
                disabled={isUploading}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-300 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
            </div>
          )}
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-500 rounded-xl shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-500 font-medium">{t('auth.emailLabel')}</p>
              <p className="text-slate-900 font-semibold font-mono text-xs">{user?.email}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-500 rounded-xl shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-500 font-medium">{t('nav.currentRole')}</p>
              <p className="text-slate-900 font-semibold capitalize">{translatedRole}</p>
            </div>
          </div>

          {user?.phone_number && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-500 rounded-xl shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-500 font-medium">{t('staff.phone')}</p>
                <p className="text-slate-900 font-semibold">{user.phone_number}</p>
              </div>
            </div>
          )}

          {user?.hire_date && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-500 rounded-xl shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-500 font-medium">{t('staff.hireDate')}</p>
                <p className="text-slate-900 font-semibold">{user.hire_date}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
