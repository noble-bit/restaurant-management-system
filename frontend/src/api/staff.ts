import api from './axios';
import type { CreateStaffPayload, StaffMember } from '../types';

export const getStaffListApi = async (): Promise<StaffMember[]> => {
  const response = await api.get<StaffMember[]>('/staff/');
  return response.data;
};

export const createStaffApi = async (payload: CreateStaffPayload): Promise<StaffMember> => {
  const response = await api.post<StaffMember>('/staff/', payload);
  return response.data;
};

export const deleteStaffApi = async (id: number): Promise<void> => {
  await api.delete(`/staff/${id}/`);
};

