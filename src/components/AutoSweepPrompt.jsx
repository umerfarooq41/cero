import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { getCurrentBudgetMonth, getPreviousBudgetMonth } from '@/lib/budgetLogic';
import { invalidateScheduledQueries } from '@/lib/queryInvalidation';
import { queryClientInstance } from '@/lib/query-client';
import { toast } from 'sonner';

export default function AutoSweepPrompt() {
  const { session } = useAuth();
  const [decision, setDecision] = useState(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session?.user?.id || !navigator.onLine) return;

    let cancelled = false;

    const prepare = async () => {
      const month = getPreviousBudgetMonth(getCurrentBudgetMonth());
      if (!month) return;

      const { data, error } = await supabase.rpc('cero_auto_sweep_prepare', {
        p_month: month,
      });
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (!row || cancelled) return;

      if (
        row.status === 'pending' &&
        Number(row.proposed_amount || 0) > 0 &&
        row.execution_mode === 'automatic'
      ) {
        const { error: confirmError } = await supabase.rpc('cero_auto_sweep_confirm', {
          p_month: month,
          p_amount: null,
          p_manual: false,
        });
        if (confirmError) throw confirmError;
        invalidateScheduledQueries(queryClientInstance);
        return;
      }

      if (
        row.status === 'pending' &&
        Number(row.proposed_amount || 0) > 0 &&
        row.execution_mode !== 'automatic'
      ) {
        setDecision({ ...row, month });
        setAmount(String(Number(row.proposed_amount || 0).toFixed(2)));
      }
    };

    prepare().catch((error) => {
      console.error('Auto-Sweep prepare failed:', error);
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const confirm = async () => {
    if (!decision) return;
    const requested = Number(amount);
    if (!Number.isFinite(requested) || requested <= 0) {
      toast.error('Enter an amount greater than zero');
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('cero_auto_sweep_confirm', {
        p_month: decision.month,
        p_amount: requested,
        p_manual: true,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (Number(row?.posted_amount || 0) <= 0) {
        toast.error(row?.reason || 'No safe amount is available to sweep');
        return;
      }
      invalidateScheduledQueries(queryClientInstance);
      toast.success('Month surplus moved');
      setDecision(null);
    } catch (error) {
      console.error('Auto-Sweep confirm failed:', error);
      toast.error(error.message || 'Could not move month surplus');
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    if (!decision) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('cero_auto_sweep_skip', {
        p_month: decision.month,
      });
      if (error) throw error;
      setDecision(null);
      toast.success('Auto-Sweep skipped for this month');
    } catch (error) {
      console.error('Auto-Sweep skip failed:', error);
      toast.error(error.message || 'Could not skip Auto-Sweep');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(decision)} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Month surplus</DialogTitle>
          <DialogDescription>
            {decision
              ? `${decision.month} surplus · ${decision.source_name} → ${decision.destination_name}. Confirm, reduce the amount, or skip this month.`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Amount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-base"
            disabled={busy}
          />
        </label>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={skip} disabled={busy}>
            Skip this month
          </Button>
          <Button type="button" onClick={confirm} disabled={busy}>
            {busy ? 'Working…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
