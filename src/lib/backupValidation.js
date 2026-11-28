export function validateCeroBackup(backup) {
  if (
    !backup ||
    backup.format !== "cero-backup" ||
    ![1, 2].includes(Number(backup.version))
  ) {
    throw new Error("This is not a supported Cero backup.");
  }

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

  if (!backup.data || typeof backup.data !== "object" || Array.isArray(backup.data)) {
    throw new Error("Cero backup data is missing.");
  }

  sections.forEach((section) => {
    if (!Array.isArray(backup.data[section])) {
      throw new Error(`Cero backup section "${section}" is missing or invalid.`);
    }
    if (backup.data[section].some(row => !row || typeof row !== "object" || Array.isArray(row))) {
      throw new Error(`Cero backup section "${section}" contains invalid records.`);
    }
  });

  if (backup.data.user_settings.length > 1) {
    throw new Error("Cero backup contains multiple settings records.");
  }

  return true;
}

