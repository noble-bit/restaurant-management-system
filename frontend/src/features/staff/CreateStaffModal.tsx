import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import type { CreateStaffPayload, StaffMember, UserRole } from '../../types';
import { createStaffApi } from '../../api/staff';
import { useToast } from '../../context/ToastContext';
import { UserPlus, Mail, User as UserIcon, Phone, Calendar, Shield, AlertCircle } from 'lucide-react';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStaff: StaffMember) => void;
}

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateStaffPayload>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'waiter',
    phone_number: '',
    hire_date: new Date().toISOString().split('T')[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createStaffApi(formData);
      showToast(t('staff.createdToast', { name: created.username }), 'success');
      onSuccess(created);
      onClose();
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'waiter',
        phone_number: '',
        hire_date: new Date().toISOString().split('T')[0],
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: Record<string, string[]> } }).response;
        if (resp?.data) {
          const firstErrKey = Object.keys(resp.data)[0];
          const firstErrVal = resp.data[firstErrKey];
          setError(`${firstErrKey}: ${Array.isArray(firstErrVal) ? firstErrVal.join(' ') : firstErrVal}`);
        } else {
          setError(t('common.error'));
        }
      } else {
        setError(t('auth.networkError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('staff.registerTitle')} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Username *"
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="johndoe"
              leftIcon={<UserIcon className="w-4 h-4" />}
            />
          </div>

          <div>
            <Input
              label={`${t('staff.email')} *`}
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="john@restaurant.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label={t('staff.firstName')}
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="John"
            />
          </div>

          <div>
            <Input
              label={t('staff.lastName')}
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Select
              label={`${t('staff.role')} *`}
              name="role"
              value={formData.role}
              onChange={handleChange}
              leftIcon={<Shield className="w-4 h-4 text-slate-400" />}
            >
              {(['owner', 'manager', 'chef', 'waiter', 'cashier'] as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`, { defaultValue: r })}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Input
              label={t('staff.phone')}
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="5551234567"
              maxLength={10}
              leftIcon={<Phone className="w-4 h-4" />}
            />
          </div>

          <div>
            <Input
              label={t('staff.hireDate')}
              type="date"
              name="hire_date"
              value={formData.hire_date || ''}
              onChange={handleChange}
              leftIcon={<Calendar className="w-4 h-4" />}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<UserPlus className="w-4 h-4" />}
          >
            {isSubmitting ? t('common.saving') : t('staff.addStaff')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
