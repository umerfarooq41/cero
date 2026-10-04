import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
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
import { usePageEntrance } from '@/hooks/usePageTransition';

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

export default function AddAccount() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditing = Boolean(id);

  const queryClient = useQueryClient();
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

      toast.success(isEditing ? 'Account updated' : 'Account created');

      navigate(isEditing ? `/accounts/${id}` : '/accounts');
    } catch (error) {
      console.error('Account save failed:', error);
      toast.error(error.message || 'Could not save account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        title={isEditing ? 'Edit Account' : 'Add Account'}
        subtitle={
          isEditing
            ? 'Update account details and balance'
            : 'Create a wallet, bank, savings, debt, or investment account'
        }
        action={
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="
              group
              relative
              flex
              h-9
              w-9
              shrink-0
              touch-manipulation
              items-center
              justify-center
              rounded-full
              text-muted-foreground/80
              transition-colors
              duration-200
              hover:text-foreground
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-ring
              focus-visible:ring-offset-2
            "
          >
            <ArrowLeft className="h-[1.15rem] w-[1.15rem] stroke-[2.35]" />
          </button>
        }
      />

      <main className="mx-auto w-full max-w-3xl px-4 py-3 pb-24 lg:py-8">
        <div className="animate-child space-y-4 rounded-2xl app-card-surface p-4 sm:p-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Account Name
            </label>

            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Checking"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Type
            </label>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>

              <SelectContent>
                {accountTypes.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Category
            </label>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {isEditing ? 'Current Balance' : 'Starting Balance'}
            </label>

            <Input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Color
            </label>

            <div className="grid grid-cols-8 gap-2 rounded-xl border border-border/60 app-card-surface-soft p-3 backdrop-blur-xl">
              {colors.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setColor(item)}
                  className={cn(
                    'app-color-swatch',
                    color === item
                      ? 'scale-110 ring-2 ring-primary ring-offset-2'
                      : 'hover:scale-105'
                  )}
                  style={{
                    backgroundColor: item,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="animate-child mt-5 h-12 w-full rounded-xl text-sm font-semibold"
        >
          {saving
            ? 'Saving...'
            : isEditing
              ? 'Save Changes'
              : 'Create Account'}
        </Button>
      </main>
    </div>
  );
}