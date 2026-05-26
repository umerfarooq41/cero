import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ScrollManager from './ScrollManager';

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="app-page-surface flex h-[100dvh] min-h-[100dvh] overflow-hidden">
      <ScrollManager />

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="app-page-surface app-main-scroll flex-1 overflow-y-auto lg:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, filter: 'blur(3px)' }}
              transition={{
                duration: 0.2,
                ease: 'easeOut',
              }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}