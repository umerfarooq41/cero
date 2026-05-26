/**
 * CommandPalette — Cmd+K quick navigation
 *
 * Wire into App.jsx:
 *   import CommandPalette from '@/components/shared/CommandPalette';
 *   // inside the router:
 *   <CommandPalette />
 *
 * Uses shadcn's existing command.jsx component.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  CalendarCheck,
  LayoutDashboard,
  Receipt,
  WalletCards,
  ChartPie,
  Settings,
  Plus,
  SlidersHorizontal,
  PencilLine,
} from 'lucide-react';
import { format } from 'date-fns';

const COMMANDS = [
  {
    group: 'Navigate',
    items: [
      { label: 'Dashboard',      icon: LayoutDashboard, to: '/' },
      { label: 'Plan',           icon: CalendarCheck,  to: '/plan' },
      { label: 'Transactions',   icon: Receipt,        to: '/transactions' },
      { label: 'Accounts',       icon: WalletCards,    to: '/accounts' },
      { label: 'Reflect',        icon: ChartPie,       to: '/?tab=reflect' },
      { label: 'Settings',       icon: Settings,       to: '/settings' },
      { label: 'Manage Plan',    icon: SlidersHorizontal, to: '/manage-plan' },
    ],
  },
  {
    group: 'Actions',
    items: [
      { label: 'Add Transaction', icon: Plus,          to: '/add-transaction' },
      { label: 'Add Account',     icon: Plus,          to: '/add-account' },
      {
        label: 'Edit This Month\'s Plan',
        icon: PencilLine,
        to: `/manage-plan?tab=monthly-plan&month=${format(new Date(), 'yyyy-MM')}`, 
      },
    ],
  },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpen = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const run = (to) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl app-card-surface-strong backdrop-blur-2xl max-w-md">
        <Command className="bg-transparent">
          <CommandInput placeholder="Type a command or search…" className="h-12 text-sm" />
          <CommandList className="max-h-80">
            <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </CommandEmpty>

            {COMMANDS.map((group, gi) => (
              <React.Fragment key={group.group}>
                {gi > 0 && <CommandSeparator />}
                <CommandGroup heading={group.group}>
                  {group.items.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <CommandItem
                        key={cmd.label}
                        onSelect={() => run(cmd.to)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="text-sm">{cmd.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>

          <div className="border-t border-border/50 px-3 py-2">
            <p className="text-[10px] text-muted-foreground text-center">
              <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
              {' '}to open · {' '}
              <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
              {' '}to navigate · {' '}
              <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
              {' '}to select
            </p>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
