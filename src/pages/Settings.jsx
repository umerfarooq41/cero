import { useState, useEffect } from 'react';
import { Moon, Sun, Globe, Calculator, Download, Trash2, User, LogOut } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { getUserSettings, saveUserSettings } from '@/lib/budgetData';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const SettingRow = ({ icon: Icon, label, description, children }) => (
  <div className="flex items-center gap-4 py-4 px-1">
    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium">{label}</div>
      {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const SarIcon = () => (
  <img src="/sar.svg" alt="SAR" className="inline-block w-4 h-4 align-[-2px]" />
);

export default function Settings() {
  const [settings, setSettings] = useState({
    theme: 'light',
    currency: 'SAR', // ✅ default SAR
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
          setSettings(prev => ({
            ...prev,
            theme: saved.theme ?? prev.theme,
            currency: saved.currency || 'SAR',
            currencyPlacement: 'before',
            numberFormat: saved.number_format ?? prev.numberFormat,
            dateFormat: saved.date_format ?? prev.dateFormat,
            shift25th: saved.shift25th ?? prev.shift25th,
            autoSweep: saved.auto_sweep ?? prev.autoSweep,
          }));
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
        document.documentElement.classList.toggle('dark', value === 'dark');
      }

      toast.success('Setting saved');
    } catch (error) {
      console.error('Settings save failed:', error);
      setSettings(settings);
      toast.error(error.message || 'Could not save setting');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:py-10">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your financial rules</p>
      </div>

      {/* ACCOUNT */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Account</h3>
        </div>

        <div className="px-4">
          {isAuthenticated && user ? (
            <SettingRow icon={User} label={user.user_metadata?.full_name || user.email} description={user.email}>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  window.location.href = '/login';
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </SettingRow>
          ) : (
            <SettingRow icon={User} label="Not signed in">
              <Button size="sm" onClick={() => (window.location.href = '/login')}>
                Sign in
              </Button>
            </SettingRow>
          )}
        </div>
      </div>

      {/* CURRENCY */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Regional & Format</h3>
        </div>

        <div className="px-4">
          <SettingRow icon={Globe} label="Currency">
            <Select value={settings.currency} onValueChange={(v) => updateSetting('currency', v)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">$ USD</SelectItem>
                <SelectItem value="€">€ EUR</SelectItem>
                <SelectItem value="£">£ GBP</SelectItem>

                {/* ✅ SAR ONLY */}
                <SelectItem value="SAR">
                  <span className="inline-flex items-center gap-2">
                    <SarIcon />
                    SAR
                  </span>
                </SelectItem>

                <SelectItem value="₨">₨ PKR</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </div>

    </div>
  );
}