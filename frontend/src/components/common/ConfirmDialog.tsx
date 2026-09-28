import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const iconMap = {
    danger: <Trash2 className="w-6 h-6 text-rose-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    primary: <Info className="w-6 h-6 text-red-500" />,
  };

  const iconBgMap = {
    danger: 'bg-rose-50 border-rose-100',
    warning: 'bg-amber-50 border-amber-100',
    primary: 'bg-red-50 border-red-100',
  };

  const buttonVariantMap = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    primary: 'primary' as const,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-2xl border ${iconBgMap[variant]} shrink-0`}>
          {iconMap[variant]}
        </div>
        <div>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {cancelText || t('common.cancel')}
        </Button>
        <Button
          variant={buttonVariantMap[variant]}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText || t('common.confirm')}
        </Button>
      </div>
    </Modal>
  );
};
