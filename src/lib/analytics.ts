import { CategoryId, Transaction } from "./types";
import { monthKeyOf } from "./format";

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function previousMonthKey(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function filterByMonth(transactions: Transaction[], monthKey: string): Transaction[] {
  return transactions.filter((t) => monthKeyOf(t.date) === monthKey);
}

export function sumByType(transactions: Transaction[], type: "expense" | "income"): number {
  return transactions.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
}

export function sumByCategory(transactions: Transaction[]): Record<CategoryId, number> {
  const result: Partial<Record<CategoryId, number>> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      result[t.category] = (result[t.category] ?? 0) + t.amount;
    });
  return result as Record<CategoryId, number>;
}

export function topCategories(transactions: Transaction[], n = 3): { category: CategoryId; amount: number }[] {
  const byCategory = sumByCategory(transactions);
  return Object.entries(byCategory)
    .map(([category, amount]) => ({ category: category as CategoryId, amount: amount as number }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

export function topMerchants(transactions: Transaction[], n = 5): { merchant: string; amount: number; count: number }[] {
  const map = new Map<string, { amount: number; count: number }>();
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cur = map.get(t.merchant) ?? { amount: 0, count: 0 };
      map.set(t.merchant, { amount: cur.amount + t.amount, count: cur.count + 1 });
    });
  return Array.from(map.entries())
    .map(([merchant, v]) => ({ merchant, ...v }))
    .sort((a, b) => b.count - a.count || b.amount - a.amount)
    .slice(0, n);
}

export function dailySpendSeries(transactions: Transaction[], monthKey: string): { day: number; amount: number }[] {
  const [y, m] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const series = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, amount: 0 }));
  transactions
    .filter((t) => t.type === "expense" && monthKeyOf(t.date) === monthKey)
    .forEach((t) => {
      const day = new Date(t.date).getDate();
      series[day - 1].amount += t.amount;
    });
  return series;
}

export function monthlyComparisonSeries(
  transactions: Transaction[],
  monthsBack = 6
): { label: string; monthKey: string; expense: number; income: number }[] {
  const now = new Date();
  const months: { label: string; monthKey: string }[] = [];
  const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: THAI_MONTHS_SHORT[d.getMonth()],
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return months.map(({ label, monthKey }) => {
    const monthTx = filterByMonth(transactions, monthKey);
    return {
      label,
      monthKey,
      expense: sumByType(monthTx, "expense"),
      income: sumByType(monthTx, "income"),
    };
  });
}

export function percentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function recurringMerchants(transactions: Transaction[]): { merchant: string; amount: number }[] {
  // Naive heuristic for prototype: merchants appearing with the exact
  // amount more than once are treated as "recurring" (subscriptions, rent).
  const map = new Map<string, number>();
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const key = `${t.merchant}__${t.amount}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
  const recurring: { merchant: string; amount: number }[] = [];
  map.forEach((count, key) => {
    if (count >= 2) {
      const [merchant, amountStr] = key.split("__");
      recurring.push({ merchant, amount: Number(amountStr) });
    }
  });
  return recurring;
}

export function projectedEndOfMonthBalance(
  transactions: Transaction[],
  monthlyIncome: number,
  budgetTotal: number
): number {
  const monthKey = currentMonthKey();
  const monthTx = filterByMonth(transactions, monthKey);
  const spentSoFar = sumByType(monthTx, "expense");
  const today = new Date().getDate();
  const daysInMonth = new Date(
    Number(monthKey.split("-")[0]),
    Number(monthKey.split("-")[1]),
    0
  ).getDate();
  const dailyRate = spentSoFar / Math.max(1, today);
  const projectedTotal = dailyRate * daysInMonth;
  return Math.round(monthlyIncome - projectedTotal || budgetTotal - projectedTotal);
}
