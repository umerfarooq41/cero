import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-28 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
