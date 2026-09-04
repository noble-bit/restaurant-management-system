import api from './axios';
import type { CreateOrderPayload, CreatedOrderResponse, OrderStatus } from '../types';

export const createOrderApi = async (
  payload: CreateOrderPayload
): Promise<CreatedOrderResponse> => {
  const response = await api.post<CreatedOrderResponse>('/orders/', payload);
  return response.data;
};

export const getOrdersApi = async (
  status?: string,
  order_type?: string
): Promise<CreatedOrderResponse[]> => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (order_type) params.order_type = order_type;

  const response = await api.get<CreatedOrderResponse[]>('/orders/', { params });
  return response.data;
};

export const getOrderDetailsApi = async (id: number): Promise<CreatedOrderResponse> => {
  const response = await api.get<CreatedOrderResponse>(`/orders/${id}/`);
  return response.data;
};

export const updateOrderStatusApi = async (
  id: number,
  status: OrderStatus
): Promise<CreatedOrderResponse> => {
  const response = await api.patch<CreatedOrderResponse>(`/orders/${id}/status/`, { status });
  return response.data;
};
