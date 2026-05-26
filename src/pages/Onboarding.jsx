import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Wallet,
  FolderOpen,
  Sparkles,
  CheckCircle2,
  Coins,
  Landmark,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useQueryClient } from '@tanstack/react-query';
import { accountsApi, categoriesApi, saveUserSettings } from '@/lib/budgetData';
import { currencies, getCurrencyByCode } from '@/lib/currencies';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePageEntrance } from '@/hooks/usePageTransition';

const steps = [
  {
    title: 'Welcome to Cero',
    subtitle: 'Plan-first, zero-based budgeting',
    icon: Sparkles,
  },
  {
    title: 'Currency Setup',
    subtitle: 'Choose how your money is displayed',
    icon: Coins,
  },
  {
    title: 'Your First Account',
    subtitle: 'Add your main bank or cash account',
    icon: Landmark,
  },
  {
    title: 'Starter Categories',
    subtitle: 'Begin with a clean category setup',
    icon: FolderOpen,
  },
];

const defaultCategories = [
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#107C10' },
  { name: 'Other Income', type: 'income', icon: 'dollar', color: '#008272' },

  { name: 'Housing', type: 'expense', icon: 'home', color: '#0078D4' },
  { name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#CA5010' },
  { name: 'Transportation', type: 'expense', icon: 'car', color: '#4F6BED' },
  { name: 'Utilities', type: 'expense', icon: 'electric', color: '#FFB900' },
  { name: 'Shopping', type: 'expense', icon: 'shopping', color: '#E3008C' },
  { name: 'Health', type: 'expense', icon: 'health', color: '#C50F1F' },

  { name: 'Emergency Fund', type: 'savings', icon: 'piggy', color: '#107C10' },

  { name: 'Credit Card', type: 'debt', icon: 'credit', color: '#C50F1F' },
];

const categoryTypeLabel = {
  income: 'Income',
  expense: 'Expense',
  savings: 'Savings',
  debt: 'Debt',
};

const SarIcon = () => (
  <img
    src="/sar.svg"
    alt="SAR"
    className="inline-block h-4 w-4 dark:invert"
  />
);

const CurrencyLabel = ({ option, compact = false }) => {
  if (option.code === 'SAR') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <SarIcon />
        {compact ? option.shortDisplay : option.display}
      </span>
    );
  }

  return compact ? option.shortDisplay : option.display;
};

export default function Onboarding() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState('SAR');
  const [accountName, setAccountName] = useState('Main Account');
  const [accountBalance, setAccountBalance] = useState('');
  const [createStarterCategories, setCreateStarterCategories] = useState(true);
  const [loading, setLoading] = useState(false);

  const StepIcon = steps[step].icon;
  const selectedCurrency = getCurrencyByCode(currency);

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
      const [existingAccountsRaw, existingCategoriesRaw] = await Promise.all([
        accountsApi.list(),
        categoriesApi.list(),
      ]);

      const existingAccounts = Array.isArray(existingAccountsRaw)
        ? existingAccountsRaw
        : [];

      const existingCategories = Array.isArray(existingCategoriesRaw)
        ? existingCategoriesRaw
        : [];

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

      if (createStarterCategories) {
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
      }

      await saveUserSettings({
        onboarding_complete: true,
        currency,
        currency_placement: 'before',
        theme: 'system',
        number_format: 'comma',
        date_format: 'MM/DD/YYYY',
        shift25th: false,
        auto_sweep: false,
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
    <div ref={scope} className="min-h-screen bg-transparent px-4 py-8">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        {/* Progress */}
        <div className="animate-child mb-5 overflow-hidden rounded-2xl app-card-surface p-3">
          <div className="flex gap-1.5">
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

          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>
              Step {step + 1} of {steps.length}
            </span>
            <span>{steps[step].title}</span>
          </div>
        </div>

        {/* Header */}
        <div className="animate-child mb-5 overflow-hidden rounded-2xl app-card-surface p-6 text-center shadow-sm backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 shadow-sm ring-1 ring-primary/10">
            {step === 0 ? (
              <>
                <img
                  src="/icon-light.png"
                  alt="Cero"
                  className="block h-12 w-12 object-contain dark:hidden"
                />
                <img
                  src="/icon-dark.png"
                  alt="Cero"
                  className="hidden h-12 w-12 object-contain dark:block"
                />
              </>
            ) : (
              <StepIcon className="h-7 w-7 text-primary" />
            )}
          </div>

          <h1 className="mb-2 text-2xl font-bold tracking-tight">
            {steps[step].title}
          </h1>

          <p className="text-sm text-muted-foreground">
            {steps[step].subtitle}
          </p>
        </div>

        {/* Main Card */}
        <div className="animate-child mb-5 min-h-[292px] overflow-hidden rounded-2xl app-card-surface p-6 shadow-sm backdrop-blur-xl">
          {step === 0 && (
            <div className="space-y-4 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Start with a clear monthly plan. Add your income, assign it to
                what matters, and track every transaction as the month unfolds.
              </p>

              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Planning goal
                </div>

                <p className="mt-1 text-sm font-semibold text-primary">
                  Plan first. Spend second.
                </p>
              </div>

              <div className="rounded-2xl app-card-surface-soft p-4 text-left backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    You can change your currency, accounts, and categories
                    anytime.
                  </p>
                </div>
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
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>

                  <SelectContent>
                    {currencies.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        <CurrencyLabel option={item} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl app-card-surface-soft p-4 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <Coins className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    This currency will be used across Plan, Transactions,
                    Accounts, Reflect, and Settings.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-xs font-medium text-primary">
                  Selected: <CurrencyLabel option={selectedCurrency} />
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
                  className="h-11 rounded-xl"
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
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="rounded-2xl app-card-surface-soft p-4 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Add your main account now. You can add more cash, bank, or
                    liability accounts later.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-2xl app-card-surface-soft p-4 backdrop-blur-xl">
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    Create starter categories
                  </div>

                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Recommended for a faster first setup.
                  </p>
                </div>

                <Switch
                  checked={createStarterCategories}
                  onCheckedChange={setCreateStarterCategories}
                />
              </div>

              {createStarterCategories ? (
                <>
                  <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Cero will add a small starter set. You can edit, delete,
                      or add more categories later.
                    </p>
                  </div>

                  <div className="grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                    {defaultCategories.map((category) => (
                      <div
                        key={`${category.type}-${category.name}`}
                        className="flex min-w-0 items-center gap-2 rounded-lg bg-secondary/50 px-2 py-1.5"
                      >
                        <div
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />

                        <div className="min-w-0">
                          <div className="truncate text-xs font-medium">
                            {category.name}
                          </div>

                          <div className="truncate text-[10px] text-muted-foreground">
                            {categoryTypeLabel[category.type]}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl app-card-surface-soft p-5 text-center backdrop-blur-xl">
                  <FolderOpen className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />

                  <p className="text-sm font-medium">
                    Starter categories skipped
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    You can create your own categories later from the Categories
                    page.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="animate-child overflow-hidden rounded-2xl app-card-surface p-3">
          <Button
            onClick={goNext}
            disabled={loading}
            className="h-12 w-full gap-2 rounded-xl text-sm font-semibold"
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
              className="mt-2 h-10 w-full rounded-xl text-xs text-muted-foreground"
            >
              Back
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
