import { Account, CategoryId, Transaction } from "./types";
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

// เลื่อน monthKey ("YYYY-MM") ไป delta เดือน (ติดลบ = ย้อนกลับ) จากเดือนใดก็ได้
// ต่างจาก previousMonthKey() ที่อิงเดือนปัจจุบันตายตัวเสมอ
export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function filterByMonth(transactions: Transaction[], monthKey: string): Transaction[] {
  return transactions.filter((t) => monthKeyOf(t.date) === monthKey);
}

// "pending" transactions (money not actually received/paid yet) are excluded
// from every total/aggregate below — they're still visible in the history
// list, they just don't count as real money until confirmed.
function isConfirmed(t: Transaction): boolean {
  return t.status !== "pending";
}

export function sumByType(transactions: Transaction[], type: "expense" | "income"): number {
  return transactions
    .filter((t) => t.type === type && isConfirmed(t))
    .reduce((s, t) => s + t.amount, 0);
}

export function sumByCategory(transactions: Transaction[]): Record<CategoryId, number> {
  const result: Partial<Record<CategoryId, number>> = {};
  transactions
    .filter((t) => t.type === "expense" && isConfirmed(t))
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

// รวมยอดรายการที่ยังเป็น "pending" (ตรงข้ามกับ isConfirmed ด้านบน) — ใช้แสดง
// ให้ผู้ใช้เห็นว่ามีเงินรอยืนยันอยู่เท่าไหร่ ไม่ได้เอาไปรวมกับยอดจริง
export function sumPending(transactions: Transaction[], type: "expense" | "income"): number {
  return transactions
    .filter((t) => t.type === type && t.status === "pending")
    .reduce((s, t) => s + t.amount, 0);
}

// เหมือน topCategories แต่แถมสไลซ์ "รายรับ" (ยอดรายรับรวมทั้งเดือน) และ
// "รอยืนยัน" (รายจ่าย pending) ต่อท้าย เพื่อให้ CategoryDonut แสดงทั้งรายจ่าย
// แยกหมวด, ยอดรายรับ, และเงินที่ยังไม่ยืนยัน อยู่ในวงเดียวกัน
export function categoryBreakdownWithPending(
  transactions: Transaction[],
  n = 8
): { category: CategoryId; amount: number }[] {
  const confirmed = topCategories(transactions, n);
  const income = sumByType(transactions, "income");
  const pending = sumPending(transactions, "expense");
  const result = [...confirmed];
  if (income > 0) result.push({ category: "incomeTotal", amount: income });
  if (pending > 0) result.push({ category: "pending", amount: pending });
  return result;
}

export function topMerchants(transactions: Transaction[], n = 5): { merchant: string; amount: number; count: number }[] {
  const map = new Map<string, { amount: number; count: number }>();
  transactions
    .filter((t) => t.type === "expense" && isConfirmed(t))
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
    .filter((t) => t.type === "expense" && monthKeyOf(t.date) === monthKey && isConfirmed(t))
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
    .filter((t) => t.type === "expense" && isConfirmed(t))
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

// คืนวันที่ตรงกับ "วันที่ X ของเดือน" (day) โดย clamp ให้ไม่เกินวันสุดท้าย
// ของเดือนนั้น (เช่น day=31 ในเดือน ก.พ. จะได้วันสุดท้ายของเดือน ก.พ. แทน)
function clampedDateInMonth(year: number, monthIndex: number, day: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDay));
}

// วันที่ล่าสุดที่ตรงกับ "วันที่ X ของเดือน" (day) ซึ่งมาถึงแล้ว (<= referenceDate)
// — ใช้หาวันสรุปยอดบัตรเครดิตครั้งล่าสุดที่ปิดรอบไปแล้ว
function lastOccurrenceOnOrBefore(day: number, referenceDate: Date): Date {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  const thisMonth = clampedDateInMonth(y, m, day);
  return thisMonth <= referenceDate ? thisMonth : clampedDateInMonth(y, m - 1, day);
}

// วันที่ถัดไปที่ตรงกับ "วันที่ X ของเดือน" (day) ซึ่งมาหลัง referenceDate
// (> ไม่ใช่ >=) — ใช้หาวันครบกำหนดชำระของบิลที่เพิ่งสรุปยอดไป
function nextOccurrenceAfter(day: number, referenceDate: Date): Date {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  const thisMonth = clampedDateInMonth(y, m, day);
  return thisMonth > referenceDate ? thisMonth : clampedDateInMonth(y, m + 1, day);
}

export interface CreditCardBillInfo {
  cycleStart: Date;
  // วันสรุปยอดของรอบบิลที่กำลังแสดงอยู่ — ถ้ายังไม่ถึงวันนี้ แปลว่ายังเป็น
  // รอบที่กำลังสะสมยอดอยู่ (ยังไม่ตัดบิลจริง); ถ้าผ่านไปแล้วแปลว่าตัดบิลไป
  // แล้วแต่ยังไม่เลยกำหนดชำระ (ดูคอมเมนต์ dueDate ด้านล่าง)
  statementDate: Date;
  // วันครบกำหนดชำระของบิลนี้ (null ถ้าบัญชียังไม่ได้ระบุ dueDay ไว้ — เช่น
  // บัตรที่เพิ่มไว้ก่อน migration v4)
  dueDate: Date | null;
  // ยอดรวมรายจ่ายที่ยืนยันแล้วซึ่งรูดก่อนวันสรุปยอด (statementDate) ของรอบนี้
  // — รายการที่รูดวันเดียวกับวันสรุปยอดขึ้นไปจะไม่ถูกนับ (ไปอยู่ในบิลรอบ
  // ถัดไปแทน ตามกติกา "รูดตรงวันสรุปยอดพอดี = เกินรอบไปแล้ว")
  amount: number;
}

// สรุปยอดบิลของบัญชีบัตรเครดิตหนึ่งใบที่ควรแจ้งเตือนผู้ใช้ตอนนี้ จาก
// account.statementDay/dueDay — เริ่มจากรอบบิลล่าสุดที่ปิดยอดไปแล้ว
// (statement ผ่านมาแล้ว) แต่ถ้าบิลนั้นเลยกำหนดชำระไปแล้วด้วย (referenceDate
// เลย dueDate มาแล้ว) ถือว่าจ่ายไปแล้ว เลื่อนไปโชว์ยอดของรอบถัดไปแทน — ซึ่ง
// อาจเป็นรอบที่เพิ่งปิดไปแล้ว หรือรอบที่กำลังสะสมยอดอยู่ตอนนี้ (ยังไม่ปิด)
// ก็ได้ วนแบบนี้ไปเรื่อยๆ จนกว่าจะเจอรอบที่ยังไม่เลยกำหนดชำระ — ผลคือผู้ใช้
// เห็นยอดที่ต้องเตรียมจ่ายเสมอ ไม่ใช่แค่บิลที่เพิ่งปิดไปแล้วเท่านั้น (เช่น
// รายการที่เพิ่งรูดวันนี้ในรอบที่ยังไม่ปิด ก็ต้องเห็นทันทีเหมือนกัน)
export function creditCardBillInfo(
  transactions: Transaction[],
  account: Account,
  referenceDate: Date = new Date()
): CreditCardBillInfo | null {
  if (!account.statementDay) return null;
  let statementDate = lastOccurrenceOnOrBefore(account.statementDay, referenceDate);
  let dueDate = account.dueDay ? nextOccurrenceAfter(account.dueDay, statementDate) : null;
  while (dueDate && referenceDate > dueDate) {
    statementDate = clampedDateInMonth(
      statementDate.getFullYear(),
      statementDate.getMonth() + 1,
      account.statementDay
    );
    dueDate = account.dueDay ? nextOccurrenceAfter(account.dueDay, statementDate) : null;
  }
  const cycleStart = clampedDateInMonth(
    statementDate.getFullYear(),
    statementDate.getMonth() - 1,
    account.statementDay
  );
  const amount = transactions
    .filter((t) => t.accountId === account.id && t.type === "expense" && isConfirmed(t))
    .filter((t) => {
      const d = new Date(t.date);
      return d >= cycleStart && d < statementDate;
    })
    .reduce((s, t) => s + t.amount, 0);
  return { cycleStart, statementDate, dueDate, amount };
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
