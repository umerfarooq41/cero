import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Wallet, FolderOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { accountsApi, categoriesApi, saveUserSettings } from '@/lib/budgetData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const steps = [
  { title: 'Welcome to Cero', subtitle: 'Plan-first, zero-based budgeting', icon: Sparkles },
  { title: 'Regional Setup', subtitle: 'Set your currency and format', icon: Wallet },
  { title: 'Your First Account', subtitle: 'Add your main bank account', icon: Wallet },
  { title: 'Quick Categories', subtitle: "We'll set up the basics", icon: FolderOpen },
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
  const [currency, setCurrency] = useState('$');
  const [accountName, setAccountName] = useState('Main Checking');
  const [accountBalance, setAccountBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);

    try {
      await accountsApi.create({
        name: accountName,
        type: 'checking',
        category: 'asset',
        balance: parseFloat(accountBalance) || 0,
        color: '#0078D4',
      });

      await categoriesApi.bulkCreate(defaultCategories);

      await saveUserSettings({
        onboarding_complete: true,
        currency,
        theme: 'light',
        number_format: 'comma',
        date_format: 'MM/DD/YYYY',
      });

      queryClient.invalidateQueries();
      toast.success('Welcome to Cero!');
      navigate('/');
    } catch (error) {
      console.error('Onboarding failed:', error);
      toast.error(error.message || 'Could not finish setup');
    } finally {
      setLoading(false);
    }
  };

  const StepIcon = steps[step].icon;

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-1.5 mb-10">
          {steps.map((_, i) => (
            <div 
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                i <= step ? "bg-primary" : "bg-secondary"
              )}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <StepIcon className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">{steps[step].title}</h1>
          <p className="text-sm text-muted-foreground">{steps[step].subtitle}</p>
        </div>

        <div className="surface-card card-elevated rounded-2xl border border-white/40 dark:border-white/[0.05] p-6 mb-8">
          {step === 0 && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Axiom uses zero-based budgeting — every dollar gets a job before you spend it. 
                You'll plan your income, assign it to categories, and track every transaction.
              </p>
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <p className="text-sm font-medium text-primary">
                  Goal: Left to Allocate = $0.00
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ — US Dollar</SelectItem>
                    <SelectItem value="€">€ — Euro</SelectItem>
                    <SelectItem value="£">£ — British Pound</SelectItem>
                    <SelectItem value="SAR">SAR — Saudi Riyal</SelectItem>
                    <SelectItem value="₨">₨ — Pakistani Rupee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Account Name</label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Current Balance</label>
                <Input 
                  type="number" 
                  value={accountBalance} 
                  onChange={(e) => setAccountBalance(e.target.value)} 
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                We'll create these starter categories for you:
              </p>
              <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto">
                {defaultCategories.map(cat => (
                  <div key={cat.name} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-secondary/50">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs truncate">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button 
          onClick={() => {
            if (step < 3) setStep(step + 1);
            else handleFinish();
          }}
          disabled={loading}
          className="w-full h-12 text-sm font-semibold gap-2"
        >
          {loading ? 'Setting up...' : step < 3 ? 'Continue' : 'Get Started'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
