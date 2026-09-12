import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoginPage } from './features/auth/LoginPage';
import { ForceChangePasswordPage } from './features/auth/ForceChangePasswordPage';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { IngredientListPage } from './features/inventory/IngredientListPage';
import { StockMovementsPage } from './features/inventory/StockMovementsPage';
import { StaffListPage } from './features/staff/StaffListPage';
import { MenuItemListPage } from './features/menu/MenuItemListPage';
import { CategoryListPage } from './features/menu/CategoryListPage';
import { NewOrderPage } from './features/orders/NewOrderPage';
import { KitchenQueuePage } from './features/orders/KitchenQueuePage';
import { ReadyToServePage } from './features/orders/ReadyToServePage';
import { PaymentsQueuePage } from './features/orders/PaymentsQueuePage';
import { OrderHistoryPage } from './features/orders/OrderHistoryPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Authenticating session..." />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Mandatory force password change screen
  if (user.must_change_password) {
    return <ForceChangePasswordPage isForced={true} />;
  }

  // Self-service password change from header
  if (isChangingPassword) {
    return (
      <ForceChangePasswordPage
        isForced={false}
        onSuccess={() => setIsChangingPassword(false)}
      />
    );
  }

  const isOwnerOrManager = user.role === 'owner' || user.role === 'manager';
  const canPlaceOrder = ['owner', 'manager', 'waiter'].includes(user.role);
  const canAccessKitchen = ['chef', 'manager', 'owner'].includes(user.role);
  const canAccessReady = ['waiter', 'manager', 'owner'].includes(user.role);
  const canAccessPayments = ['cashier', 'manager', 'owner'].includes(user.role);

  // Safeguards for role-restricted tabs
  if (currentTab === 'staff' && !isOwnerOrManager) setCurrentTab('dashboard');
  if (currentTab === 'order-history' && !isOwnerOrManager) setCurrentTab('dashboard');
  if (currentTab === 'new-order' && !canPlaceOrder) setCurrentTab('dashboard');
  if (currentTab === 'orders-kitchen' && !canAccessKitchen) setCurrentTab('dashboard');
  if (currentTab === 'orders-ready' && !canAccessReady) setCurrentTab('dashboard');
  if (currentTab === 'orders-payments' && !canAccessPayments) setCurrentTab('dashboard');

  return (
    <MainLayout
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      onChangePasswordClick={() => setIsChangingPassword(true)}
    >
      {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
      {currentTab === 'new-order' && canPlaceOrder && <NewOrderPage />}
      {currentTab === 'orders-kitchen' && canAccessKitchen && <KitchenQueuePage />}
      {currentTab === 'orders-ready' && canAccessReady && <ReadyToServePage />}
      {currentTab === 'orders-payments' && canAccessPayments && <PaymentsQueuePage />}
      {currentTab === 'order-history' && isOwnerOrManager && <OrderHistoryPage />}
      {currentTab === 'menu-items' && <MenuItemListPage />}
      {currentTab === 'menu-categories' && <CategoryListPage />}
      {currentTab === 'inventory' && <IngredientListPage />}
      {currentTab === 'movements' && <StockMovementsPage />}
      {currentTab === 'staff' && isOwnerOrManager && <StaffListPage />}
    </MainLayout>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
