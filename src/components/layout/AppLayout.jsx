import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="app-page-surface flex h-[100dvh] min-h-[100svh] overflow-hidden">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex-1 overflow-y-auto pb-[var(--app-bottom-nav-height)] lg:pb-0">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
