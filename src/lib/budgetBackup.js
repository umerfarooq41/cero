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


export function validateCeroBackup(backup) {
  const sections = [
    "accounts",
    "categories",
    "transactions",
    "budget_plans",
    "recurring_transactions",
    "savings_goals",
    "goal_contributions",
    ...(backup.version >= 2 ? ["auto_sweep_decisions"] : []),
    "user_settings",
  ];

  if (
    !backup ||
    backup.format !== "cero-backup" ||
    ![1, 2].includes(Number(backup.version))
  ) {
    throw new Error("This is not a supported Cero backup.");
  }

  if (!backup.data || typeof backup.data !== "object") {
    throw new Error("Cero backup data is missing.");
  }

  sections.forEach((section) => {
    if (!Array.isArray(backup.data[section])) {
      throw new Error(`Cero backup section "${section}" is missing or invalid.`);
    }
  });

  if (backup.data.user_settings.length > 1) {
    throw new Error("Cero backup contains multiple settings records.");
  }

  return true;
}

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