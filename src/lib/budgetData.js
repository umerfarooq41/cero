import { supabase } from "@/lib/supabase";
import { getCurrencySymbol } from "@/lib/currencies";

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

function logAndThrow(label, error) {
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
  create: (values) => createRow("categories", values),
  bulkCreate: (rows) => createRows("categories", rows),
  update: (id, values) => updateRow("categories", id, values),
  delete: (id) => deleteRow("categories", id),
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
  create: (values) => createRow("recurring_transactions", values),
  update: (id, values) => updateRow("recurring_transactions", id, values),
  delete: async (id) => {
    const { error } = await supabase.rpc("cero_delete_recurring_rule", {
      p_rule_id: id,
    });
    logAndThrow("Supabase recurring rule delete error:", error);
  },
};

export const savingsGoalsApi = {
  list: () =>
    listRows("savings_goals", {
      orderBy: "target_date",
      ascending: true,
    }),
  create: (values) => createRow("savings_goals", values),
  update: (id, values) => updateRow("savings_goals", id, values),
  delete: (id) => deleteRow("savings_goals", id),
};

export const goalContributionsApi = {
  list: () =>
    listRows("goal_contributions", {
      orderBy: "contribution_date",
      ascending: false,
    }),
  create: (values) => createRow("goal_contributions", values),
  update: (id, values) => updateRow("goal_contributions", id, values),
  delete: (id) => deleteRow("goal_contributions", id),
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
    const { data, error } = await supabase
      .from("budget_plans")
      .upsert(
        { ...payload, user_id: userId },
        { onConflict: "user_id,month,source_type,source_id" }
      )
      .select()
      .single();

    logAndThrow("Supabase budget_plans upsert error:", error);
    return data;
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCurrencyCodeFromSettings(settings) {
  return settings?.currency || "SAR";
}

function getCurrencySymbolFromCode(code = "SAR") {
  return getCurrencySymbol(code);
}

function formatReportMoney(value, currencyCode = "SAR") {
  const amount = Number(value || 0);
  const symbol = getCurrencySymbolFromCode(currencyCode);

  return `${symbol} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeMonth(dateValue) {
  if (!dateValue) return "Unknown";
  return String(dateValue).slice(0, 7);
}

function getTransactionAmount(transaction) {
  return Math.abs(Number(transaction?.amount || 0));
}

function getSignedTransactionAmount(transaction) {
  const amount = getTransactionAmount(transaction);

  if (transaction?.type === "income") return amount;
  if (transaction?.type === "expense") return -amount;
  if (transaction?.type === "savings") return -amount;
  if (transaction?.type === "debt") return -amount;

  return Number(transaction?.amount || 0);
}

function createDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildRows(rows, emptyText = "No data available.") {
  if (!rows.length) {
    return `<tr><td colspan="99" class="empty">${escapeHtml(emptyText)}</td></tr>`;
  }

  return rows.join("");
}

export async function exportFinancialReport() {
  const [accounts, categories, transactions, budgetPlans, settings] = await Promise.all([
    accountsApi.list(),
    categoriesApi.list(),
    transactionsApi.list(),
    listRows("budget_plans", { orderBy: "month", ascending: false }),
    getUserSettings(),
  ]);

  const currencyCode = getCurrencyCodeFromSettings(settings);
  const generatedAt = new Date();
  const generatedDate = generatedAt.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const assets = accounts.filter((account) => account.category === "asset");
  const liabilities = accounts.filter((account) => account.category === "liability");

  const totalAssets = assets.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const totalLiabilities = liabilities.reduce(
    (sum, account) => sum + Math.abs(Number(account.balance || 0)),
    0
  );
  const netWorth = totalAssets - totalLiabilities;

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income" && transaction.source_type !== "adjustment")
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense" && transaction.source_type !== "adjustment")
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);

  const totalSavings = transactions
    .filter((transaction) => transaction.type === "savings")
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);

  const totalDebt = transactions
    .filter((transaction) => transaction.type === "debt")
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);

  const monthlyMap = new Map();

  transactions.forEach((transaction) => {
    const month = normalizeMonth(transaction.date);

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, {
        month,
        income: 0,
        expenses: 0,
        savings: 0,
        debt: 0,
        netCashFlow: 0,
        transactions: 0,
      });
    }

    const item = monthlyMap.get(month);
    const amount = getTransactionAmount(transaction);

    item.transactions += 1;

    if (transaction.type === "income" && transaction.source_type !== "adjustment") item.income += amount;
    if (transaction.type === "expense" && transaction.source_type !== "adjustment") item.expenses += amount;
    if (transaction.type === "savings") item.savings += amount;
    if (transaction.type === "debt") item.debt += amount;

    item.netCashFlow += getSignedTransactionAmount(transaction);
  });

  const monthlyRows = [...monthlyMap.values()]
    .sort((a, b) => String(b.month).localeCompare(String(a.month)))
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.month)}</td>
          <td class="money positive">${formatReportMoney(item.income, currencyCode)}</td>
          <td class="money negative">${formatReportMoney(item.expenses, currencyCode)}</td>
          <td class="money blue">${formatReportMoney(item.savings, currencyCode)}</td>
          <td class="money purple">${formatReportMoney(item.debt, currencyCode)}</td>
          <td class="money ${item.netCashFlow >= 0 ? "positive" : "negative"}">${formatReportMoney(item.netCashFlow, currencyCode)}</td>
          <td>${item.transactions}</td>
        </tr>
      `
    );

  const categoryMap = new Map();

  categories.forEach((category) => {
    categoryMap.set(category.id, {
      id: category.id,
      name: category.name,
      type: category.type,
      planned: 0,
      tracked: 0,
      count: 0,
    });
  });

  budgetPlans.forEach((plan) => {
    const item = categoryMap.get(plan.category_id);

    if (item) {
      item.planned += Number(plan.planned_amount || 0);
    }
  });

  transactions.forEach((transaction) => {
    const item = categoryMap.get(transaction.category_id);

    if (item) {
      item.tracked += getTransactionAmount(transaction);
      item.count += 1;
    }
  });

  const categoryRows = [...categoryMap.values()]
    .filter((item) => item.planned > 0 || item.tracked > 0)
    .sort((a, b) => b.tracked - a.tracked)
    .map((item) => {
      const variance = item.planned - item.tracked;
      const usage = item.planned > 0 ? Math.round((item.tracked / item.planned) * 100) : 0;

      return `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td><span class="pill">${escapeHtml(item.type || "other")}</span></td>
          <td class="money">${formatReportMoney(item.planned, currencyCode)}</td>
          <td class="money">${formatReportMoney(item.tracked, currencyCode)}</td>
          <td class="money ${variance >= 0 ? "positive" : "negative"}">${formatReportMoney(variance, currencyCode)}</td>
          <td>${usage}%</td>
          <td>${item.count}</td>
        </tr>
      `;
    });

  const accountRows = accounts
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .map(
      (account) => `
        <tr>
          <td>${escapeHtml(account.name)}</td>
          <td><span class="pill">${escapeHtml(account.category || "account")}</span></td>
          <td>${escapeHtml(String(account.type || "").replaceAll("_", " ") || "Account")}</td>
          <td class="money">${formatReportMoney(Math.abs(Number(account.balance || 0)), currencyCode)}</td>
        </tr>
      `
    );

  const transactionRows = transactions.slice(0, 250).map((transaction) => {
    const category = categoryById.get(transaction.category_id);
    const account =
      accountById.get(transaction.account_id) ||
      accountById.get(transaction.from_account_id) ||
      accountById.get(transaction.to_account_id);

    return `
      <tr>
        <td>${escapeHtml(transaction.date || "")}</td>
        <td><span class="pill">${escapeHtml(transaction.type || "transaction")}</span></td>
        <td>${escapeHtml(category?.name || "Uncategorized")}</td>
        <td>${escapeHtml(account?.name || "No account")}</td>
        <td class="money">${formatReportMoney(getTransactionAmount(transaction), currencyCode)}</td>
        <td>${escapeHtml(transaction.note || transaction.description || "")}</td>
      </tr>
    `;
  });

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Cero Financial Report</title>
  <style>
    :root {
      --bg: #f6f8fb;
      --card: #ffffff;
      --text: #101828;
      --muted: #667085;
      --border: #e4e7ec;
      --primary: #0078d4;
      --green: #059669;
      --red: #dc2626;
      --blue: #2563eb;
      --purple: #7c3aed;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background: linear-gradient(135deg, #f8fbff 0%, #eef5ff 45%, #f7f7fb 100%);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }

    .page {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      padding: 32px 0;
    }

    .hero {
      overflow: hidden;
      border: 1px solid rgba(0, 120, 212, 0.18);
      border-radius: 28px;
      background:
        radial-gradient(circle at top left, rgba(0, 120, 212, 0.20), transparent 36%),
        radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.16), transparent 32%),
        rgba(255, 255, 255, 0.84);
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
      padding: 28px;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--primary);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    .brand-dot {
      width: 11px;
      height: 11px;
      border-radius: 999px;
      background: var(--primary);
      box-shadow: 0 0 0 6px rgba(0, 120, 212, 0.12);
    }

    h1 {
      margin: 18px 0 8px;
      font-size: clamp(34px, 5vw, 56px);
      letter-spacing: -0.055em;
      line-height: 0.95;
    }

    .subtitle {
      max-width: 680px;
      color: var(--muted);
      font-size: 15px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin-top: 24px;
    }

    .kpi {
      border: 1px solid rgba(228, 231, 236, 0.9);
      border-radius: 22px;
      background: rgba(255,255,255,0.72);
      padding: 18px;
    }

    .kpi-label {
      color: var(--muted);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .13em;
      text-transform: uppercase;
    }

    .kpi-value {
      margin-top: 8px;
      font-size: 22px;
      font-weight: 850;
      letter-spacing: -.03em;
    }

    .section {
      margin-top: 20px;
      overflow: hidden;
      border: 1px solid var(--border);
      border-radius: 24px;
      background: var(--card);
      box-shadow: 0 12px 35px rgba(15, 23, 42, 0.045);
    }

    .section-header {
      padding: 18px 20px;
      border-bottom: 1px solid var(--border);
      background: #fbfcfe;
    }

    .section-title {
      margin: 0;
      font-size: 15px;
      font-weight: 850;
      letter-spacing: -0.01em;
    }

    .section-note {
      margin-top: 4px;
      color: var(--muted);
      font-size: 12px;
    }

    .table-wrap {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    th {
      padding: 12px 16px;
      color: var(--muted);
      background: #f9fafb;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .12em;
      text-align: left;
      text-transform: uppercase;
      white-space: nowrap;
    }

    td {
      padding: 13px 16px;
      border-top: 1px solid #f0f2f5;
      vertical-align: top;
    }

    .money {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      font-weight: 700;
    }

    .positive { color: var(--green); }
    .negative { color: var(--red); }
    .blue { color: var(--blue); }
    .purple { color: var(--purple); }

    .pill {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: #eef2f7;
      color: #344054;
      padding: 4px 9px;
      font-size: 10px;
      font-weight: 800;
      text-transform: capitalize;
      white-space: nowrap;
    }

    .empty {
      color: var(--muted);
      padding: 28px 16px;
      text-align: center;
    }

    .footer {
      margin-top: 22px;
      color: var(--muted);
      font-size: 11px;
      text-align: center;
    }

    @media print {
      body { background: #fff; }
      .page { width: 100%; padding: 0; }
      .hero, .section { box-shadow: none; break-inside: avoid; }
    }

    @media (max-width: 760px) {
      .page { width: min(100% - 20px, 1120px); padding: 16px 0; }
      .hero { padding: 22px; border-radius: 24px; }
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      h1 { font-size: 36px; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div class="brand"><span class="brand-dot"></span>Cero Financial Report</div>
      <h1>Your money snapshot.</h1>
      <div class="subtitle">
        A polished export of your accounts, planning, transactions, category performance, savings, debt, and monthly cash flow. Generated on ${escapeHtml(generatedDate)}.
      </div>

      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-label">Net Worth</div>
          <div class="kpi-value ${netWorth >= 0 ? "positive" : "negative"}">${formatReportMoney(netWorth, currencyCode)}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Total Income</div>
          <div class="kpi-value positive">${formatReportMoney(totalIncome, currencyCode)}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Expenses</div>
          <div class="kpi-value negative">${formatReportMoney(totalExpenses, currencyCode)}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Savings + Debt</div>
          <div class="kpi-value blue">${formatReportMoney(totalSavings + totalDebt, currencyCode)}</div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Monthly Cash Flow</h2>
        <div class="section-note">Income, expenses, savings, debt payments, and net movement by month.</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Savings</th>
              <th>Debt</th>
              <th>Net Cash Flow</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>${buildRows(monthlyRows)}</tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Category Performance</h2>
        <div class="section-note">Compares planned budget against tracked activity across all categories.</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Type</th>
              <th>Planned</th>
              <th>Tracked</th>
              <th>Left / Over</th>
              <th>Used</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>${buildRows(categoryRows)}</tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Accounts</h2>
        <div class="section-note">Asset and liability balances included in your net worth.</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Group</th>
              <th>Type</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>${buildRows(accountRows)}</tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Recent Transactions</h2>
        <div class="section-note">Latest 250 transactions for audit and review.</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>${buildRows(transactionRows)}</tbody>
        </table>
      </div>
    </section>

    <div class="footer">
      Exported from Cero. This report is generated from your cloud-synced account data.
    </div>
  </main>
</body>
</html>`;

  const dateSlug = generatedAt.toISOString().slice(0, 10);
  const filename = `cero-financial-report-${dateSlug}.html`;

  createDownload(filename, html, "text/html;charset=utf-8");

  return {
    filename,
    counts: {
      accounts: accounts.length,
      categories: categories.length,
      transactions: transactions.length,
      budgetPlans: budgetPlans.length,
    },
  };
}


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