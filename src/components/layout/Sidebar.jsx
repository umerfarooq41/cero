import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ArrowLeftRight, Wallet, PieChart, 
  Settings, FolderOpen, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Plan' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/accounts', icon: Wallet, label: 'Accounts' },
  { path: '/categories', icon: FolderOpen, label: 'Categories' },
  { path: '/reflect', icon: PieChart, label: 'Reflect' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Overlay (mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-out",
        "lg:translate-x-0 lg:static lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <div className="flex items-center gap-3">
            
            {/* ✅ LOGO (fixed) */}
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-border">
              <img
                src="/icon-192.png"
                alt="Cero"
                className="w-full h-full object-contain p-1"
              />
            </div>

            {/* App name */}
            <span className="font-semibold text-lg tracking-tight leading-none">
              Cero
            </span>
          </div>

          {/* Close button (mobile) */}
          <button 
            onClick={onClose} 
            className="lg:hidden p-1 rounded-md hover:bg-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            Zero-Based Budgeting
          </div>
        </div>

      </aside>
    </>
  );
}