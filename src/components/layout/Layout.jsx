import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import OnboardingModal from '../onboarding/OnboardingModal';
import TopProgressBar from '../common/TopProgressBar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <TopProgressBar />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <OnboardingModal />
    </div>
  );
};

export default Layout;

