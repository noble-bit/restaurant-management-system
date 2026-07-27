import React, { useEffect, useState, useCallback } from 'react';
import type { StaffMember, UserRole } from '../../types';
import { getStaffListApi } from '../../api/staff';
import { CreateStaffModal } from './CreateStaffModal';
import { TempPasswordModal } from './TempPasswordModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { UserPlus, Search, Users, ShieldAlert, Phone, Calendar } from 'lucide-react';

export const StaffListPage: React.FC = () => {
  const { showToast } = useToast();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

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
      showToast('Failed to load staff list. Check permissions or backend connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

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

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || s.role === selectedRole;
    return matchesSearch && matchesRole;
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
        {role}
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
              <h1 className="text-2xl font-bold text-white tracking-tight">Staff Management</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Register new restaurant staff, monitor roles, and manage system accounts.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm shrink-0"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add New Staff Member</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2.5 rounded-xl glass-input text-xs bg-gray-900 capitalize"
          >
            <option value="all" className="bg-gray-900">All Roles</option>
            <option value="owner" className="bg-gray-900">Owner</option>
            <option value="manager" className="bg-gray-900">Manager</option>
            <option value="chef" className="bg-gray-900">Chef</option>
            <option value="waiter" className="bg-gray-900">Waiter</option>
            <option value="cashier" className="bg-gray-900">Cashier</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      {isLoading ? (
        <LoadingSpinner text="Loading staff records..." />
      ) : filteredStaff.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center">
          <Users className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-gray-300">No staff members found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            No active staff match your search or filter parameters.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold border-b border-gray-800 tracking-wider">
                <tr>
                  <th className="py-4 px-6">Staff Member</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Contact Info</th>
                  <th className="py-4 px-6">Hire Date</th>
                  <th className="py-4 px-6">Security Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                          {(staff.first_name?.[0] || staff.username[0]).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {staff.first_name ? `${staff.first_name} ${staff.last_name}` : staff.username}
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
                      {staff.must_change_password ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Pending Password Change
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active & Verified
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
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
