import { supabase } from "@/lib/supabase";

async function currentUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Supabase session error:", error);
    throw error;
  }

  const userId = data.session?.user?.id;
  if (!userId) {
    throw new Error("You must be signed in to continue.");
  }

  return userId;
}

export function logAndThrow(label, error) {
  if (error) {
    console.error(label, error);
    throw error;
  }
}

const LIST_PAGE_SIZE = 1000;

export async function listRows(table, { orderBy = "created_at", ascending = false, filters = {} } = {}) {
  const userId = await currentUserId();
  const rows = [];

  for (let from = 0; ; from += LIST_PAGE_SIZE) {
    let query = supabase
      .from(table)
      .select("*")
      .eq("user_id", userId);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }

    const { data, error } = await query.range(from, from + LIST_PAGE_SIZE - 1);
    logAndThrow(`Supabase ${table} list error:`, error);

    const page = data || [];
    rows.push(...page);

    if (page.length < LIST_PAGE_SIZE) break;
  }

  return rows;
}

async function listTransactionsByDateRange(startDate, endDate) {
  const userId = await currentUserId();
  const rows = [];

  for (let from = 0; ; from += LIST_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + LIST_PAGE_SIZE - 1);

    logAndThrow("Supabase transactions date-range list error:", error);

    const page = data || [];
    rows.push(...page);

    if (page.length < LIST_PAGE_SIZE) break;
  }

  return rows;
}

export async function createRow(table, values) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from(table)
    .insert({ ...values, user_id: userId })
    .select()
    .single();

  logAndThrow(`Supabase ${table} create error:`, error);
  return data;
}

export async function createRows(table, rows) {
  const userId = await currentUserId();
  const payload = rows.map((row) => ({ ...row, user_id: userId }));
  const { data, error } = await supabase.from(table).insert(payload).select();

  logAndThrow(`Supabase ${table} bulk create error:`, error);
  return data || [];
}

export async function updateRow(table, id, values) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  logAndThrow(`Supabase ${table} update error:`, error);
  return data;
}

export async function deleteRow(table, id) {
  const userId = await currentUserId();
  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId);

  logAndThrow(`Supabase ${table} delete error:`, error);
}

export const accountsApi = {
  list: () => listRows("accounts", { orderBy: "name", ascending: true }),
  create: async ({ name, type, category, balance = 0, color = null }) => {
    const { data, error } = await supabase.rpc("cero_create_account", {
      p_name: name,
      p_type: type,
      p_category: category,
      p_balance: balance,
      p_color: color,
    });
    logAndThrow("Supabase account creation error:", error);
    return data;
  },
  // Prevent callers from bypassing the audited balance-adjustment ledger.
  update: async (id, values) => {
    if ('balance' in (values || {}) || 'category' in (values || {}) || 'user_id' in (values || {})) {
      throw new Error('Use the dedicated account adjustment workflow for financial changes.');
    }
    return accountsApi.updateDetails(id, values);
  },
  adjustBalance: async (id, targetBalance, note = null) => {
    const { data, error } = await supabase.rpc("cero_adjust_account_balance", {
      p_account_id: id,
      p_target_balance: targetBalance,
      p_note: note,
    });
    logAndThrow("Supabase account balance adjustment error:", error);
    return data;
  },
  updateDetails: async (id, { name, type, color }) => {
    const { data, error } = await supabase.rpc("cero_update_account_details", {
      p_account_id: id,
      p_name: name,
      p_type: type,
      p_color: color,
    });
    logAndThrow("Supabase account details update error:", error);
    return data;
  },
  // Account deletion must preserve history and reconcile linked rules in the
  // database transaction. Never delete an account directly through PostgREST.
  delete: async (id, replacementAccountId = null) => {
    const { error } = await supabase.rpc("cero_delete_account", {
      p_account_id: id,
      p_replacement_account_id: replacementAccountId,
    });
    logAndThrow("Supabase account delete error:", error);
  },
};

export const categoriesApi = {
  list: () => listRows("categories", { orderBy: "name", ascending: true }),
  create: async (values) => {
    const { data, error } = await supabase.rpc("cero_save_category", {
      p_category_id: null, p_values: values,
    });
    logAndThrow("Supabase category create RPC error:", error);
    return data;
  },
  bulkCreate: async (rows) => {
    const { data, error } = await supabase.rpc("cero_create_categories", {
      p_rows: rows,
    });
    logAndThrow("Supabase category bulk create RPC error:", error);
    return data;
  },
  update: async (id, values) => {
    const { data, error } = await supabase.rpc("cero_save_category", {
      p_category_id: id, p_values: values,
    });
    logAndThrow("Supabase category update RPC error:", error);
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.rpc("cero_delete_category", {
      p_category_id: id,
    });
    logAndThrow("Supabase category delete RPC error:", error);
  },
};

async function withIncomeBudgetAssignment(values = {}) {
  const payload = { ...values };

  if (payload.type !== "income") {
    payload.budget_month = null;
    payload.budget_month_override = false;
    return payload;
  }

  const { data, error } = await supabase.rpc("cero_income_budget_month", {
    p_transaction_date: payload.date,
    p_type: payload.type,
    p_requested_budget_month: payload.budget_month || null,
    p_override: Boolean(payload.budget_month_override),
  });

  logAndThrow("Supabase income budget-month assignment error:", error);
  payload.budget_month = data;
  payload.budget_month_override = Boolean(payload.budget_month_override);
  return payload;
}

export const transactionsApi = {
  list: () => listRows("transactions", { orderBy: "date", ascending: false }),
  listByDateRange: (startDate, endDate) => listTransactionsByDateRange(startDate, endDate),
  create: async (values) => {
    const assigned = await withIncomeBudgetAssignment(values);
    const { data, error } = await supabase.rpc("cero_create_transaction", {
      p_amount: assigned.amount,
      p_type: assigned.type,
      p_date: assigned.date,
      p_account_id: assigned.account_id,
      p_to_account_id: assigned.to_account_id ?? null,
      p_category_id: assigned.category_id ?? null,
      p_note: assigned.note ?? null,
    });
    logAndThrow("Supabase transaction create RPC error:", error);
    return data;
  },
  update: async (id, values) => {
    const userId = await currentUserId();
    const { data: existing, error: loadError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    logAndThrow("Supabase transaction load-before-update error:", loadError);
    if (existing.source_type === "adjustment") {
      throw new Error("Adjustment transactions cannot be edited as ordinary transactions.");
    }
    const merged = { ...existing, ...values };
    const assigned = await withIncomeBudgetAssignment(merged);
    const { data, error } = await supabase.rpc("cero_update_transaction", {
      p_transaction_id: id,
      p_amount: assigned.amount,
      p_type: assigned.type,
      p_date: assigned.date,
      p_account_id: assigned.account_id,
      p_to_account_id: assigned.to_account_id ?? null,
      p_category_id: assigned.category_id ?? null,
      p_note: assigned.note ?? null,
    });
    logAndThrow("Supabase transaction update RPC error:", error);
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.rpc("cero_delete_transaction", {
      p_transaction_id: id,
    });
    logAndThrow("Supabase transaction delete RPC error:", error);
  },
};

export const recurringTransactionsApi = {
  list: () =>
    listRows("recurring_transactions", {
      orderBy: "next_due_date",
      ascending: true,
    }),
  create: async (values) => {
    const { data, error } = await supabase.rpc("cero_save_recurring_rule", {
      p_rule_id: null,
      // Completion is database-managed; older forms include it as read-only data.
      p_values: Object.fromEntries(
        Object.entries(values).filter(([key]) => key !== "completed_at")
      ),
    });
    logAndThrow("Supabase recurring rule create error:", error);
    return data;
  },
  update: async (id, values) => {
    const { data, error } = await supabase.rpc("cero_save_recurring_rule", {
      p_rule_id: id,
      // Completion is database-managed; older forms include it as read-only data.
      p_values: Object.fromEntries(
        Object.entries(values).filter(([key]) => key !== "completed_at")
      ),
    });
    logAndThrow("Supabase recurring rule update error:", error);
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.rpc("cero_delete_recurring_rule", {
      p_rule_id: id,
    });
    logAndThrow("Supabase recurring rule delete error:", error);
  },
};

const SAVINGS_GOAL_SAVE_FIELDS = new Set([
  "name", "target_amount", "starting_amount", "current_amount",
  "target_date", "duration_count", "duration_unit", "frequency",
  "start_date", "contribution_mode", "from_account_id", "to_account_id",
  "icon_key", "color_key", "note", "is_archived", "archived_at",
  "next_due_date",
]);

const goalSavePayload = (values) =>
  Object.fromEntries(
    Object.entries(values || {}).filter(([key]) => SAVINGS_GOAL_SAVE_FIELDS.has(key))
  );

export const savingsGoalsApi = {
  list: () =>
    listRows("savings_goals", {
      orderBy: "target_date",
      ascending: true,
    }),
  create: async (values) => {
    const { data, error } = await supabase.rpc("cero_save_savings_goal", {
      p_goal_id: null,
      p_values: goalSavePayload(values),
    });
    logAndThrow("Supabase savings goal create error:", error);
    return data;
  },
  update: async (id, values) => {
    const { data, error } = await supabase.rpc("cero_save_savings_goal", {
      p_goal_id: id,
      p_values: goalSavePayload(values),
    });
    logAndThrow("Supabase savings goal update error:", error);
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.rpc("cero_delete_empty_savings_goal", {
      p_goal_id: id,
    });
    logAndThrow("Supabase savings goal delete error:", error);
  },
};

export const goalContributionsApi = {
  list: () =>
    listRows("goal_contributions", {
      orderBy: "contribution_date",
      ascending: false,
    }),
  // Contributions must be posted/reversed through financial RPCs that
  // atomically update accounts, goal progress, and linked transactions.
  create: async () => {
    throw new Error("Direct goal contribution creation is disabled. Use the goal contribution posting workflow.");
  },
  update: async () => {
    throw new Error("Direct goal contribution editing is disabled. Reverse and repost using the financial workflow.");
  },
  delete: async () => {
    throw new Error("Direct goal contribution deletion is disabled. Use the linked transaction reversal workflow.");
  },
};

export const budgetPlansApi = {
  list: (month) => listRows("budget_plans", { orderBy: "created_at", ascending: true, filters: { month } }),
  upsert: async ({
    id,
    category_id,
    month,
    planned_amount,
    source_type = 'category',
    source_id,
    budget_type,
    label,
    icon,
    color,
  }) => {
    const payload = {
      category_id,
      month,
      planned_amount,
      source_type,
      source_id,
      budget_type,
      label,
      icon,
      color,
    };

    if (id) {
      return updateRow("budget_plans", id, payload);
    }

    if (!source_id) {
      throw new Error("Budget plan source is required.");
    }

    const userId = await currentUserId();
    const { data: existing, error: lookupError } = await supabase
      .from("budget_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("source_type", source_type)
      .eq("source_id", source_id)
      .limit(1)
      .maybeSingle();

    logAndThrow("Supabase budget_plans lookup error:", lookupError);

    if (existing?.id) {
      return updateRow("budget_plans", existing.id, payload);
    }

    return createRow("budget_plans", payload);
  },
  delete: (id) => deleteRow("budget_plans", id),
};

export async function getUserSettings() {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  logAndThrow("Supabase user_settings load error:", error);
  return data;
}

export async function saveUserSettings(settings) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ ...settings, user_id: userId }, { onConflict: "user_id" })
    .select()
    .single();

  logAndThrow("Supabase user_settings save error:", error);
  return data;
}

