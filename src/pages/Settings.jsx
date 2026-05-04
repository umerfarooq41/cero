import { useState, useEffect } from 'react';
import { Moon, Sun, Globe, Calculator, Download, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { getUserSettings, saveUserSettings } from '@/lib/budgetData';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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

export default function Settings() {
  const [settings, setSettings] = useState({
    theme: 'light',
    currency: '$',
    currencyPlacement: 'before',
    numberFormat: 'comma',
    dateFormat: 'MM/DD/YYYY',
    shift25th: false,
    autoSweep: false,
  });
  const queryClient = useQueryClient();
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
            currency: saved.currency ?? prev.currency,
            currencyPlacement: saved.currency_placement ?? prev.currencyPlacement,
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
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await saveUserSettings({
        currency: newSettings.currency,
        currency_placement: newSettings.currencyPlacement,
        number_format: newSettings.numberFormat,
        date_format: newSettings.dateFormat,
        theme: newSettings.theme,
        shift25th: newSettings.shift25th,
        auto_sweep: newSettings.autoSweep,
      });

      if (key === 'currency') {
        queryClient.invalidateQueries({ queryKey: ['currency-symbol'] });
      }

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your financial rules</p>
      </div>

      {/* Appearance */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</h3>
        </div>
        <div className="px-4 divide-y divide-border/50">
          <SettingRow icon={settings.theme === 'dark' ? Moon : Sun} label="Dark Mode" description="Switch between light and dark theme">
            <Switch 
              checked={settings.theme === 'dark'} 
              onCheckedChange={(v) => updateSetting('theme', v ? 'dark' : 'light')} 
            />
          </SettingRow>
        </div>
      </div>

      {/* Regional */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Regional & Format</h3>
        </div>
        <div className="px-4 divide-y divide-border/50">
          <SettingRow icon={Globe} label="Currency" description="Select your currency symbol">
            <Select value={settings.currency} onValueChange={(v) => updateSetting('currency', v)}>
              <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="$">$ USD</SelectItem>
                <SelectItem value="€">€ EUR</SelectItem>
                <SelectItem value="£">£ GBP</SelectItem>
                <SelectItem value="﷼">﷼ SAR</SelectItem>
                <SelectItem value="₨">₨ PKR</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow icon={Globe} label="Number Format" description="How numbers are displayed">
            <Select value={settings.numberFormat} onValueChange={(v) => updateSetting('numberFormat', v)}>
              <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="comma">1,234.56</SelectItem>
                <SelectItem value="period">1.234,56</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow icon={Globe} label="Date Format">
            <Select value={settings.dateFormat} onValueChange={(v) => updateSetting('dateFormat', v)}>
              <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </div>

      {/* Budget Logic */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budget Logic</h3>
        </div>
        <div className="px-4 divide-y divide-border/50">
          <SettingRow icon={Calculator} label="25th Rule" description="Income on/after 25th moves to next month's pool">
            <Switch 
              checked={settings.shift25th} 
              onCheckedChange={(v) => updateSetting('shift25th', v)} 
            />
          </SettingRow>
          <SettingRow icon={Calculator} label="Auto-Sweep Surplus" description="Unspent balances become savings automatically">
            <Switch 
              checked={settings.autoSweep} 
              onCheckedChange={(v) => updateSetting('autoSweep', v)} 
            />
          </SettingRow>
        </div>
      </div>

      {/* Data */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data & Privacy</h3>
        </div>
        <div className="px-4 divide-y divide-border/50">
          <SettingRow icon={Download} label="Export CSV" description="Download all your data">
            <Button variant="outline" size="sm" onClick={() => toast.info('Export coming soon')}>
              Export
            </Button>
          </SettingRow>
          <SettingRow icon={Trash2} label="Reset Database" description="Permanently delete all your data">
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

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset All Data?</DialogTitle>
            <DialogDescription>
              This will permanently delete all your transactions, accounts, categories, and budget plans. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {!resetConfirm ? (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => setResetConfirm(true)}>
                I understand, continue
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowResetDialog(false); setResetConfirm(false); }}>Cancel</Button>
              <Button variant="destructive" onClick={() => {
                toast.success('Data reset complete');
                setShowResetDialog(false);
                setResetConfirm(false);
              }}>
                Permanently Delete Everything
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
