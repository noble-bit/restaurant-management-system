import api from './axios';
import type {
  CreateIngredientPayload,
  Ingredient,
  StockMovement,
  UpdateIngredientPayload,
} from '../types';

export const getIngredientsApi = async (): Promise<Ingredient[]> => {
  const response = await api.get<Ingredient[]>('/ingredients/');
  return response.data;
};

export const getLowStockIngredientsApi = async (): Promise<Ingredient[]> => {
  const response = await api.get<Ingredient[]>('/ingredients/low_stock/');
  return response.data;
};

export const createIngredientApi = async (payload: CreateIngredientPayload): Promise<Ingredient> => {
  const response = await api.post<Ingredient>('/ingredients/', payload);
  return response.data;
};

export const updateIngredientApi = async (
  id: number,
  payload: UpdateIngredientPayload
): Promise<Ingredient> => {
  const response = await api.patch<Ingredient>(`/ingredients/${id}/`, payload);
  return response.data;
};

export const deleteIngredientApi = async (id: number): Promise<void> => {
  await api.delete(`/ingredients/${id}/`);
};

export const restockIngredientApi = async (id: number, quantity: number): Promise<Ingredient> => {
  const response = await api.post<Ingredient>(`/ingredients/${id}/restock/`, { quantity });
  return response.data;
};

export const getStockMovementsApi = async (): Promise<StockMovement[]> => {
  const response = await api.get<StockMovement[]>('/stock-movements/');
  return response.data;
};
