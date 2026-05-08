import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Landmark, WalletCards } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useQueryClient } from '@tanstack/react-query';

import { accountsApi } from '@/lib/budgetData';
import { useAccounts } from '@/hooks/useBudgetData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { GlassCard, PageHeader, TonePill } from '@/components/shared/Premium';

const accountTypes = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'investment', label: 'Investment' },
  { value: 'loan', label: 'Loan' },
  { value: 'other', label: 'Other' },
];

const colors = [
  '#0078D4',
  '#107C10',
  '#C50F1F',
  '#8764B8',
  '#CA5010',
  '#008272',
  '#4F6BED',
  '#69797E',
  '#D83B01',
  '#E3008C',
  '#00B294',
  '#FFB900',
  '#744DA9',
  '#038387',
  '#0099BC',
  '#E83E8C',
  '#00B7C3',
  '#5C2D91',
  '#498205',
  '#A80000',
  '#2D7D9A',
  '#6B7280',
  '#111827',
  '#16A34A',
  '#EA580C',
  '#9333EA',
  '#DB2777',
  '#0891B2',
  '#65A30D',
  '#F59E0B',
];

function CurrencyPrefix({ currency }) {
  if (currency === 'SAR') {
    return <img src="/sar.svg" alt="SAR" className="h-4 w-4 opacity-70 dark:invert" />;
  }

  return <span className="text-xs font-semibold text-muted-foreground">{currency}</span>;
}

export default function AddAccount() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditing = Boolean(id);

  const queryClient = useQueryClient();
  const currency = useCurrency();

  const { data: accounts = [] } = useAccounts();

  const existingAccount = accounts.find((a) => a.id === id);

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('asset');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existingAccount) return;

    setName(existingAccount.name || '');
    setType(existingAccount.type || '');
    setCategory(existingAccount.category || 'asset');
    setBalance(String(existingAccount.balance ?? ''));
    setColor(existingAccount.color || colors[0]);
  }, [existingAccount]);

  const handleSave = async () => {
    if (!name.trim() || !type) {
      toast.error('Name and type are required');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        type,
        category,
        balance: parseFloat(balance) || 0,
        color,
      };

      if (isEditing) {
        await accountsApi.update(id, payload);
      } else {
        await accountsApi.create(payload);
      }

      queryClient.invalidateQueries({
        queryKey: ['accounts'],
      });

      toast.success(
        isEditing
          ? 'Account updated'
          : 'Account created'
      );

      navigate(
        isEditing
          ? `/accounts/${id}`
          : '/accounts'
      );
    } catch (error) {
      console.error('Account save failed:', error);

      toast.error(
        error.message || 'Could not save account'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-4 pb-nav sm:px-6 sm:pt-5 lg:pt-6">
      <PageHeader
        title={isEditing ? 'Edit Account' : 'Add Account'}
        description="Create the accounts that power your net worth view."
        icon={WalletCards}
        actions={
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 rounded-2xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      <GlassCard tone={category === 'liability' ? 'debt' : 'income'} className="p-5">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${color || '#0078D4'}20` }}
          >
            <Landmark className="h-6 w-6" style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold">{name || 'New Account'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <TonePill tone={category === 'liability' ? 'debt' : 'income'}>
                {category === 'liability' ? 'Liability' : 'Asset'}
              </TonePill>
              {type && <TonePill>{type.replace('_', ' ')}</TonePill>}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="space-y-5 p-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Account Name
          </label>

          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Main Checking"
            className="h-11 rounded-2xl bg-secondary/60"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Type
          </label>

          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-11 rounded-2xl bg-secondary/60">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>

            <SelectContent>
              {accountTypes.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Category
          </label>

          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
            {[
              ['asset', 'Asset'],
              ['liability', 'Liability'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={cn(
                  'rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all',
                  category === value
                    ? value === 'asset'
                      ? 'bg-emerald-500/12 text-emerald-700 shadow-sm dark:text-emerald-300'
                      : 'bg-red-500/12 text-red-700 shadow-sm dark:text-red-300'
                    : 'text-muted-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {isEditing
              ? 'Current Balance'
              : 'Starting Balance'}
          </label>

          <div className="relative">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <CurrencyPrefix currency={currency} />
            </div>
            <Input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="h-11 rounded-2xl bg-secondary/60 pl-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Color
          </label>

          <div className="grid grid-cols-8 gap-2 rounded-2xl border border-border/70 bg-secondary/40 p-3 sm:grid-cols-10">
            {colors.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setColor(item)}
                className={cn(
                  'w-8 h-8 rounded-xl border border-border transition-all',
                  color === item
                    ? 'ring-2 ring-offset-2 ring-primary scale-110'
                    : 'hover:scale-105'
                )}
                style={{
                  backgroundColor: item,
                }}
              />
            ))}
          </div>
        </div>
      </GlassCard>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="fixed bottom-24 left-0 right-0 z-40 mx-auto h-12 w-[calc(100%-2rem)] max-w-2xl rounded-full text-sm font-semibold shadow-md sm:bottom-28"
      >
        {saving
          ? 'Saving...'
          : isEditing
            ? 'Save Changes'
            : 'Create Account'}
      </Button>
    </div>
  );
}
