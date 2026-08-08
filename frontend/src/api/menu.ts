import api from './axios';
import type {
  CreateMenuCategoryPayload,
  CreateMenuItemPayload,
  MenuCategory,
  MenuItem,
  UpdateMenuCategoryPayload,
  UpdateMenuItemPayload,
} from '../types';

// Categories API (/api/v1/categories/)
export const getMenuCategoriesApi = async (): Promise<MenuCategory[]> => {
  const response = await api.get<MenuCategory[]>('/categories/');
  return response.data;
};

export const getMenuCategoryApi = async (id: number): Promise<MenuCategory> => {
  const response = await api.get<MenuCategory>(`/categories/${id}/`);
  return response.data;
};

export const createMenuCategoryApi = async (
  payload: CreateMenuCategoryPayload
): Promise<MenuCategory> => {
  const response = await api.post<MenuCategory>('/categories/', payload);
  return response.data;
};

export const updateMenuCategoryApi = async (
  id: number,
  payload: UpdateMenuCategoryPayload
): Promise<MenuCategory> => {
  const response = await api.patch<MenuCategory>(`/categories/${id}/`, payload);
  return response.data;
};

export const deleteMenuCategoryApi = async (id: number): Promise<void> => {
  await api.delete(`/categories/${id}/`);
};

// Menu Items API (/api/v1/items/)
export const getMenuItemsApi = async (): Promise<MenuItem[]> => {
  const response = await api.get<MenuItem[]>('/items/');
  return response.data;
};

export const getMenuItemApi = async (id: number): Promise<MenuItem> => {
  const response = await api.get<MenuItem>(`/items/${id}/`);
  return response.data;
};

export const createMenuItemApi = async (payload: CreateMenuItemPayload): Promise<MenuItem> => {
  const response = await api.post<MenuItem>('/items/', payload);
  return response.data;
};

export const updateMenuItemApi = async (
  id: number,
  payload: UpdateMenuItemPayload
): Promise<MenuItem> => {
  const response = await api.patch<MenuItem>(`/items/${id}/`, payload);
  return response.data;
};

export const deleteMenuItemApi = async (id: number): Promise<void> => {
  await api.delete(`/items/${id}/`);
};
