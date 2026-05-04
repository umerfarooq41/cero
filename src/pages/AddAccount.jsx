import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/lib/budgetData';
import { useAccounts } from '@/hooks/useBudgetData';
import { toast } from 'sonner';

const accountTypes = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'investment', label: 'Investment' },
  { value: 'loan', label: 'Loan' },
  { value: 'other', label: 'Other' },
];

const colors = ['#0078D4', '#107C10', '#C50F1F', '#8764B8', '#CA5010', '#008272', '#4F6BED', '#69797E'];

export default function AddAccount() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const queryClient = useQueryClient();
  const { data: accounts } = useAccounts();
  const existingAccount = accounts.find(a => a.id === id);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('asset');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existingAccount) return;
    setName(existingAccount.name || '');
    setType(existingAccount.type || '');
    setCategory(existingAccount.category || 'asset');
    setBalance(String(existingAccount.balance ?? ''));
    setColor(existingAccount.color || colors[0]);
  }, [existingAccount]);

  const handleSave = async () => {
    if (!name || !type) {
      toast.error('Name and type are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name, type, category,
        balance: parseFloat(balance) || 0,
        color,
      };

      if (isEditing) {
        await accountsApi.update(id, payload);
      } else {
        await accountsApi.create(payload);
      }

      queryClient.invalidateQueries({ queryKey: ['accounts'] });
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
    <div className="max-w-lg mx-auto px-4 py-6 lg:py-10">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight">{isEditing ? 'Edit Account' : 'Add Account'}</h1>
      </div>

      <div className="space-y-5 bg-card rounded-xl border border-border p-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Account Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Checking" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {accountTypes.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="asset">Asset</SelectItem>
              <SelectItem value="liability">Liability</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{isEditing ? 'Current Balance' : 'Starting Balance'}</label>
          <Input 
            type="number" 
            value={balance} 
            onChange={(e) => setBalance(e.target.value)} 
            placeholder="0.00"
            step="0.01"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Color</label>
          <div className="flex gap-2">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="w-full h-12 mt-6 text-sm font-semibold"
      >
        {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Account'}
      </Button>
    </div>
  );
}
