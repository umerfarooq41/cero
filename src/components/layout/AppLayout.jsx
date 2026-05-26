import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="app-page-surface flex h-[100dvh] min-h-[100dvh] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="app-page-surface app-main-scroll flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}