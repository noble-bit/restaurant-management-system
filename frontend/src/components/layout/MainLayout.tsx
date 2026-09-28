import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface MainLayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onChangePasswordClick: () => void;
  onProfileClick: () => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentTab,
  setCurrentTab,
  onChangePasswordClick,
  onProfileClick,
  children,
}) => {
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f3f7f6] text-slate-800 font-sans antialiased selection:bg-red-500 selection:text-white">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onChangePasswordClick={onChangePasswordClick}
          onProfileClick={onProfileClick}
          onNavigateTab={setCurrentTab}
          onOpenMobileSidebar={() => setIsOpenMobileSidebar(true)}
        />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
