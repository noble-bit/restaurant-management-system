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
