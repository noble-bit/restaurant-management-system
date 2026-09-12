import api from './axios';
import type {
  CreateOrderPayload,
  CreatedOrderResponse,
  OrderPaymentDetailsResponse,
  OrderStatus,
  PaymentMethod,
  PaymentResponse,
} from '../types';

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

export const processPaymentApi = async (
  orderId: number,
  method: PaymentMethod
): Promise<PaymentResponse> => {
  const response = await api.post<PaymentResponse>(`/orders/${orderId}/pay/`, { method });
  return response.data;
};

export const getOrderPaymentDetailsApi = async (
  orderId: number
): Promise<OrderPaymentDetailsResponse> => {
  const response = await api.get<OrderPaymentDetailsResponse>(`/orders/${orderId}/payment/`);
  return response.data;
};
