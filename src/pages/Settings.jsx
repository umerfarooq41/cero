import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Brush,
  Calculator,
  Check,
  CircleDollarSign,
  Download,
  Fingerprint,
  Globe,
  LayoutGrid,
  LogOut,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  Trash2,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { useTheme } from '@/components/theme-provider';
import { currencies } from '@/lib/currencies';
import { usePageEntrance } from '@/hooks/usePageTransition';
import { cn } from '@/lib/utils';

const toneClasses = {
  blue: {
    tile: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/15',
    selected: 'border-blue-500/30 bg-blue-500/10 text-blue-700 shadow-blue-500/10 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  emerald: {
    tile: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/15',
    selected: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 shadow-emerald-500/10 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  amber: {
    tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/15',
    selected: 'border-amber-500/30 bg-amber-500/10 text-amber-700 shadow-amber-500/10 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  purple: {
    tile: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/15',
    selected: 'border-purple-500/30 bg-purple-500/10 text-purple-700 shadow-purple-500/10 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  cyan: {
    tile: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-cyan-500/15',
    selected: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 shadow-cyan-500/10 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  rose: {
    tile: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/15',
    selected: 'border-rose-500/30 bg-rose-500/10 text-rose-700 shadow-rose-500/10 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  slate: {
    tile: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-slate-500/15',
    selected: 'border-slate-500/30 bg-slate-500/10 text-slate-800 shadow-slate-500/10 dark:text-slate-200',
    dot: 'bg-slate-500',
  },
};

const themeOptions = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

const themeStyleOptions = [
  {
    value: 'ember-noir',
    label: 'Ember Noir',
    description: 'Warm amber glow with a deep noir dark mode.',
    tone: 'amber',
    lightAccent: '28 92% 46%',
    darkAccent: '32 94% 58%',
  },
  {
    value: 'copper-smoke',
    label: 'Copper Smoke',
    description: 'Smoky warm copper canvas with neutral premium surfaces.',
    tone: 'amber',
    lightAccent: '24 72% 42%',
    darkAccent: '28 82% 62%',
  },
  {
    value: 'rose-quartz',
    label: 'Rose Quartz',
    description: 'Soft rose and blush background with a jewel-like dark mode.',
    tone: 'rose',
    lightAccent: '340 82% 48%',
    darkAccent: '340 86% 62%',
  },
  {
    value: 'forest-neon',
    label: 'Forest Neon',
    description: 'Fresh green canvas with a focused neon forest dark mode.',
    tone: 'emerald',
    lightAccent: '142 76% 38%',
    darkAccent: '142 72% 52%',
  },
  {
    value: 'blue-ruby',
    label: 'Blue Ruby',
    description: 'Modern blue gradients with subtle ruby energy.',
    tone: 'blue',
    lightAccent: '221 83% 53%',
    darkAccent: '221 83% 64%',
  },
  {
    value: 'mango-lagoon',
    label: 'Mango Lagoon',
    description: 'Golden mango warmth balanced with smooth lagoon depth.',
    tone: 'amber',
    lightAccent: '38 92% 44%',
    darkAccent: '38 92% 58%',
  },
  {
    value: 'sunset-aqua',
    label: 'Sunset Aqua',
    description: 'Coral sunset warmth with soft aqua atmosphere.',
    tone: 'cyan',
    lightAccent: '16 88% 48%',
    darkAccent: '18 92% 58%',
  },
  {
    value: 'graphite-glow',
    label: 'Graphite Glow',
    description: 'Neutral graphite style for a quieter premium look.',
    tone: 'slate',
    lightAccent: '215 16% 42%',
    darkAccent: '215 18% 72%',
  },
];

const SarIcon = () => (
  <img
    src="/sar.svg"
    alt="SAR"
    className="inline-block h-4 w-4 dark:invert"
  />
);

function getSavedTwentyFifthRule(saved = {}, fallback = false) {
  return (
    saved?.budgetLogic?.twentyFifthRule ??
    saved?.budget_logic?.twenty_fifth_rule ??
    saved?.twentyFifthRule ??
    saved?.shift25th ??
    fallback
  );
}

function getSavedAutoSweepSurplus(saved = {}, fallback = false) {
  return (
    saved?.budgetLogic?.autoSweepSurplus ??
    saved?.budget_logic?.auto_sweep_surplus ??
    saved?.autoSweepSurplus ??
    saved?.auto_sweep ??
    fallback
  );
}

function IconTile({ icon: Icon, tone = 'blue', className }) {
  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1',
        toneClasses[tone]?.tile || toneClasses.blue.tile,
        className
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
    </div>
  );
}

function SettingsSection({ title, description, children, tone = 'blue' }) {
  return (
    <section className="settings-section animate-child mb-4 overflow-hidden rounded-3xl app-card-surface">
      <div className="settings-section-header flex items-start justify-between gap-4 border-b border-border/50 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/50 px-4">{children}</div>
    </section>
  );
}

function SettingRow({
  icon,
  tone = 'blue',
  label,
  description,
  children,
  onClick,
  danger = false,
  stackOnMobile = false,
}) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'settings-row w-full px-1 py-3 text-left transition-colors',
        onClick && 'rounded-2xl app-surface-hover',
        stackOnMobile
          ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'
          : 'flex items-center gap-4'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <IconTile icon={icon} tone={danger ? 'rose' : tone} />

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'truncate text-sm font-semibold',
              danger && 'text-destructive'
            )}
          >
            {label}
          </div>
          {description && (
            <div className="mt-0.5 break-words text-xs leading-5 text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      </div>

      <div className={cn('shrink-0 self-start sm:self-center', stackOnMobile && 'w-full sm:w-auto')}>{children}</div>
    </Wrapper>
  );
}

function SegmentedOption({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition-all',
        active
          ? 'app-card-surface-strong text-foreground shadow-sm ring-1 ring-border/60'
          : 'text-muted-foreground app-surface-hover hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ThemeStyleSwatch({ option, active, onSelect, resolvedTheme }) {
  const accent = resolvedTheme === 'dark' ? option.darkAccent : option.lightAccent;

  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      aria-label={`Apply ${option.label} theme style`}
      title={option.label}
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
        active
          ? 'border-primary/45 ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
          : 'border-border/60 hover:border-border/80'
      )}
    >
      <span
        className="h-5 w-5 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10"
        style={{ backgroundColor: `hsl(${accent})` }}
      />

      {active && (
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-background/80">
          <Check className="h-2.5 w-2.5" />
        </span>
      )}
    </button>
  );
}

export default function Settings() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user, isAuthenticated, signOut } = useAuth();
  const {
    theme,
    setTheme,
    themeStyle,
    setThemeStyle,
    resolvedTheme,
    compactMode,
    setCompactMode,
    showDecimals,
    setShowDecimals,
    hapticsEnabled,
    setHapticsEnabled,
  } = useTheme();

  const [settings, setSettings] = useState({
    theme: 'system',
    currency: 'SAR',
    onboarding_complete: true,
    budgetLogic: {
      twentyFifthRule: false,
      autoSweepSurplus: false,
    },
  });

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [exporting, setExporting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const selectedCurrency = useMemo(
    () => currencies.find((item) => item.code === settings.currency) || currencies[0],
    [settings.currency]
  );

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await getUserSettings();

        if (saved) {
          const loadedTheme = saved?.theme || theme || 'system';
          setTheme(loadedTheme);

          setSettings((prev) => ({
            ...prev,
            theme: loadedTheme,
            currency: saved.currency || 'SAR',
            onboarding_complete: saved.onboarding_complete ?? true,
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
        }
      } catch (error) {
        console.error('Settings load failed:', error);
        toast.error('Could not load settings');
      }
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async (newSettings) => {
    await saveUserSettings({
      onboarding_complete: newSettings.onboarding_complete ?? true,
      currency: newSettings.currency,
      currency_placement: 'before',
      theme: newSettings.theme,
      shift25th: newSettings.budgetLogic.twentyFifthRule,
      auto_sweep: newSettings.budgetLogic.autoSweepSurplus,
    });

    queryClient.invalidateQueries();
  };

  const updateSetting = async (key, value) => {
    const previousSettings = settings;
    const newSettings = { ...settings, [key]: value };

    setSettings(newSettings);

    try {
      await saveSettings(newSettings);
      toast.success('Setting saved');
    } catch (error) {
      console.error('Settings save failed:', error);
      setSettings(previousSettings);
      toast.error(error.message || 'Could not save setting');
    }
  };

  const updateBudgetLogicSetting = async (key, value) => {
    const previousSettings = settings;
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
      setSettings(previousSettings);
      toast.error(error.message || 'Could not save budget logic setting');
    }
  };

  const handleThemeChange = async (nextTheme) => {
    setTheme(nextTheme);
    await updateSetting('theme', nextTheme);
  };

  const handleThemeStyleChange = (nextStyle) => {
    setThemeStyle(nextStyle);
    toast.success('Theme style updated');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error(error.message || 'Could not sign out');
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

      await saveUserSettings({
        onboarding_complete: false,
        currency: 'SAR',
        currency_placement: 'before',
        theme: 'system',
        shift25th: false,
        auto_sweep: false,
      });

      setTheme('system');
      setThemeStyle('ember-noir');
      setCompactMode(false);
      setShowDecimals(true);
      setHapticsEnabled(false);

      queryClient.clear();

      toast.success('All Cero data has been deleted');
      setShowResetDialog(false);
      setResetConfirmText('');
      navigate('/onboarding', { replace: true });
    } catch (error) {
      console.error('Reset database failed:', error);
      toast.error(error.message || 'Could not reset database');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        title="Settings"
        subtitle="Personalize Cero, manage budget behavior, and control your data"
      />

      <main className="mx-auto w-full max-w-4xl px-4 py-3 pb-24 lg:py-8">
        <SettingsSection
          title="Account"
          description="Manage sign-in status and account access."
          tone="blue"
        >
          {isAuthenticated && user ? (
            <SettingRow
              icon={User}
              tone="blue"
              label={user.user_metadata?.full_name || user.email}
              description={user.email}
              stackOnMobile
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-2xl"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </SettingRow>
          ) : (
            <SettingRow
              icon={User}
              tone="blue"
              label="Not signed in"
              description="Sign in to sync your data."
            >
              <Button
                size="sm"
                className="rounded-2xl"
                onClick={() => navigate('/login', { replace: true })}
              >
                Sign in
              </Button>
            </SettingRow>
          )}
        </SettingsSection>

        <SettingsSection
          title="Preferences"
          description="Control how Cero looks and how money is displayed."
          tone="purple"
        >
          <SettingRow
            icon={Palette}
            tone="purple"
            label="Appearance"
            description="Choose system, light, or dark mode."
            stackOnMobile
          >
            <div className="grid grid-cols-3 gap-1 rounded-2xl app-card-surface-soft p-1">
              {themeOptions.map((option) => (
                <SegmentedOption
                  key={option.value}
                  active={theme === option.value}
                  onClick={() => handleThemeChange(option.value)}
                  icon={option.icon}
                  label={option.label}
                />
              ))}
            </div>
          </SettingRow>

          <SettingRow
            icon={Brush}
            tone="cyan"
            label="Theme Style"
            description="Pick a standalone app theme. Backgrounds carry the mood; cards and borders stay neutral."
            stackOnMobile
          >
            <div className="grid w-full grid-cols-4 justify-items-center gap-2 sm:w-[216px]">
              {themeStyleOptions.map((option) => (
                <ThemeStyleSwatch
                  key={option.value}
                  option={option}
                  active={themeStyle === option.value}
                  onSelect={handleThemeStyleChange}
                  resolvedTheme={resolvedTheme}
                />
              ))}
            </div>
          </SettingRow>

          <SettingRow
            icon={Globe}
            tone="emerald"
            label="Currency"
            description={`Currently using ${selectedCurrency?.name || 'Saudi Riyal'}.`}
          >
            <Select
              value={settings.currency}
              onValueChange={(value) => updateSetting('currency', value)}
            >
              <SelectTrigger className="h-10 w-auto min-w-[112px] gap-2 rounded-2xl px-3">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {currencies.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.code === 'SAR' ? (
                      <span className="inline-flex items-center gap-1.5">
                        <SarIcon />
                        {item.shortDisplay}
                      </span>
                    ) : (
                      item.shortDisplay
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            icon={CircleDollarSign}
            tone="amber"
            label="Show Decimals"
            description="Turn off to show whole-number money values in supported amount displays."
          >
            <Switch checked={showDecimals} onCheckedChange={setShowDecimals} />
          </SettingRow>
        </SettingsSection>

        <SettingsSection
          title="Budget Behavior"
          description="Automation and rules that affect budget calculations."
          tone="amber"
        >
          <SettingRow
            icon={Calculator}
            tone="amber"
            label="25th Rule"
            description="Transactions dated on or after the 25th count toward the next budget month."
          >
            <Switch
              checked={settings.budgetLogic.twentyFifthRule}
              onCheckedChange={(value) =>
                updateBudgetLogicSetting('twentyFifthRule', value)
              }
            />
          </SettingRow>

          <SettingRow
            icon={ShieldCheck}
            tone="emerald"
            label="Auto-Sweep Surplus"
            description="At month close, Cero can move leftover surplus into savings when accounts and categories are available."
          >
            <Switch
              checked={settings.budgetLogic.autoSweepSurplus}
              onCheckedChange={(value) =>
                updateBudgetLogicSetting('autoSweepSurplus', value)
              }
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection
          title="App Experience"
          description="Device-level preferences stored safely on this browser."
          tone="cyan"
        >
          <SettingRow
            icon={LayoutGrid}
            tone="cyan"
            label="Compact Mode"
            description="Tightens spacing across the whole app for a denser layout."
          >
            <Switch checked={compactMode} onCheckedChange={setCompactMode} />
          </SettingRow>

          <SettingRow
            icon={Fingerprint}
            tone="purple"
            label="Haptic Feedback"
            description="Adds a light vibration on supported mobile devices when tapping buttons."
          >
            <Switch checked={hapticsEnabled} onCheckedChange={setHapticsEnabled} />
          </SettingRow>
        </SettingsSection>

        <SettingsSection
          title="Data & Reports"
          description="Export your information and keep a backup outside Cero."
          tone="blue"
        >
          <SettingRow
            icon={Download}
            tone="blue"
            label="Export Report"
            description="Download a polished HTML financial report."
          >
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl"
              onClick={() => setShowExportDialog(true)}
            >
              Export
            </Button>
          </SettingRow>
        </SettingsSection>

        <SettingsSection
          title="Danger Zone"
          description="Permanent actions that cannot be undone."
          tone="rose"
        >
          <SettingRow
            icon={Trash2}
            label="Reset Everything"
            description="Permanently delete accounts, transactions, plans, recurring rules, goals, and app settings."
            danger
          >
            <Button
              variant="destructive"
              size="sm"
              className="rounded-2xl"
              onClick={() => setShowResetDialog(true)}
            >
              Reset
            </Button>
          </SettingRow>
        </SettingsSection>

        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="overflow-hidden rounded-3xl app-card-surface-strong p-0 shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <DialogHeader className="border-b border-border/50 px-6 py-5">
              <DialogTitle className="flex items-center gap-3 text-lg font-bold">
                <IconTile icon={Download} tone="blue" />
                Export Financial Report
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm leading-6">
                This downloads your current Cero data as an HTML report you can save,
                print, or share for review.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-5 text-sm text-muted-foreground">
              The export includes accounts, transactions, categories, budgets,
              recurring rules, goals, and a summary of your current settings.
            </div>

            <DialogFooter className="border-t border-border/50 px-6 py-4">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => setShowExportDialog(false)}
                disabled={exporting}
              >
                Cancel
              </Button>
              <Button
                className="rounded-2xl"
                onClick={handleExportReport}
                disabled={exporting}
              >
                {exporting ? 'Exporting…' : 'Download Report'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="overflow-hidden rounded-3xl border border-destructive/25 app-card-surface-strong p-0 shadow-[0_24px_80px_rgba(127,29,29,0.22)] backdrop-blur-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <DialogHeader className="border-b border-destructive/20 px-6 py-5">
              <DialogTitle className="flex items-center gap-3 text-lg font-bold text-destructive">
                <IconTile icon={AlertTriangle} tone="rose" />
                Reset Everything
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm leading-6">
                This permanently deletes all Cero data for this account. This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-muted-foreground">
                This deletes accounts, transactions, monthly plans, categories,
                recurring rules, savings goals, and stored settings.
              </div>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Type RESET to confirm
                </span>
                <input
                  value={resetConfirmText}
                  onChange={(event) => setResetConfirmText(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-border app-card-surface-strong px-4 text-sm font-semibold outline-none ring-offset-background transition focus:ring-2 focus:ring-destructive/30"
                  placeholder="RESET"
                />
              </label>
            </div>

            <DialogFooter className="border-t border-border/50 px-6 py-4">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => setShowResetDialog(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-2xl"
                onClick={handleResetEverything}
                disabled={resetting || resetConfirmText !== 'RESET'}
              >
                {resetting ? 'Resetting…' : 'Delete Everything'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
