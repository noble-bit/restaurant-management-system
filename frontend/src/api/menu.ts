import api from './axios';
import type {
  CreateMenuCategoryPayload,
  CreateMenuItemPayload,
  MenuCategory,
  MenuItem,
  UpdateMenuCategoryPayload,
  UpdateMenuItemPayload,
} from '../types';

// Categories API (/api/v1/menu/categories/)
export const getMenuCategoriesApi = async (): Promise<MenuCategory[]> => {
  const response = await api.get<MenuCategory[]>('/menu/categories/');
  return response.data;
};

export const getMenuCategoryApi = async (id: number): Promise<MenuCategory> => {
  const response = await api.get<MenuCategory>(`/menu/categories/${id}/`);
  return response.data;
};

export const createMenuCategoryApi = async (
  payload: CreateMenuCategoryPayload
): Promise<MenuCategory> => {
  const response = await api.post<MenuCategory>('/menu/categories/', payload);
  return response.data;
};

export const updateMenuCategoryApi = async (
  id: number,
  payload: UpdateMenuCategoryPayload
): Promise<MenuCategory> => {
  const response = await api.patch<MenuCategory>(`/menu/categories/${id}/`, payload);
  return response.data;
};

export const deleteMenuCategoryApi = async (id: number): Promise<void> => {
  await api.delete(`/menu/categories/${id}/`);
};

// Menu Items API (/api/v1/menu/items/)
export const getMenuItemsApi = async (): Promise<MenuItem[]> => {
  const response = await api.get<MenuItem[]>('/menu/items/');
  return response.data;
};

export const getMenuItemApi = async (id: number): Promise<MenuItem> => {
  const response = await api.get<MenuItem>(`/menu/items/${id}/`);
  return response.data;
};

export const createMenuItemApi = async (payload: CreateMenuItemPayload | FormData): Promise<MenuItem> => {
  let body: CreateMenuItemPayload | FormData = payload;
  if (!(payload instanceof FormData) && payload.avatar instanceof File) {
    const formData = new FormData();
    formData.append('name', payload.name);
    if (payload.description) formData.append('description', payload.description);
    formData.append('price', String(payload.price));
    formData.append('category_id', String(payload.category_id));
    formData.append('ingredients', JSON.stringify(payload.ingredients));
    formData.append('avatar', payload.avatar);
    body = formData;
  }
  const response = await api.post<MenuItem>('/menu/items/', body);
  return response.data;
};

export const updateMenuItemApi = async (
  id: number,
  payload: UpdateMenuItemPayload | FormData
): Promise<MenuItem> => {
  let body: UpdateMenuItemPayload | FormData = payload;
  if (!(payload instanceof FormData) && payload.avatar instanceof File) {
    const formData = new FormData();
    if (payload.name) formData.append('name', payload.name);
    if (payload.description !== undefined) formData.append('description', payload.description);
    if (payload.price !== undefined) formData.append('price', String(payload.price));
    if (payload.category_id !== undefined) formData.append('category_id', String(payload.category_id));
    if (payload.ingredients) formData.append('ingredients', JSON.stringify(payload.ingredients));
    formData.append('avatar', payload.avatar);
    body = formData;
  }
  const response = await api.patch<MenuItem>(`/menu/items/${id}/`, body);
  return response.data;
};

export const deleteMenuItemApi = async (id: number): Promise<void> => {
  await api.delete(`/menu/items/${id}/`);
};
