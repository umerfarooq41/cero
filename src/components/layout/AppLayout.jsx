import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="app-page-surface flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="app-page-surface flex-1 overflow-y-auto pb-28 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}