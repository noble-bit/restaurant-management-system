import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { StaffMember, UserRole } from '../../types';
import { getStaffListApi, deleteStaffApi } from '../../api/staff';
import { CreateStaffModal } from './CreateStaffModal';
import { TempPasswordModal } from './TempPasswordModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
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
  Loader2,
  AlertTriangle,
  X,
  XCircle,
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
  const [deletingId, setDeletingId] = useState<number | null>(null);
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

  const handleDeleteStaff = async (staff: StaffMember) => {
    setDeleteError(null);
    const staffName = staff.first_name
      ? `${staff.first_name} ${staff.last_name}`.trim()
      : staff.username;

    if (!window.confirm(t('staff.deactivateStaffConfirm', { name: staffName }))) {
      return;
    }

    setDeletingId(staff.id);
    try {
      await deleteStaffApi(staff.id);
      showToast(t('staff.deactivatedToast', { name: staffName }), 'info');
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, is_active: false } : s))
      );
    } catch (err: unknown) {
      console.error('Failed to deactivate staff member:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { status?: number; data?: { detail?: string } } }).response;
        if (resp?.status === 403) {
          const msg = t('common.error');
          setDeleteError(msg);
          showToast(msg, 'error');
        } else {
          const detail = resp?.data?.detail || t('staff.deactivateFailedToast');
          setDeleteError(detail);
          showToast(detail, 'error');
        }
      } else {
        const msg = t('auth.networkError');
        setDeleteError(msg);
        showToast(msg, 'error');
      }
    } finally {
      setDeletingId(null);
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
    const map: Record<UserRole, string> = {
      owner: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      manager: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      chef: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      waiter: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      cashier: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full border capitalize ${
          map[role] || 'bg-gray-800 text-gray-300 border-gray-700'
        }`}
      >
        {t(`roles.${role}`, { defaultValue: role })}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{t('staff.title')}</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('staff.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {isOwnerOrManager && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm shrink-0"
          >
            <UserPlus className="w-5 h-5" />
            <span>{t('staff.addNewStaff')}</span>
          </button>
        )}
      </div>

      {/* Inline Error Alert Banner */}
      {deleteError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{deleteError}</span>
          </div>
          <button
            onClick={() => setDeleteError(null)}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-rose-500/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          {/* Show Inactive Staff Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900 accent-indigo-600 cursor-pointer"
            />
            <span>{t('staff.showInactive')}</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('staff.role')}:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2.5 rounded-xl glass-input text-xs bg-gray-900 capitalize"
            >
              <option value="all" className="bg-gray-900">{t('common.all')}</option>
              <option value="owner" className="bg-gray-900">{t('roles.owner')}</option>
              <option value="manager" className="bg-gray-900">{t('roles.manager')}</option>
              <option value="chef" className="bg-gray-900">{t('roles.chef')}</option>
              <option value="waiter" className="bg-gray-900">{t('roles.waiter')}</option>
              <option value="cashier" className="bg-gray-900">{t('roles.cashier')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : filteredStaff.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center">
          <Users className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-gray-300">{t('staff.noStaff')}</h3>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold border-b border-gray-800 tracking-wider">
                <tr>
                  <th className="py-4 px-6">{t('common.name')}</th>
                  <th className="py-4 px-6">{t('staff.role')}</th>
                  <th className="py-4 px-6">{t('staff.contactInfo')}</th>
                  <th className="py-4 px-6">{t('staff.hireDate')}</th>
                  <th className="py-4 px-6">{t('staff.securityStatus')}</th>
                  {isOwnerOrManager && <th className="py-4 px-6 text-right">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {filteredStaff.map((staff) => {
                  const isInactive = staff.is_active === false;
                  return (
                    <tr
                      key={staff.id}
                      className={`transition-colors ${
                        isInactive ? 'bg-gray-900/40 opacity-60' : 'hover:bg-gray-800/40'
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                              isInactive
                                ? 'bg-gray-800 text-gray-400 border border-gray-700'
                                : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
                            }`}
                          >
                            {(staff.first_name?.[0] || staff.username[0]).toUpperCase()}
                          </div>
                          <div>
                            <p
                              className={`font-semibold text-sm ${
                                isInactive ? 'text-gray-400 line-through' : 'text-white'
                              }`}
                            >
                              {staff.first_name
                                ? `${staff.first_name} ${staff.last_name}`
                                : staff.username}
                            </p>
                            <p className="text-xs text-gray-400">@{staff.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">{getRoleBadge(staff.role)}</td>
                      <td className="py-4 px-6 space-y-1">
                        <p className="text-gray-300 font-mono text-[11px]">{staff.email}</p>
                        {staff.phone_number && (
                          <p className="text-gray-500 text-[11px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{staff.phone_number}</span>
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {staff.hire_date ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                            <span>{staff.hire_date}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isInactive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-gray-800/80 text-gray-400 border border-gray-700">
                            <XCircle className="w-3.5 h-3.5 text-gray-500" />
                            {t('staff.statusInactive')}
                          </span>
                        ) : staff.must_change_password ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {t('staff.pendingPasswordChange')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {t('staff.activeAndVerified')}
                          </span>
                        )}
                      </td>
                      {isOwnerOrManager && (
                        <td className="py-4 px-6 text-right">
                          {!isInactive ? (
                            <button
                              onClick={() => handleDeleteStaff(staff)}
                              disabled={deletingId === staff.id}
                              className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20 disabled:opacity-50"
                              title={t('common.delete')}
                            >
                              {deletingId === staff.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-500 italic pr-2">
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

      {/* Modals */}
      <CreateStaffModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleStaffCreated}
      />

      {createdStaffTempPass && (
        <TempPasswordModal
          isOpen={true}
          onClose={() => setCreatedStaffTempPass(null)}
          staffName={createdStaffTempPass.name}
          tempPassword={createdStaffTempPass.pass}
        />
      )}
    </div>
  );
};
