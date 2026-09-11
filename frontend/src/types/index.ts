export type UserRole = 'owner' | 'manager' | 'chef' | 'waiter' | 'cashier';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number: string;
  hire_date: string | null;
  must_change_password: boolean;
}

export interface JwtTokenResponse {
  access: string;
  refresh: string;
  must_change_password?: boolean;
  role?: UserRole;
}

export interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

export type UnitOfMeasure = 'g' | 'kg' | 'l' | 'ml' | 'pcs';

export interface Ingredient {
  id: number;
  name: string;
  quantity_on_hand: string | number;
  unit_of_measure: UnitOfMeasure;
  reorder_threshold: string | number;
  cost_per_unit: string | number;
  is_active: boolean;
  is_low_stock: boolean;
}

export interface CreateIngredientPayload {
  name: string;
  unit_of_measure: UnitOfMeasure;
  reorder_threshold: number;
  cost_per_unit: number;
}

export interface UpdateIngredientPayload {
  name?: string;
  unit_of_measure?: UnitOfMeasure;
  reorder_threshold?: number;
  cost_per_unit?: number;
}

export interface StaffMember {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number: string;
  hire_date: string | null;
  must_change_password: boolean;
  temp_password?: string;
}

export interface CreateStaffPayload {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
  hire_date?: string | null;
}

export type MovementReason = 'restock' | 'order_deduction' | 'waste' | 'correction';

export interface StockMovement {
  id: number;
  ingredient: number;
  ingredient_name?: string;
  quantity_delta: string | number;
  reason: MovementReason;
  staff: number | null;
  staff_name?: string;
  created_at: string;
}

// Menu App Types
export interface MenuCategory {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface CreateMenuCategoryPayload {
  name: string;
  display_order: number;
  is_active?: boolean;
}

export interface UpdateMenuCategoryPayload {
  name?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface MenuItemIngredientPayload {
  ingredient_id: number;
  quantity_required: number;
}

export interface MenuItemIngredient {
  id?: number;
  ingredient: Ingredient;
  ingredient_id?: number;
  quantity_required: string | number;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: string | number;
  category: MenuCategory;
  category_id?: number;
  is_available: boolean;
  is_active?: boolean;
  ingredients: MenuItemIngredient[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateMenuItemPayload {
  name: string;
  description?: string;
  price: number;
  category_id: number;
  ingredients: MenuItemIngredientPayload[];
}

export interface UpdateMenuItemPayload {
  name?: string;
  description?: string;
  price?: number;
  category_id?: number;
  ingredients?: MenuItemIngredientPayload[];
}

// Helper to extract field-specific validation errors from DRF response JSON
export const parseApiFieldErrors = (err: unknown): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (err && typeof err === 'object' && 'response' in err) {
    const respData = (err as { response?: { data?: unknown } }).response?.data;
    if (respData && typeof respData === 'object' && !Array.isArray(respData)) {
      for (const [key, val] of Object.entries(respData as Record<string, unknown>)) {
        if (Array.isArray(val)) {
          errors[key] = val.map(String).join(' ');
        } else if (typeof val === 'string') {
          errors[key] = val;
        } else if (val !== null && val !== undefined) {
          errors[key] = JSON.stringify(val);
        }
      }
    } else if (typeof respData === 'string') {
      errors['non_field_errors'] = respData.startsWith('<') ? 'Server error' : respData;
    }
  }
  return errors;
};

// Orders App Types
export type OrderType = 'dine_in' | 'takeout' | 'delivery';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';

export interface OrderItemPayload {
  menu_item_id: number;
  quantity: number;
  note?: string;
}

export interface CreateOrderPayload {
  items: OrderItemPayload[];
  order_type: OrderType;
  table_number?: string;
}

export interface CreatedOrderItemResponse {
  id: number;
  menu_item: number;
  menu_item_name: string;
  quantity: number;
  price_at_order: string | number;
  note?: string;
}

export interface CreatedOrderResponse {
  id: number;
  staff: number;
  staff_name?: string;
  status: OrderStatus | string;
  order_type: OrderType;
  table_number: string;
  total_price: string | number;
  items: CreatedOrderItemResponse[];
  created_at: string;
  updated_at: string;
}

// Payment App Types
export type PaymentMethod = 'cash' | 'card' | 'mobile';

export interface PaymentResponse {
  id: number;
  order_id: number;
  amount: string | number;
  method: PaymentMethod;
  status: string;
  processed_by_name: string;
  created_at: string;
}

