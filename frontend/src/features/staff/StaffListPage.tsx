import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { StaffMember, UserRole } from '../../types';
import { getStaffListApi, deleteStaffApi } from '../../api/staff';
import { CreateStaffModal } from './CreateStaffModal';
import { TempPasswordModal } from './TempPasswordModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  UserPlus,
  Search,
  Users,
  ShieldAlert,
  Phone,
  Calendar,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';

export const StaffListPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  // Deactivate modal state
  const [deactivatingStaff, setDeactivatingStaff] = useState<StaffMember | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdStaffTempPass, setCreatedStaffTempPass] = useState<{
    name: string;
    pass: string;
  } | null>(null);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStaffListApi();
      setStaffList(data);
    } catch (err: unknown) {
      console.error('Error fetching staff list:', err);
      showToast(t('common.error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleStaffCreated = (newStaff: StaffMember) => {
    fetchStaff();
    if (newStaff.temp_password) {
      setCreatedStaffTempPass({
        name: `${newStaff.first_name || newStaff.username}`,
        pass: newStaff.temp_password,
      });
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingStaff) return;
    setDeleteError(null);
    setIsDeactivating(true);

    const staffName = deactivatingStaff.first_name
      ? `${deactivatingStaff.first_name} ${deactivatingStaff.last_name}`.trim()
      : deactivatingStaff.username;

    try {
      await deleteStaffApi(deactivatingStaff.id);
      showToast(t('staff.deactivatedToast', { name: staffName }), 'info');
      setStaffList((prev) =>
        prev.map((s) => (s.id === deactivatingStaff.id ? { ...s, is_active: false } : s))
      );
      setDeactivatingStaff(null);
    } catch (err: unknown) {
      console.error('Failed to deactivate staff member:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { status?: number; data?: { detail?: string } } }).response;
        const detail = resp?.data?.detail;
        if (resp?.status === 403 || detail) {
          const msg = detail || t('staff.cannotDeleteSelf', { defaultValue: 'You cannot delete your own account.' });
          setDeleteError(msg);
          showToast(msg, 'error');
        } else {
          const msg = t('staff.deactivateFailedToast');
          setDeleteError(msg);
          showToast(msg, 'error');
        }
      } else {
        const msg = t('auth.networkError');
        setDeleteError(msg);
        showToast(msg, 'error');
      }
    } finally {
      setIsDeactivating(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || s.role === selectedRole;
    const matchesActive = showInactive || s.is_active !== false;
    return matchesSearch && matchesRole && matchesActive;
  });

  const getRoleBadge = (role: UserRole) => {
    const map: Record<UserRole, 'primary' | 'success' | 'warning' | 'info' | 'neutral'> = {
      owner: 'primary',
      manager: 'info',
      chef: 'warning',
      waiter: 'success',
      cashier: 'neutral',
    };
    return (
      <Badge variant={map[role] || 'neutral'}>
        {t(`roles.${role}`, { defaultValue: role })}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <PageHeader
        title={t('staff.title')}
        subtitle={t('staff.subtitle')}
        icon={<Users className="w-6 h-6" />}
        actions={
          isOwnerOrManager && (
            <Button
              variant="primary"
              icon={<UserPlus className="w-5 h-5" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              {t('staff.addNewStaff')}
            </Button>
          )
        }
      />

      {/* Inline Error Alert Banner */}
      {deleteError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3 font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{deleteError}</span>
          </div>
          <button
            onClick={() => setDeleteError(null)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          {/* Show Inactive Staff Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-400 cursor-pointer"
            />
            <span>{t('staff.showInactive')}</span>
          </label>

          <div className="w-full sm:w-44">
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">{t('common.all')}</option>
              <option value="owner">{t('roles.owner')}</option>
              <option value="manager">{t('roles.manager')}</option>
              <option value="chef">{t('roles.chef')}</option>
              <option value="waiter">{t('roles.waiter')}</option>
              <option value="cashier">{t('roles.cashier')}</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : filteredStaff.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-slate-400" />}
          title={t('staff.noStaff')}
          actionText={isOwnerOrManager ? t('staff.addNewStaff') : undefined}
          onAction={isOwnerOrManager ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold border-b border-slate-100 tracking-wider">
                <tr>
                  <th className="py-4 px-6">{t('common.name')}</th>
                  <th className="py-4 px-6">{t('staff.role')}</th>
                  <th className="py-4 px-6">{t('staff.contactInfo')}</th>
                  <th className="py-4 px-6">{t('staff.hireDate')}</th>
                  <th className="py-4 px-6">{t('staff.securityStatus')}</th>
                  {isOwnerOrManager && <th className="py-4 px-6 text-right">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStaff.map((staff) => {
                  const isInactive = staff.is_active === false;
                  const isSelf = user?.id === staff.id || (user?.email && user.email === staff.email);
                  const fullName = staff.first_name
                    ? `${staff.first_name} ${staff.last_name}`.trim()
                    : staff.username;

                  return (
                    <tr
                      key={staff.id}
                      className={`transition-colors ${
                        isInactive ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={fullName}
                            size="sm"
                            showOnlineStatus={!isInactive}
                          />
                          <div>
                            <p
                              className={`font-bold text-sm ${
                                isInactive ? 'text-slate-400 line-through' : 'text-slate-800'
                              }`}
                            >
                              {fullName}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">@{staff.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">{getRoleBadge(staff.role)}</td>
                      <td className="py-4 px-6 space-y-0.5">
                        <p className="text-slate-700 font-mono text-[11px] font-medium">{staff.email}</p>
                        {staff.phone_number && (
                          <p className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{staff.phone_number}</span>
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {staff.hire_date ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{staff.hire_date}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isInactive ? (
                          <Badge variant="neutral" dot={true}>
                            {t('staff.statusInactive')}
                          </Badge>
                        ) : staff.must_change_password ? (
                          <Badge variant="warning">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>{t('staff.pendingPasswordChange')}</span>
                          </Badge>
                        ) : (
                          <Badge variant="success" dot={true}>
                            {t('staff.activeAndVerified')}
                          </Badge>
                        )}
                      </td>
                      {isOwnerOrManager && (
                        <td className="py-4 px-6 text-right">
                          {isSelf ? null : !isInactive ? (
                            <button
                              onClick={() => setDeactivatingStaff(staff)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic pr-2 font-medium">
                              {t('staff.statusInactive')}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      <CreateStaffModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleStaffCreated}
      />

      {/* Temp Password Modal */}
      {createdStaffTempPass && (
        <TempPasswordModal
          isOpen={true}
          onClose={() => setCreatedStaffTempPass(null)}
          staffName={createdStaffTempPass.name}
          tempPassword={createdStaffTempPass.pass}
        />
      )}

      {/* Confirm Deactivate Dialog */}
      {deactivatingStaff && (
        <ConfirmDialog
          isOpen={Boolean(deactivatingStaff)}
          onClose={() => setDeactivatingStaff(null)}
          onConfirm={handleConfirmDeactivate}
          title={t('common.delete')}
          message={t('staff.deactivateStaffConfirm', {
            name: deactivatingStaff.first_name
              ? `${deactivatingStaff.first_name} ${deactivatingStaff.last_name}`
              : deactivatingStaff.username,
          })}
          confirmText={t('common.delete')}
          variant="danger"
          isLoading={isDeactivating}
        />
      )}
    </div>
  );
};
