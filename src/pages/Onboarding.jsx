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
import Logo from '@/components/Logo';

const zeroBasedExplanation =
  'Zero-based budgeting means every unit of income is assigned to spending, saving, debt, or future plans before the month begins.';

const steps = [
  {
    title: 'Welcome to Cero',
    subtitle: 'Build a monthly plan where every penny you earn has a purpose.',
    helper: zeroBasedExplanation,
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

function DesktopStepItem({ item, index, active, complete }) {
  const Icon = item.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-2xl border p-2.5 transition-all duration-300',
        active
          ? 'border-primary/20 bg-primary/10 text-foreground shadow-sm'
          : complete
            ? 'border-primary/10 bg-primary/5 text-foreground/90'
            : 'border-border/35 bg-background/20 text-muted-foreground'
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black tabular-nums',
          active
            ? 'bg-primary text-primary-foreground'
            : complete
              ? 'bg-primary/15 text-primary'
              : 'bg-secondary/65 text-muted-foreground'
        )}
      >
        {complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', active || complete ? 'text-primary' : 'text-muted-foreground')} />
          <p className="truncate text-xs font-black xl:text-sm">{item.title}</p>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[11px] font-medium leading-4 text-muted-foreground xl:line-clamp-2 xl:text-xs xl:leading-5">
          {item.subtitle}
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ step }) {
  return (
    <div className="overflow-hidden rounded-2xl app-card-surface p-3 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
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

      <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span>
          Step {step + 1} of {steps.length}
        </span>
        <span>{steps[step].title}</span>
      </div>
    </div>
  );
}

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

  const renderStepContent = ({ desktop = false } = {}) => (
    <>
      {step === 0 && (
        <div className={cn('space-y-4 text-center', desktop && 'space-y-3 text-left')}>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cero helps you plan your month before spending starts, then keeps
            your accounts, transactions, and budget progress connected.
          </p>

          <div className={cn('rounded-2xl border border-primary/10 bg-primary/5 p-4', desktop && 'p-3')}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Zero-based budgeting
            </div>

            <p className="mt-1 text-sm font-semibold text-primary">
              Every penny gets a job.
            </p>

            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {zeroBasedExplanation}
            </p>
          </div>

          <div className={cn('rounded-2xl app-card-surface-soft p-4 text-left backdrop-blur-xl', desktop && 'p-3')}>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

              <p className="text-xs leading-relaxed text-muted-foreground">
                You can change your currency, accounts, and categories later
                from Settings and Manage Plan.
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className={cn('space-y-4', desktop && 'space-y-3')}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Currency
            </label>

            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className={cn('h-11 rounded-xl', desktop && 'h-10')}>
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

          <div className={cn('rounded-2xl app-card-surface-soft p-4 backdrop-blur-xl', desktop && 'p-3')}>
            <div className="flex items-start gap-3">
              <Coins className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

              <p className="text-xs leading-relaxed text-muted-foreground">
                This currency will be used across Plan, Transactions, Accounts,
                Reflect, and Settings.
              </p>
            </div>
          </div>

          <div className={cn('rounded-2xl border border-primary/10 bg-primary/5 p-4', desktop && 'p-3')}>
            <p className="text-xs font-medium text-primary">
              Selected: <CurrencyLabel option={selectedCurrency} />
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={cn('space-y-4', desktop && 'space-y-3')}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Account Name
            </label>

            <Input
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Main Account"
              className={cn('h-11 rounded-xl', desktop && 'h-10')}
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
              className={cn('h-11 rounded-xl', desktop && 'h-10')}
            />
          </div>

          <div className={cn('rounded-2xl app-card-surface-soft p-4 backdrop-blur-xl', desktop && 'p-3')}>
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
        <div className={cn('space-y-4', desktop && 'space-y-3')}>
          <div className={cn('flex items-center justify-between gap-4 rounded-2xl app-card-surface-soft p-4 backdrop-blur-xl', desktop && 'p-3')}>
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
              <div className={cn('flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4', desktop && 'p-3')}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Cero will add a small starter set. You can edit, delete, or
                  add more categories later.
                </p>
              </div>

              <div
                className={cn(
                  'grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto pr-1',
                  desktop && 'lg:max-h-32 xl:max-h-40'
                )}
              >
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
            <div className={cn('rounded-2xl app-card-surface-soft p-5 text-center backdrop-blur-xl', desktop && 'p-4')}>
              <FolderOpen className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />

              <p className="text-sm font-medium">
                Starter categories skipped
              </p>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                You can create your own categories later from Manage Plan.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );

  const actions = ({ wrapped = true } = {}) => (
    <div className={cn(wrapped && 'overflow-hidden rounded-2xl app-card-surface p-3')}>
      <Button
        onClick={goNext}
        disabled={loading}
        className="h-11 w-full gap-2 rounded-xl text-sm font-semibold lg:h-10 xl:h-11"
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
          className="mt-1.5 h-9 w-full rounded-xl text-xs text-muted-foreground"
        >
          Back
        </Button>
      )}
    </div>
  );

  return (
    <div ref={scope} className="app-page-surface min-h-screen bg-transparent px-4 py-6 sm:py-8 lg:flex lg:h-[100dvh] lg:min-h-0 lg:items-center lg:justify-center lg:overflow-hidden lg:px-6 lg:py-4">
      <main className="mx-auto min-h-[calc(100vh-3rem)] w-full max-w-md lg:flex lg:h-full lg:min-h-0 lg:max-h-[calc(100dvh-2rem)] lg:max-w-6xl lg:items-center">
        <section className="w-full lg:hidden">
          <div className="animate-child mb-5">
            <ProgressBar step={step} />
          </div>

          <div className="animate-child mb-5 overflow-hidden rounded-2xl app-card-surface p-6 text-center shadow-sm backdrop-blur-xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 shadow-sm ring-1 ring-primary/10">
              {step === 0 ? (
                <Logo size={52} priority />
              ) : (
                <StepIcon className="h-7 w-7 text-primary" />
              )}
            </div>

            <h1 className="mb-2 text-2xl font-bold tracking-tight">
              {steps[step].title}
            </h1>

            <div className="space-y-1">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {steps[step].subtitle}
              </p>

              {steps[step].helper && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {steps[step].helper}
                </p>
              )}
            </div>
          </div>

          <div className="animate-child mb-5 min-h-[292px] overflow-hidden rounded-2xl app-card-surface p-6 shadow-sm backdrop-blur-xl">
            {renderStepContent()}
          </div>

          <div className="animate-child">
            {actions()}
          </div>
        </section>

        <section className="animate-child hidden h-full min-h-0 w-full overflow-hidden rounded-[2rem] app-card-surface-strong shadow-sm backdrop-blur-xl lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(390px,1.08fr)]">
          <div className="flex min-h-0 flex-col justify-between p-5 xl:p-7">
            <div>
              <div className="flex items-center gap-3">
                <Logo size={46} priority />
                <div>
                  <p className="text-2xl font-black leading-none tracking-tight text-foreground">Cero</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground/72">
                    Zero-based budgeting
                  </p>
                </div>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/45 bg-background/30 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground shadow-sm xl:mt-7">
                <Sparkles className="h-3.5 w-3.5" />
                First setup
              </div>

              <h1 className="mt-4 max-w-xl text-4xl font-black leading-[0.96] tracking-[-0.055em] text-foreground xl:text-5xl">
                Set up your budget foundation.
              </h1>

              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-muted-foreground xl:mt-4 xl:text-base xl:leading-7">
                Zero-based budgeting gives every penny a purpose before the month begins. Choose your currency, add your main account, and start with clean categories.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 xl:mt-5">
                {['Currency', 'Account', 'Categories'].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/25 px-3 py-2 text-xs font-bold text-muted-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-2.5 xl:mt-6 xl:space-y-3">
              {steps.map((item, index) => (
                <DesktopStepItem
                  key={item.title}
                  item={item}
                  index={index}
                  active={index === step}
                  complete={index < step}
                />
              ))}
            </div>
          </div>

          <div className="min-h-0 border-l border-border/35 bg-background/15 p-4 xl:p-5">
            <div className="flex h-full min-h-0 flex-col">
              <ProgressBar step={step} />

              <div className="mt-3 flex items-start gap-3 xl:mt-4 xl:gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 shadow-sm ring-1 ring-primary/10 xl:h-16 xl:w-16">
                  {step === 0 ? (
                    <Logo size={52} priority />
                  ) : (
                    <StepIcon className="h-7 w-7 text-primary" />
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <h2 className="text-xl font-black tracking-tight text-foreground xl:text-2xl">
                    {steps[step].title}
                  </h2>

                  <p className="mt-0.5 text-xs font-medium leading-5 text-muted-foreground xl:text-sm xl:leading-6">
                    {steps[step].subtitle}
                  </p>

                  {steps[step].helper && (
                    <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-5 text-muted-foreground xl:text-sm xl:leading-6">
                      {steps[step].helper}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-[1.75rem] border border-border/35 bg-background/20 p-4 shadow-sm xl:mt-4 xl:p-5">
                {renderStepContent({ desktop: true })}
              </div>

              <div className="mt-3 xl:mt-4">
                {actions({ wrapped: false })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
