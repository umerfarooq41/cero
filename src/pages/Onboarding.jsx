import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Wallet,
  FolderOpen,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

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
import { accountsApi, categoriesApi, saveUserSettings } from '@/lib/budgetData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const steps = [
  {
    title: 'Welcome to Cero',
    subtitle: 'Plan-first, zero-based budgeting',
    icon: Sparkles,
  },
  {
    title: 'Regional Setup',
    subtitle: 'Set your currency and format',
    icon: Wallet,
  },
  {
    title: 'Your First Account',
    subtitle: 'Add your main bank or cash account',
    icon: Wallet,
  },
  {
    title: 'Quick Categories',
    subtitle: "We'll set up the basics",
    icon: FolderOpen,
  },
];

const currencyOptions = [
  { value: 'SAR', label: 'SAR — Saudi Riyal', symbol: 'SAR' },
  { value: 'USD', label: '$ — US Dollar', symbol: '$' },
  { value: 'EUR', label: '€ — Euro', symbol: '€' },
  { value: 'GBP', label: '£ — British Pound', symbol: '£' },
  { value: 'PKR', label: '₨ — Pakistani Rupee', symbol: '₨' },
];

const defaultCategories = [
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#107C10' },
  { name: 'Freelance', type: 'income', icon: 'dollar', color: '#008272' },

  { name: 'Housing', type: 'expense', icon: 'home', color: '#0078D4' },
  { name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#CA5010' },
  { name: 'Transportation', type: 'expense', icon: 'car', color: '#4F6BED' },
  { name: 'Utilities', type: 'expense', icon: 'electric', color: '#FFB900' },
  { name: 'Shopping', type: 'expense', icon: 'shopping', color: '#E3008C' },
  { name: 'Health', type: 'expense', icon: 'health', color: '#C50F1F' },
  { name: 'Entertainment', type: 'expense', icon: 'gaming', color: '#8764B8' },

  { name: 'Emergency Fund', type: 'savings', icon: 'piggy', color: '#107C10' },
  { name: 'Investments', type: 'savings', icon: 'trending', color: '#0078D4' },

  { name: 'Credit Card', type: 'debt', icon: 'credit', color: '#C50F1F' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState('SAR');
  const [accountName, setAccountName] = useState('Main Account');
  const [accountBalance, setAccountBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const StepIcon = steps[step].icon;

  const selectedCurrency =
    currencyOptions.find((item) => item.value === currency) || currencyOptions[0];

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const goNext = () => {
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    handleFinish();
  };

  const handleFinish = async () => {
    const cleanAccountName = accountName.trim();

    if (!cleanAccountName) {
      toast.error('Please enter an account name');
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      const [existingAccounts, existingCategories] = await Promise.all([
        accountsApi.list(),
        categoriesApi.list(),
      ]);

      const accountAlreadyExists = existingAccounts.some(
        (account) =>
          account.name?.trim().toLowerCase() === cleanAccountName.toLowerCase()
      );

      if (!accountAlreadyExists) {
        await accountsApi.create({
          name: cleanAccountName,
          type: 'checking',
          category: 'asset',
          balance: Number.parseFloat(accountBalance) || 0,
          color: '#0078D4',
        });
      }

      const categoriesToCreate = defaultCategories.filter(
        (starterCategory) =>
          !existingCategories.some(
            (category) =>
              category.name?.trim().toLowerCase() ===
                starterCategory.name.toLowerCase() &&
              category.type === starterCategory.type
          )
      );

      if (categoriesToCreate.length > 0) {
        await categoriesApi.bulkCreate(categoriesToCreate);
      }

      await saveUserSettings({
        onboarding_complete: true,
        currency,
        theme: 'system',
        number_format: 'comma',
        date_format: 'MM/DD/YYYY',
      });

      await queryClient.invalidateQueries();

      toast.success('Welcome to Cero!');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Onboarding failed:', error);
      toast.error(error?.message || 'Could not finish setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="mb-10 flex gap-1.5">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-500',
                index <= step ? 'bg-primary shadow-sm' : 'bg-secondary/70'
              )}
            />
          ))}
        </div>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-sm ring-1 ring-primary/10">
            <StepIcon className="h-7 w-7 text-primary" />
          </div>

          <h1 className="mb-2 text-2xl font-bold tracking-tight">
            {steps[step].title}
          </h1>

          <p className="text-sm text-muted-foreground">
            {steps[step].subtitle}
          </p>
        </div>

        {/* Card */}
        <div className="surface-card card-elevated mb-8 min-h-[260px] rounded-2xl border border-border/60 p-6">
          {step === 0 && (
            <div className="space-y-4 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Cero uses zero-based budgeting — every unit of income gets a job
                before you spend it. Plan your income, assign it to categories,
                and track every transaction with clarity.
              </p>

              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-sm font-medium text-primary">
                  Goal: Left to Allocate = {selectedCurrency.symbol} 0.00
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Currency
                </label>

                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>

                  <SelectContent>
                    {currencyOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/40 p-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  This currency will be used across Plan, Transactions, Accounts,
                  Reflect, and Settings.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Account Name
                </label>

                <Input
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  placeholder="Main Account"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Current Balance
                </label>

                <Input
                  type="number"
                  value={accountBalance}
                  onChange={(event) => setAccountBalance(event.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  inputMode="decimal"
                />
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/40 p-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  You can add more accounts later from the Accounts page.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Starter categories will be added so you can begin planning
                  immediately. You can edit, delete, or add more categories later.
                </p>
              </div>

              <div className="grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                {defaultCategories.map((category) => (
                  <div
                    key={`${category.type}-${category.name}`}
                    className="flex items-center gap-2 rounded-lg bg-secondary/50 px-2 py-1.5"
                  >
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />

                    <span className="truncate text-xs">
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={goNext}
            disabled={loading}
            className="h-12 w-full gap-2 text-sm font-semibold"
          >
            {loading
              ? 'Setting up...'
              : step < steps.length - 1
                ? 'Continue'
                : 'Get Started'}

            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>

          {step > 0 && !loading && (
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              className="h-10 w-full text-xs text-muted-foreground"
            >
              Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}