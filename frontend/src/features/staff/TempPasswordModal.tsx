import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Temporary Staff Password Generated" maxWidth="md">
      <div className="space-y-6 py-2">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200 leading-relaxed font-medium">
            Share this temporary password with <strong className="text-white">{staffName}</strong>. For security reasons, this password will <strong className="underline text-amber-300">not be shown again</strong>.
          </p>
        </div>

        <div className="p-5 glass-card rounded-2xl border border-indigo-500/30 flex flex-col items-center justify-center gap-3 relative">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>One-Time Passcode</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold tracking-widest text-emerald-400 select-all bg-gray-900/80 px-4 py-2 rounded-xl border border-gray-800">
              {tempPassword}
            </span>
            <button
              onClick={handleCopy}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-600/30"
          >
            I have secured this password
          </button>
        </div>
      </div>
    </Modal>
  );
};
