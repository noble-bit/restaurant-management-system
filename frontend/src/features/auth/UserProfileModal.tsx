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
      setErrorMsg('Invalid file type. Please select an image file (JPEG, PNG, WEBP, GIF).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Client-side validation: size limit (5MB)
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg('Image size exceeds 5MB limit. Please choose a smaller image.');
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
      showToast('Profile photo updated successfully!', 'success');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: unknown) {
      console.error('Failed to upload profile photo:', err);
      setErrorMsg('Failed to upload profile photo. Please try again.');
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
    <Modal isOpen={isOpen} onClose={onClose} title="My Profile" maxWidth="md">
      <div className="space-y-6">
        {/* Inline Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Avatar & Upload Section */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl glass-card border border-gray-800 space-y-4 text-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-indigo-500/30 shadow-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
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
              className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg border-2 border-gray-900 transition-all disabled:opacity-50"
              title="Select profile photo"
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
            <h3 className="text-lg font-bold text-white">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">@{user?.username}</p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Save Photo</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClearSelection}
                disabled={isUploading}
                className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl glass-panel border border-gray-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-gray-400 font-medium">{t('auth.emailLabel')}</p>
              <p className="text-white font-semibold font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl glass-panel border border-gray-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-gray-400 font-medium">{t('nav.currentRole')}</p>
              <p className="text-white font-semibold capitalize">{translatedRole}</p>
            </div>
          </div>

          {user?.phone_number && (
            <div className="p-3.5 rounded-xl glass-panel border border-gray-800 flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-gray-400 font-medium">{t('staff.phone')}</p>
                <p className="text-white font-semibold">{user.phone_number}</p>
              </div>
            </div>
          )}

          {user?.hire_date && (
            <div className="p-3.5 rounded-xl glass-panel border border-gray-800 flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-gray-400 font-medium">{t('staff.hireDate')}</p>
                <p className="text-white font-semibold">{user.hire_date}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
