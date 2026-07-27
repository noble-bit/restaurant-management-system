import api from './axios';
import type { JwtTokenResponse, RefreshTokenResponse, User } from '../types';

export const loginApi = async (email: string, password: string): Promise<JwtTokenResponse> => {
  const response = await api.post<JwtTokenResponse>('/auth/jwt/create/', { email, password });
  return response.data;
};

export const refreshTokenApi = async (refresh: string): Promise<RefreshTokenResponse> => {
  const response = await api.post<RefreshTokenResponse>('/auth/jwt/refresh/', { refresh });
  return response.data;
};

export const getMeApi = async (): Promise<User> => {
  const response = await api.get<User>('/auth/users/me/');
  return response.data;
};

export const setPasswordApi = async (current_password: string, new_password: string): Promise<void> => {
  await api.post('/auth/users/set_password/', {
    current_password,
    new_password,
    re_new_password: new_password,
  });
};
