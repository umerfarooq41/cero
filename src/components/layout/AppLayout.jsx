import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ScrollManager from './ScrollManager';

const pageTransition = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1],
};

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="app-page-surface flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden">
      <ScrollManager />

      <Sidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="app-page-surface app-main-scroll flex-1 overflow-y-auto lg:pb-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={pageTransition}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
