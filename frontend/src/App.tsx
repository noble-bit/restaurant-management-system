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

  // Safeguard: redirect if non-authorized role attempts staff tab
  if (currentTab === 'staff' && !isOwnerOrManager) {
    setCurrentTab('dashboard');
  }

  return (
    <MainLayout
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      onChangePasswordClick={() => setIsChangingPassword(true)}
    >
      {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
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
