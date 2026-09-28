import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Key, Copy, Check, AlertTriangle } from 'lucide-react';

interface TempPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  tempPassword: string;
}

export const TempPasswordModal: React.FC<TempPasswordModalProps> = ({
  isOpen,
  onClose,
  staffName,
  tempPassword,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('staff.tempPasswordTitle')} maxWidth="md">
      <div className="space-y-6 py-2">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed font-semibold">
            {t('staff.shareTempPasswordMsg', { name: staffName })}
          </p>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Key className="w-4 h-4 text-red-500" />
            <span>{t('staff.oneTimePasscode')}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="font-mono text-2xl font-extrabold tracking-widest text-emerald-600 select-all bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
              {tempPassword}
            </span>
            <Button
              type="button"
              variant={copied ? 'success' : 'primary'}
              icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopy}
            >
              {copied ? t('staff.copied') : t('staff.copyPassword')}
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="primary"
            fullWidth={true}
            onClick={onClose}
          >
            {t('staff.securedPasswordBtn')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
