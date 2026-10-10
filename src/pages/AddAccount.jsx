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
  { value: 'checking', label: 'Checking', category: 'asset' },
  { value: 'savings', label: 'Savings', category: 'asset' },
  { value: 'cash', label: 'Cash', category: 'asset' },
  { value: 'investment', label: 'Investment', category: 'asset' },
  { value: 'credit_card', label: 'Credit Card', category: 'liability' },
  { value: 'loan', label: 'Loan', category: 'liability' },
  { value: 'other', label: 'Other', category: null },
];

function getAccountCategory(type, otherCategory = 'asset') {
  return accountTypes.find((item) => item.value === type)?.category || otherCategory;
}

const colors = [
  '#276FE4',
  '#16AAFE',
  '#5FCEF3',
  '#18D1C8',
  '#1B8989',
  '#2898BB',
  '#8CBC95',
  '#9CB3C7',
  '#6F979F',
  '#54887C',
  '#72AA00',
  '#38C17D',
  '#3BA40E',
  '#634E4A',
  '#A85539',
  '#A58F85',
  '#EEB82D',
  '#FFB800',
  '#FF8B00',
  '#FF6D10',
  '#F84C00',
  '#FB2C2C',
  '#E40335',
  '#B1003B',
  '#E98ABE',
  '#F39AB5',
  '#FA5C8C',
  '#E33BA3',
  '#B393EA',
  '#8C7EF0',
  '#6970ED',
  '#8845F5',
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
  const [otherCategory, setOtherCategory] = useState('asset');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existingAccount) return;

    setName(existingAccount.name || '');
    setType(existingAccount.type || '');
    setOtherCategory(existingAccount.category || 'asset');
    setBalance(String(existingAccount.balance ?? ''));
    setColor(existingAccount.color || colors[0]);
  }, [existingAccount]);

  const handleSave = async () => {
    if (!name.trim() || !type) {
      toast.error('Name and type are required');
      return;
    }

    const nextCategory = getAccountCategory(type, otherCategory);
    const existingCategory = existingAccount?.category || null;

    if (isEditing && existingCategory && nextCategory !== existingCategory) {
      toast.error('An existing account cannot switch between asset and liability');
      return;
    }

    const numericBalance = Number(balance || 0);
    if (!Number.isFinite(numericBalance)) {
      toast.error('Enter a valid balance');
      return;
    }

    if (nextCategory === 'liability' && numericBalance < 0) {
      toast.error('Enter the amount owed as a positive balance');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        type,
        category: nextCategory,
        balance: numericBalance,
        color,
      };

      if (isEditing) {
        const balanceChanged =
          Math.round(numericBalance * 100) !==
          Math.round(Number(existingAccount?.balance || 0) * 100);

        if (balanceChanged) {
          // Compatibility path until an audited balance-adjustment RPC is deployed.
          // Never silently discard a requested balance change.
          await accountsApi.update(id, payload);
        } else {
          // Metadata-only edits must never write the balance column.
          await accountsApi.updateDetails(id, payload);
        }
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


          {type === 'other' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Category
              </label>

              <Select value={otherCategory} onValueChange={setOtherCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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

            <div className="grid grid-cols-8 gap-2 py-1">
              {colors.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setColor(item)}
                  className={cn(
                    'app-color-swatch',
                    color === item ? 'is-selected' : ''
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