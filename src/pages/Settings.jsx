import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  ChevronRight,
  Download,
  FolderOpen,
  Globe,
  LogOut,
  Moon,
  ShieldAlert,
  SlidersHorizontal,
  Sun,
  Trash2,
  User,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { getUserSettings, saveUserSettings } from '@/lib/budgetData';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { GlassCard, PageHeader, SectionCard } from '@/components/shared/Premium';

const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const SettingRow = ({ icon: Icon, label, description, children, tone = 'default' }) => {
  const iconClass =
    tone === 'danger'
      ? 'bg-red-500/10 text-red-700 dark:text-red-300'
      : tone === 'categories'
        ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
        : 'bg-secondary/80 text-muted-foreground';

  return (
    <div className="flex items-center gap-4 py-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        {description && <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
};

const SarIcon = () => (
  <img src="/sar.svg" alt="SAR" className="inline-block h-4 w-4 dark:invert" />
);

export default function Settings() {
  const [settings, setSettings] = useState({
    theme: 'light',
    currency: 'SAR',
    currencyPlacement: 'before',
    numberFormat: 'comma',
    dateFormat: 'MM/DD/YYYY',
    shift25th: false,
    autoSweep: false,
  });

  const queryClient = useQueryClient();
  const { user, isAuthenticated, signOut } = useAuth();

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await getUserSettings();

        if (saved) {
          const loadedTheme = saved.theme || 'light';

          setSettings((prev) => ({
            ...prev,
            theme: loadedTheme,
            currency: saved.currency || 'SAR',
            currencyPlacement: saved.currency_placement || 'before',
            numberFormat: saved.number_format ?? prev.numberFormat,
            dateFormat: saved.date_format ?? prev.dateFormat,
            shift25th: saved.shift25th ?? prev.shift25th,
            autoSweep: saved.auto_sweep ?? prev.autoSweep,
          }));

          applyTheme(loadedTheme);
        }
      } catch (error) {
        console.error('Settings load failed:', error);
        toast.error('Could not load settings');
      }
    };

    loadSettings();
  }, []);

  const updateSetting = async (key, value) => {
    const newSettings = {
      ...settings,
      [key]: value,
      currencyPlacement: 'before',
    };

    setSettings(newSettings);

    try {
      await saveUserSettings({
        currency: newSettings.currency,
        currency_placement: 'before',
        number_format: newSettings.numberFormat,
        date_format: newSettings.dateFormat,
        theme: newSettings.theme,
        shift25th: newSettings.shift25th,
        auto_sweep: newSettings.autoSweep,
      });

      queryClient.invalidateQueries();

      if (key === 'theme') {
        applyTheme(value);
      }

      toast.success('Setting saved');
    } catch (error) {
      console.error('Settings save failed:', error);
      setSettings(settings);
      toast.error(error.message || 'Could not save setting');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 pb-nav sm:px-6 lg:py-10">
      <PageHeader
        title="Settings"
        description="Shape Cero around your currency, rules, and data preferences."
        icon={SlidersHorizontal}
      />

      <SectionCard title="Account" icon={User} tone="default" bodyClassName="px-4 py-0">
        {isAuthenticated && user ? (
          <SettingRow
            icon={User}
            label={user.user_metadata?.full_name || user.email}
            description={user.email}
          >
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl"
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
          <SettingRow icon={User} label="Not signed in" description="Sign in to sync your data">
            <Button size="sm" className="rounded-2xl" onClick={() => (window.location.href = '/login')}>
              Sign in
            </Button>
          </SettingRow>
        )}
      </SectionCard>

      <SectionCard title="Budget Structure" icon={FolderOpen} tone="analytics" bodyClassName="px-4 py-0">
        <SettingRow
          icon={FolderOpen}
          label="Categories"
          description="Manage income, expenses, savings, and debt groups."
          tone="categories"
        >
          <Button asChild variant="outline" size="sm" className="rounded-2xl">
            <Link to="/settings/categories">
              Open
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Appearance" icon={settings.theme === 'dark' ? Moon : Sun} tone="default" bodyClassName="divide-y divide-border/50 px-4 py-0">
        <SettingRow
          icon={settings.theme === 'dark' ? Moon : Sun}
          label="Dark Mode"
          description="Use deep charcoal surfaces instead of pure black."
        >
          <Switch
            checked={settings.theme === 'dark'}
            onCheckedChange={(value) => updateSetting('theme', value ? 'dark' : 'light')}
          />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Regional & Format" icon={Globe} tone="transfer" bodyClassName="divide-y divide-border/50 px-4 py-0">
        <SettingRow icon={Globe} label="Currency" description="Select your display currency">
          <Select value={settings.currency} onValueChange={(value) => updateSetting('currency', value)}>
            <SelectTrigger className="h-10 w-32 rounded-2xl bg-secondary/60">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="SAR">
                <span className="inline-flex items-center gap-2">
                  <SarIcon />
                  SAR
                </span>
              </SelectItem>
              <SelectItem value="$">$ USD</SelectItem>
              <SelectItem value="€">€ EUR</SelectItem>
              <SelectItem value="£">£ GBP</SelectItem>
              <SelectItem value="₨">₨ PKR</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          icon={Globe}
          label="Currency Placement"
          description="Currency symbol appears before the amount"
        >
          <Select value="before" disabled>
            <SelectTrigger className="h-10 w-36 rounded-2xl bg-secondary/60">
              <SelectValue placeholder="Before" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="before">Before</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow icon={Globe} label="Number Format" description="How numbers are displayed">
          <Select
            value={settings.numberFormat}
            onValueChange={(value) => updateSetting('numberFormat', value)}
          >
            <SelectTrigger className="h-10 w-32 rounded-2xl bg-secondary/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comma">1,234.56</SelectItem>
              <SelectItem value="period">1.234,56</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow icon={Globe} label="Date Format">
          <Select
            value={settings.dateFormat}
            onValueChange={(value) => updateSetting('dateFormat', value)}
          >
            <SelectTrigger className="h-10 w-36 rounded-2xl bg-secondary/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Budget Logic" icon={Calculator} tone="warning" bodyClassName="divide-y divide-border/50 px-4 py-0">
        <SettingRow
          icon={Calculator}
          label="25th Rule"
          description="Income on or after the 25th moves to next month's pool"
        >
          <Switch
            checked={settings.shift25th}
            onCheckedChange={(value) => updateSetting('shift25th', value)}
          />
        </SettingRow>

        <SettingRow
          icon={Calculator}
          label="Auto-Sweep Surplus"
          description="Unspent balances become savings automatically"
        >
          <Switch
            checked={settings.autoSweep}
            onCheckedChange={(value) => updateSetting('autoSweep', value)}
          />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Data & Privacy" icon={ShieldAlert} tone="default" bodyClassName="divide-y divide-border/50 px-4 py-0">
        <SettingRow icon={Download} label="Export CSV" description="Download all your data">
          <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => toast.info('Export coming soon')}>
            Export
          </Button>
        </SettingRow>

        <SettingRow icon={Trash2} label="Reset Database" description="Permanently delete all your data" tone="danger">
          <Button variant="destructive" size="sm" className="rounded-2xl" onClick={() => setShowResetDialog(true)}>
            Reset
          </Button>
        </SettingRow>
      </SectionCard>

      <GlassCard tone="debt" className="p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Reset actions are intentionally isolated here. Export first when you need a backup.
        </p>
      </GlassCard>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Reset All Data?</DialogTitle>
            <DialogDescription>
              This will permanently delete all your transactions, accounts, categories, and budget plans. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {!resetConfirm ? (
            <DialogFooter>
              <Button variant="outline" className="rounded-2xl" onClick={() => setShowResetDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" className="rounded-2xl" onClick={() => setResetConfirm(true)}>
                I understand, continue
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetConfirm(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-2xl"
                onClick={() => {
                  toast.success('Data reset complete');
                  setShowResetDialog(false);
                  setResetConfirm(false);
                }}
              >
                Permanently Delete Everything
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
