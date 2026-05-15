import { useEffect, useState } from 'react';
import {
  Moon,
  Sun,
  Globe,
  Calculator,
  Download,
  Trash2,
  User,
  LogOut,
  FolderOpen,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  getUserSettings,
  saveUserSettings,
  exportFinancialReport,
  resetUserData,
} from '@/lib/budgetData';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import { useTheme } from '@/lib/ThemeProvider';

const SettingRow = ({
  icon: Icon,
  label,
  description,
  children,
  stackOnMobile = false,
}) => (
  <div
    className={
      stackOnMobile
        ? 'flex flex-col gap-3 px-1 py-3 sm:flex-row sm:items-center sm:gap-4'
        : 'flex items-center gap-4 px-1 py-3'
    }
  >
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{label}</div>
        {description && (
          <div className="mt-0.5 break-words text-xs text-muted-foreground">
            {description}
          </div>
        )}
      </div>
    </div>

    <div className="shrink-0 self-start sm:self-center">{children}</div>
  </div>
);

const SarIcon = () => (
  <img
    src="/sar.svg"
    alt="SAR"
    className="inline-block h-4 w-4 dark:invert"
  />
);

const getSavedTwentyFifthRule = (saved = {}, fallback = false) => {
  return (
    saved?.budgetLogic?.twentyFifthRule ??
    saved?.budget_logic?.twenty_fifth_rule ??
    saved?.twentyFifthRule ??
    saved?.shift25th ??
    fallback
  );
};

const getSavedAutoSweepSurplus = (saved = {}, fallback = false) => {
  return (
    saved?.budgetLogic?.autoSweepSurplus ??
    saved?.budget_logic?.auto_sweep_surplus ??
    saved?.autoSweepSurplus ??
    saved?.auto_sweep ??
    fallback
  );
};

export default function Settings() {
  const [settings, setSettings] = useState({
    theme: 'light',
    currency: 'SAR',
    budgetLogic: {
      twentyFifthRule: false,
      autoSweepSurplus: false,
    },
  });

  const [hydrated, setHydrated] = useState(false);

  const queryClient = useQueryClient();
  const { user, isAuthenticated, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [exporting, setExporting] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await getUserSettings();

        if (saved) {
          const loadedTheme = saved?.theme || theme || 'light';
          setTheme(loadedTheme);

          setSettings((prev) => ({
            ...prev,
            theme: loadedTheme,
            currency: saved.currency || 'SAR',
            budgetLogic: {
              ...prev.budgetLogic,
              twentyFifthRule: getSavedTwentyFifthRule(
                saved,
                prev.budgetLogic.twentyFifthRule
              ),
              autoSweepSurplus: getSavedAutoSweepSurplus(
                saved,
                prev.budgetLogic.autoSweepSurplus
              ),
            },
          }));

          setHydrated(true);
        }
      } catch (error) {
        console.error('Settings load failed:', error);
        toast.error('Could not load settings');
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async (newSettings) => {
    await saveUserSettings({
      currency: newSettings.currency,
      currency_placement: 'before',
      theme: newSettings.theme,
      shift25th: newSettings.budgetLogic.twentyFifthRule,
      auto_sweep: newSettings.budgetLogic.autoSweepSurplus,
    });

    queryClient.invalidateQueries();
  };

  const updateSetting = async (key, value) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };

    setSettings(newSettings);

    try {
      await saveSettings(newSettings);

      toast.success('Setting saved');
    } catch (error) {
      console.error('Settings save failed:', error);
      setSettings(settings);
      toast.error(error.message || 'Could not save setting');
    }
  };

  const updateBudgetLogicSetting = async (key, value) => {
    const newSettings = {
      ...settings,
      budgetLogic: {
        ...settings.budgetLogic,
        [key]: value,
      },
    };

    setSettings(newSettings);

    try {
      await saveSettings(newSettings);
      toast.success('Setting saved');
    } catch (error) {
      console.error('Budget logic save failed:', error);
      setSettings(settings);
      toast.error(error.message || 'Could not save budget logic setting');
    }
  };

  const handleExportReport = async () => {
    setExporting(true);

    try {
      const result = await exportFinancialReport();

      toast.success(`Report downloaded: ${result.filename}`);
      setShowExportDialog(false);
    } catch (error) {
      console.error('Report export failed:', error);
      toast.error(error.message || 'Could not export report');
    } finally {
      setExporting(false);
    }
  };

  const handleResetEverything = async () => {
    if (resetConfirmText !== 'RESET') {
      toast.error('Type RESET to confirm');
      return;
    }

    setResetting(true);

    try {
      await resetUserData();
      queryClient.clear();

      toast.success('All Cero data has been deleted');

      setShowResetDialog(false);
      setResetConfirmText('');

      window.location.href = '/';
    } catch (error) {
      console.error('Reset database failed:', error);
      toast.error(error.message || 'Could not reset database');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Settings"
        subtitle="Preferences, categories, and app settings"
      />

      <main className="mx-auto w-full max-w-4xl px-4 py-3 pb-24 lg:py-8">
        <div className="mb-4 overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Account
            </h3>
          </div>

          <div className="px-4">
            {isAuthenticated && user ? (
              <SettingRow
                icon={User}
                label={user.user_metadata?.full_name || user.email}
                description={user.email}
                stackOnMobile
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={async () => {
                    await signOut();
                    window.location.href = '/login';
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </SettingRow>
            ) : (
              <SettingRow
                icon={User}
                label="Not signed in"
                description="Sign in to sync your data"
              >
                <Button
                  size="sm"
                  onClick={() => {
                    window.location.href = '/login';
                  }}
                >
                  Sign in
                </Button>
              </SettingRow>
            )}
          </div>
        </div>

        <div className="mb-4 overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              App Management
            </h3>
          </div>

          <div className="px-4">
            <Link
              to="/categories"
              className="flex items-center justify-between rounded-lg px-1 py-3 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </div>

                <div>
                  <div className="text-sm font-medium">Categories</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Manage income, expense, savings, and debt categories
                  </div>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        <div className="mb-4 overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Appearance
            </h3>
          </div>

          <div className="divide-y divide-border/50 px-4">
            <SettingRow
              icon={theme === 'dark' ? Moon : Sun}
              label="Dark Mode"
              description="Switch between light and dark theme"
            >
              <Switch
              checked={theme === 'dark'}
              onCheckedChange={(v) => {
                const nextTheme = v ? 'dark' : 'light';
                setTheme(nextTheme);
                updateSetting('theme', nextTheme);
              }}
            />
            </SettingRow>
          </div>
        </div>

        <div className="mb-4 overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Regional
            </h3>
          </div>

          <div className="divide-y divide-border/50 px-4">
            <SettingRow
              icon={Globe}
              label="Currency"
              description="Select your currency symbol"
            >
              <Select
                value={settings.currency}
                onValueChange={(v) => updateSetting('currency', v)}
              >
                <SelectTrigger className="h-9 w-auto min-w-[92px] gap-2 rounded-xl px-3">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="SAR">
                    <span className="inline-flex items-center gap-1.5">
                      <SarIcon />
                      SAR
                    </span>
                  </SelectItem>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="EUR">€ EUR</SelectItem>
                  <SelectItem value="GBP">£ GBP</SelectItem>
                  <SelectItem value="JPY">¥ JPY</SelectItem>
                  <SelectItem value="CNY">¥ CNY</SelectItem>
                  <SelectItem value="INR">₹ INR</SelectItem>
                  <SelectItem value="PKR">Rs PKR</SelectItem>
                  <SelectItem value="AED">د.إ AED</SelectItem>
                  <SelectItem value="TRY">₺ TRY</SelectItem>
                  <SelectItem value="RUB">₽ RUB</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </div>
        </div>

        <div className="mb-4 overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Budget Logic
            </h3>
          </div>

          <div className="divide-y divide-border/50 px-4">
            <SettingRow
              icon={Calculator}
              label="25th Rule"
              description="Income on/after 25th moves to next month's pool"
            >
              <Switch
                checked={settings.budgetLogic.twentyFifthRule}
                onCheckedChange={(v) =>
                  updateBudgetLogicSetting('twentyFifthRule', v)
                }
              />
            </SettingRow>

            <SettingRow
              icon={Calculator}
              label="Auto-Sweep Surplus"
              description="Unspent balances become savings automatically"
            >
              <Switch
                checked={settings.budgetLogic.autoSweepSurplus}
                onCheckedChange={(v) =>
                  updateBudgetLogicSetting('autoSweepSurplus', v)
                }
              />
            </SettingRow>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data & Privacy
            </h3>
          </div>

          <div className="divide-y divide-border/50 px-4">
            <SettingRow
              icon={Download}
              label="Export Report"
              description="Download a polished HTML financial report"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
              >
                Export
              </Button>
            </SettingRow>

            <SettingRow
              icon={Trash2}
              label="Reset Everything"
              description="Permanently delete all Cero data from your account"
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowResetDialog(true)}
              >
                Reset
              </Button>
            </SettingRow>
          </div>
        </div>

        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Financial Report</DialogTitle>
              <DialogDescription>
                This will download a polished HTML report that opens in any
                browser and can be printed or saved as PDF. It includes net worth,
                accounts, monthly cash flow, category performance, and recent
                transactions.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-white/40 dark:border-white/[0.05] bg-white/35 dark:bg-white/[0.03] p-4 text-sm backdrop-blur-xl">
              <div className="font-semibold">Report includes</div>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                <li>Net worth and account balances</li>
                <li>Income, expenses, savings, and debt totals</li>
                <li>Monthly cash-flow summary</li>
                <li>Budget category performance</li>
                <li>Latest 250 transactions</li>
              </ul>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(false)}
                disabled={exporting}
              >
                Cancel
              </Button>
              <Button onClick={handleExportReport} disabled={exporting}>
                {exporting ? 'Preparing…' : 'Download Report'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showResetDialog}
          onOpenChange={(open) => {
            setShowResetDialog(open);
            if (!open) setResetConfirmText('');
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Everything?</DialogTitle>
              <DialogDescription>
                This will permanently delete your transactions, accounts,
                categories, budget plans, and app settings from Supabase. Your
                login account will remain active, but this Cero data cannot be
                restored.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
              <div className="font-semibold text-destructive">
                This action is permanent.
              </div>
              <p className="mt-1 text-muted-foreground">
                Type <span className="font-bold text-foreground">RESET</span>{' '}
                below to confirm deletion.
              </p>

              <input
                value={resetConfirmText}
                onChange={(event) => setResetConfirmText(event.target.value)}
                placeholder="Type RESET"
                className="mt-3 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-destructive/30"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetConfirmText('');
                }}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetEverything}
                disabled={resetting || resetConfirmText !== 'RESET'}
              >
                {resetting ? 'Deleting…' : 'Delete Everything'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}