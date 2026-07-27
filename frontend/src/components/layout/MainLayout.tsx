import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface MainLayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onChangePasswordClick: () => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentTab,
  setCurrentTab,
  onChangePasswordClick,
  children,
}) => {
  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-gray-100 antialiased selection:bg-indigo-500 selection:text-white">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onChangePasswordClick={onChangePasswordClick} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
