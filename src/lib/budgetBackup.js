import { validateCeroBackup } from "./backupValidation.js";
import { supabase } from "@/lib/supabase";
import { listRows, getUserSettings, logAndThrow } from "./budgetDataCore";
import { createDownload } from "./budgetDownload";

export async function exportCeroBackup() {
  // Keep this format explicit and versioned so future restore tooling can
  // validate compatibility before writing anything back to the database.
  const [
    accounts,
    categories,
    transactions,
    budgetPlans,
    recurringTransactions,
    savingsGoals,
    goalContributions,
    autoSweepDecisions,
    settings,
  ] = await Promise.all([
    listRows("accounts", { orderBy: "created_at", ascending: true }),
    listRows("categories", { orderBy: "created_at", ascending: true }),
    listRows("transactions", { orderBy: "date", ascending: true }),
    listRows("budget_plans", { orderBy: "month", ascending: true }),
    listRows("recurring_transactions", { orderBy: "created_at", ascending: true }),
    listRows("savings_goals", { orderBy: "created_at", ascending: true }),
    listRows("goal_contributions", { orderBy: "created_at", ascending: true }),
    listRows("auto_sweep_decisions", { orderBy: "created_at", ascending: true }),
    getUserSettings(),
  ]);

  const exportedAt = new Date();
  const backup = {
    format: "cero-backup",
    version: 2,
    exported_at: exportedAt.toISOString(),
    data: {
      accounts,
      categories,
      transactions,
      budget_plans: budgetPlans,
      recurring_transactions: recurringTransactions,
      savings_goals: savingsGoals,
      goal_contributions: goalContributions,
      auto_sweep_decisions: autoSweepDecisions,
      user_settings: settings ? [settings] : [],
    },
  };

  const filename = `cero-backup-${exportedAt.toISOString().slice(0, 10)}.json`;
  createDownload(
    filename,
    JSON.stringify(backup, null, 2),
    "application/json;charset=utf-8"
  );

  return {
    filename,
    counts: Object.fromEntries(
      Object.entries(backup.data).map(([key, rows]) => [key, rows.length])
    ),
  };
}


export { validateCeroBackup } from "./backupValidation.js";

export async function restoreCeroBackup(backup) {
  validateCeroBackup(backup);

  const { data, error } = await supabase.rpc("cero_restore_backup", {
    p_backup: backup,
  });
  logAndThrow("Supabase backup restore error:", error);

  return data;
}

export async function resetUserData() {
  // Reset all Cero data atomically in the database. If any delete fails,
  // PostgreSQL rolls the entire reset back instead of leaving partial data.
  const { error } = await supabase.rpc("cero_reset_user_data");
  logAndThrow("Supabase reset error:", error);

  return true;
}