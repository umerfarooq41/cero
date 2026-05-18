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

export async function listRows(table, { orderBy = "created_at", ascending = false, filters = {} } = {}) {
  const userId = await currentUserId();
  let query = supabase.from(table).select("*").eq("user_id", userId);

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });

  if (orderBy) {
    query = query.order(orderBy, { ascending });
  }

  const { data, error } = await query;
  logAndThrow(`Supabase ${table} list error:`, error);
  return data || [];
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
  create: (values) => createRow("accounts", values),
  update: (id, values) => updateRow("accounts", id, values),
  delete: (id) => deleteRow("accounts", id),
};

export const categoriesApi = {
  list: () => listRows("categories", { orderBy: "name", ascending: true }),
  create: (values) => createRow("categories", values),
  bulkCreate: (rows) => createRows("categories", rows),
  update: (id, values) => updateRow("categories", id, values),
  delete: (id) => deleteRow("categories", id),
};

export const transactionsApi = {
  list: () => listRows("transactions", { orderBy: "date", ascending: false }),
  create: (values) => createRow("transactions", values),
  update: (id, values) => updateRow("transactions", id, values),
  delete: (id) => deleteRow("transactions", id),
};

export const budgetPlansApi = {
  list: (month) => listRows("budget_plans", { orderBy: "category_id", ascending: true, filters: { month } }),
  upsert: async ({ id, category_id, month, planned_amount }) => {
    if (id) {
      return updateRow("budget_plans", id, { planned_amount });
    }
    return createRow("budget_plans", { category_id, month, planned_amount });
  },
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
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
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

    if (transaction.type === "income") item.income += amount;
    if (transaction.type === "expense") item.expenses += amount;
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

export async function resetUserData() {
  const userId = await currentUserId();

  const tablesInDeleteOrder = [
    "budget_plans",
    "transactions",
    "accounts",
    "categories",
    "user_settings",
  ];

  for (const table of tablesInDeleteOrder) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    logAndThrow(`Supabase ${table} reset error:`, error);
  }

  return true;
}

