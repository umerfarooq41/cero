import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center px-4 border-b border-border bg-card/80 backdrop-blur-xl lg:hidden shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-accent"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}