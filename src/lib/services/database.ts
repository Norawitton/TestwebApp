// Database service layer.
//
// This module is the ONLY place that talks to storage. Every screen/hook
// calls these functions instead of touching localStorage directly, so that
// swapping the prototype's localStorage backend for Supabase or Firebase
// later only requires rewriting this one file (same function signatures,
// return Promises already so callers don't need to change).

import {
  Account,
  Budget,
  SavingGoal,
  Transaction,
  UserProfile,
} from "@/lib/types";
import {
  SEED_ACCOUNTS,
  SEED_BUDGET,
  SEED_GOALS,
  SEED_PROFILE,
  SEED_TRANSACTIONS,
} from "@/lib/mockData";

const KEYS = {
  transactions: "aomgun.transactions",
  accounts: "aomgun.accounts",
  budget: "aomgun.budget",
  goals: "aomgun.goals",
  profile: "aomgun.profile",
  seeded: "aomgun.seeded",
} as const;

function isBrowser() {
  return typeof window !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeeded(): void {
  if (!isBrowser()) return;
  if (window.localStorage.getItem(KEYS.seeded)) return;
  write(KEYS.transactions, SEED_TRANSACTIONS);
  write(KEYS.accounts, SEED_ACCOUNTS);
  write(KEYS.budget, SEED_BUDGET);
  write(KEYS.goals, SEED_GOALS);
  write(KEYS.profile, SEED_PROFILE);
  window.localStorage.setItem(KEYS.seeded, "1");
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Simulate network latency so loading states are exercised, same shape
// a real async backend call would have.
function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ---------------- Transactions ----------------

export async function listTransactions(): Promise<Transaction[]> {
  ensureSeeded();
  const items = read<Transaction[]>(KEYS.transactions, []);
  return delay(
    [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
}

export async function createTransaction(
  input: Omit<Transaction, "id" | "createdAt">
): Promise<Transaction> {
  ensureSeeded();
  const items = read<Transaction[]>(KEYS.transactions, []);
  const tx: Transaction = {
    ...input,
    id: uid("tx"),
    createdAt: new Date().toISOString(),
  };
  write(KEYS.transactions, [tx, ...items]);
  return delay(tx, 150);
}

export async function updateTransaction(
  id: string,
  patch: Partial<Transaction>
): Promise<Transaction | null> {
  ensureSeeded();
  const items = read<Transaction[]>(KEYS.transactions, []);
  const idx = items.findIndex((t) => t.id === id);
  if (idx === -1) return delay(null, 100);
  items[idx] = { ...items[idx], ...patch };
  write(KEYS.transactions, items);
  return delay(items[idx], 150);
}

export async function deleteTransaction(id: string): Promise<boolean> {
  ensureSeeded();
  const items = read<Transaction[]>(KEYS.transactions, []);
  const next = items.filter((t) => t.id !== id);
  write(KEYS.transactions, next);
  return delay(true, 120);
}

// ---------------- Accounts ----------------

export async function listAccounts(): Promise<Account[]> {
  ensureSeeded();
  return delay(read<Account[]>(KEYS.accounts, []));
}

// ---------------- Budget ----------------

export async function getBudget(): Promise<Budget> {
  ensureSeeded();
  return delay(read<Budget>(KEYS.budget, SEED_BUDGET));
}

export async function updateBudget(patch: Partial<Budget>): Promise<Budget> {
  ensureSeeded();
  const current = read<Budget>(KEYS.budget, SEED_BUDGET);
  const next = { ...current, ...patch };
  write(KEYS.budget, next);
  return delay(next, 150);
}

// ---------------- Saving goals ----------------

export async function listGoals(): Promise<SavingGoal[]> {
  ensureSeeded();
  return delay(read<SavingGoal[]>(KEYS.goals, []));
}

export async function createGoal(
  input: Omit<SavingGoal, "id">
): Promise<SavingGoal> {
  ensureSeeded();
  const items = read<SavingGoal[]>(KEYS.goals, []);
  const goal: SavingGoal = { ...input, id: uid("goal") };
  write(KEYS.goals, [...items, goal]);
  return delay(goal, 150);
}

export async function updateGoal(
  id: string,
  patch: Partial<SavingGoal>
): Promise<SavingGoal | null> {
  ensureSeeded();
  const items = read<SavingGoal[]>(KEYS.goals, []);
  const idx = items.findIndex((g) => g.id === id);
  if (idx === -1) return delay(null, 100);
  items[idx] = { ...items[idx], ...patch };
  write(KEYS.goals, items);
  return delay(items[idx], 150);
}

export async function deleteGoal(id: string): Promise<boolean> {
  ensureSeeded();
  const items = read<SavingGoal[]>(KEYS.goals, []);
  write(KEYS.goals, items.filter((g) => g.id !== id));
  return delay(true, 100);
}

// ---------------- Profile ----------------

export async function getProfile(): Promise<UserProfile> {
  ensureSeeded();
  return delay(read<UserProfile>(KEYS.profile, SEED_PROFILE));
}

export async function updateProfile(
  patch: Partial<UserProfile>
): Promise<UserProfile> {
  ensureSeeded();
  const current = read<UserProfile>(KEYS.profile, SEED_PROFILE);
  const next = { ...current, ...patch };
  write(KEYS.profile, next);
  return delay(next, 150);
}

// ---------------- Data management ----------------

export async function exportTransactionsCsv(): Promise<string> {
  const items = await listTransactions();
  const header = ["วันที่", "ประเภท", "หมวดหมู่", "ร้านค้า/แหล่งที่มา", "จำนวนเงิน", "บันทึก"];
  const rows = items.map((t) => [
    new Date(t.date).toLocaleDateString("th-TH"),
    t.type === "expense" ? "รายจ่าย" : "รายรับ",
    t.category,
    t.merchant,
    t.amount.toString(),
    t.note ?? "",
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  return "\uFEFF" + csv; // BOM so Excel opens Thai text correctly
}

export async function resetAllData(): Promise<void> {
  if (!isBrowser()) return;
  // ลบข้อมูลทั้งหมด
  Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  // ตั้ง seeded = "1" ทันที เพื่อกัน ensureSeeded() นำ mock data กลับมา
  window.localStorage.setItem(KEYS.seeded, "1");
  // เริ่มต้นด้วย collections ว่างเปล่า
  write(KEYS.transactions, []);
  write(KEYS.accounts, []);
  write(KEYS.goals, []);
}

export async function deleteAccount(): Promise<void> {
  return resetAllData();
}
