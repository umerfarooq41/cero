import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="app-canvas min-h-screen overflow-x-hidden">
      <main className="min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
