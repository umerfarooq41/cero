// Shared, pure discretionary-spending calculation for the dashboard.
const number = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const money = v => Math.round((v + Number.EPSILON) * 100) / 100;
const pad = v => String(v).padStart(2, '0');
export const toLocalIsoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function calculateDiscretionaryPace({ allocations = [], transactions = [], now = new Date(), currentMonth }) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(currentMonth))) return null;
  const [year, month] = currentMonth.split('-').map(Number);
  const plannedByCategory = new Map();
  for (const a of allocations) {
    if (!a.category_id || number(a.planned_amount) <= 0) continue;
    plannedByCategory.set(a.category_id, (plannedByCategory.get(a.category_id) || 0) + number(a.planned_amount));
  }
  const budget = money([...plannedByCategory.values()].reduce((sum, v) => sum + v, 0));
  if (budget <= 0) return null;
  const today = toLocalIsoDate(now);
  const spentByCategory = new Map();
  let spent = 0, spentToday = 0;
  for (const t of transactions) {
    if (t.type !== 'expense' || !plannedByCategory.has(t.category_id)) continue;
    if (t.recurring_transaction_id || t.recurring_posted_for_date || t.goal_contribution_id || t.savings_goal_id || t.goal_id) continue;
    if (['adjustment', 'opening_balance', 'recurring', 'goal', 'savings_goal'].includes(t.source_type)) continue;
    const date = String(t.date || '').slice(0, 10);
    // Never count missing, future or out-of-month dates as actual spending.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.slice(0, 7) !== currentMonth || date > today) continue;
    const amount = Math.max(0, number(t.amount));
    if (!amount) continue;
    spent += amount;
    spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) || 0) + amount);
    if (date === today) spentToday += amount;
  }
  spent = money(spent);
  spentToday = money(spentToday);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = new Date(year, month - 1, 1);
  const inMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const futureMonth = now < monthStart;
  const day = inMonth ? now.getDate() : futureMonth ? 0 : daysInMonth;
  const daysRemaining = inMonth ? daysInMonth - day + 1 : futureMonth ? daysInMonth : 0;
  const beforeToday = money(spent - spentToday);
  const allowance = daysRemaining ? Math.max(0, budget - beforeToday) / daysRemaining : 0;
  const leftToday = inMonth ? Math.max(0, allowance - spentToday) : 0;
  const averageDaily = spent / Math.max(1, day);
  const projected = averageDaily * daysInMonth;
  const difference = projected - budget;
  const tolerance = Math.max(1, budget * 0.025);
  const overBudget = spent > budget + 0.005;
  const categories = [...plannedByCategory].map(([categoryId, planned]) => {
    const categorySpent = money(spentByCategory.get(categoryId) || 0);
    return { categoryId, planned: money(planned), spent: categorySpent,
      remaining: money(planned - categorySpent), percentUsed: categorySpent / planned * 100,
      shareOfSpend: spent ? categorySpent / spent * 100 : 0 };
  }).sort((a, b) => b.spent - a.spent || String(a.categoryId).localeCompare(String(b.categoryId)));
  const top = categories[0];
  return { budget, spent, spentToday, remaining: Math.max(0, money(budget - spent)),
    allowance, leftToday, averageDaily, projected, difference, daysRemaining, daysInMonth, day,
    overBudget, status: overBudget ? 'overBudget' : difference > tolerance ? 'over' : difference < -tolerance ? 'under' : 'track',
    spentPct: Math.min(100, spent / budget * 100),
    timePct: Math.min(100, day / daysInMonth * 100),
    categories, topDriver: top?.spent > 0 ? { categoryId: top.categoryId, spent: top.spent, share: top.shareOfSpend } : null };
}
