// Database service layer — Supabase backend
// Function signatures match the localStorage prototype so no consuming
// component needs to change.

import { supabase } from "@/lib/supabase";
import {
  Account,
  Budget,
  SavingGoal,
  Transaction,
  UserProfile,
} from "@/lib/types";

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("ไม่ได้เข้าสู่ระบบ");
  return session.user.id;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------- Transactions ----------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    merchant: row.merchant,
    category: row.category,
    accountId: row.account_id,
    date: row.date,
    note: row.note ?? undefined,
    source: row.source,
    bank: row.bank ?? undefined,
    // เผื่อคอลัมน์ status ยังไม่ถูกเพิ่มในบางฐานข้อมูล (ก่อนรัน migration v3)
    status: row.status ?? "completed",
    createdAt: row.created_at,
  };
}

export async function listTransactions(): Promise<Transaction[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToTransaction);
}

export async function createTransaction(
  input: Omit<Transaction, "id" | "createdAt">
): Promise<Transaction> {
  const userId = await getUserId();
  const id = uid("tx");
  const row = {
    id,
    user_id: userId,
    type: input.type,
    amount: input.amount,
    merchant: input.merchant,
    category: input.category,
    account_id: input.accountId,
    date: input.date,
    note: input.note,
    source: input.source,
    bank: input.bank,
    status: input.status ?? "completed",
  };
  const { data, error } = await supabase.from("transactions").insert(row).select().single();
  if (error) {
    // เผื่อกรณียังไม่ได้รัน supabase-migration-v3.sql (คอลัมน์ status ยังไม่มี)
    // ลองบันทึกใหม่โดยไม่ใส่ status เพื่อไม่ให้ฟีเจอร์เดิม (จดรายการ) ใช้งานไม่ได้
    if (error.code === "42703" || error.message?.includes("status")) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { status: _status, ...rowWithoutStatus } = row;
      const retry = await supabase.from("transactions").insert(rowWithoutStatus).select().single();
      if (retry.error) throw retry.error;
      return rowToTransaction(retry.data);
    }
    throw error;
  }
  return rowToTransaction(data);
}

export async function updateTransaction(
  id: string,
  patch: Partial<Transaction>
): Promise<Transaction | null> {
  const userId = await getUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowPatch: Record<string, any> = {};
  if (patch.type !== undefined) rowPatch.type = patch.type;
  if (patch.amount !== undefined) rowPatch.amount = patch.amount;
  if (patch.merchant !== undefined) rowPatch.merchant = patch.merchant;
  if (patch.category !== undefined) rowPatch.category = patch.category;
  if (patch.accountId !== undefined) rowPatch.account_id = patch.accountId;
  if (patch.date !== undefined) rowPatch.date = patch.date;
  if (patch.note !== undefined) rowPatch.note = patch.note;
  if (patch.source !== undefined) rowPatch.source = patch.source;
  if (patch.bank !== undefined) rowPatch.bank = patch.bank;
  if (patch.status !== undefined) rowPatch.status = patch.status;

  const { data, error } = await supabase
    .from("transactions")
    .update(rowPatch)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) return null;
  return rowToTransaction(data);
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

// ---------------- Accounts ----------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAccount(row: any): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    bank: row.bank ?? undefined,
    last4: row.last4 ?? undefined,
    colorFrom: row.color_from,
    colorTo: row.color_to,
  };
}

export async function listAccounts(): Promise<Account[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToAccount);
}

export async function createAccount(input: Omit<Account, "id">): Promise<Account> {
  const userId = await getUserId();
  const id = uid("acc");
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      id,
      user_id: userId,
      name: input.name,
      type: input.type,
      bank: input.bank ?? null,
      last4: input.last4 ?? null,
      color_from: input.colorFrom,
      color_to: input.colorTo,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToAccount(data);
}

export async function updateAccount(
  id: string,
  patch: Partial<Omit<Account, "id">>
): Promise<Account | null> {
  const userId = await getUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowPatch: Record<string, any> = {};
  if (patch.name !== undefined) rowPatch.name = patch.name;
  if (patch.type !== undefined) rowPatch.type = patch.type;
  if (patch.bank !== undefined) rowPatch.bank = patch.bank;
  if (patch.last4 !== undefined) rowPatch.last4 = patch.last4;
  if (patch.colorFrom !== undefined) rowPatch.color_from = patch.colorFrom;
  if (patch.colorTo !== undefined) rowPatch.color_to = patch.colorTo;

  const { data, error } = await supabase
    .from("accounts")
    .update(rowPatch)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) return null;
  return rowToAccount(data);
}

// หมายเหตุ: ตั้งชื่อ deleteFinancialAccount เพื่อไม่ให้สับสนกับ deleteAccount()
// ด้านล่าง ซึ่งหมายถึงการลบ "บัญชีผู้ใช้" (user account) ทั้งหมด ไม่ใช่บัญชีการเงิน
export async function deleteFinancialAccount(id: string): Promise<boolean> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

// ---------------- Budget ----------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBudget(row: any): Budget {
  return {
    id: row.id,
    month: row.month,
    totalLimit: row.total_limit,
    categoryLimits: row.category_limits ?? [],
    alertThresholds: row.alert_thresholds ?? [0.7, 0.9, 1.0],
  };
}

export async function getBudget(): Promise<Budget> {
  const userId = await getUserId();
  const month = new Date().toISOString().slice(0, 7);

  const { data } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  if (data) return rowToBudget(data);

  // สร้าง budget ว่างสำหรับเดือนนี้
  const id = uid("budget");
  const defaultBudget = {
    id,
    user_id: userId,
    month,
    total_limit: 30000,
    category_limits: [],
    alert_thresholds: [0.7, 0.9, 1.0],
  };
  await supabase.from("budgets").insert(defaultBudget);
  return {
    id,
    month,
    totalLimit: 30000,
    categoryLimits: [],
    alertThresholds: [0.7, 0.9, 1.0],
  };
}

export async function updateBudget(patch: Partial<Budget>): Promise<Budget> {
  const userId = await getUserId();
  const current = await getBudget();
  const next = { ...current, ...patch };

  await supabase
    .from("budgets")
    .update({
      total_limit: next.totalLimit,
      category_limits: next.categoryLimits,
      alert_thresholds: next.alertThresholds,
    })
    .eq("id", current.id)
    .eq("user_id", userId);

  return next;
}

// ---------------- Saving Goals ----------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToGoal(row: any): SavingGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    deadline: row.deadline ?? undefined,
    emoji: row.emoji,
    color: row.color,
  };
}

export async function listGoals(): Promise<SavingGoal[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("saving_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToGoal);
}

export async function createGoal(
  input: Omit<SavingGoal, "id">
): Promise<SavingGoal> {
  const userId = await getUserId();
  const id = uid("goal");
  const { data, error } = await supabase
    .from("saving_goals")
    .insert({
      id,
      user_id: userId,
      name: input.name,
      target_amount: input.targetAmount,
      current_amount: input.currentAmount,
      deadline: input.deadline,
      emoji: input.emoji,
      color: input.color,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToGoal(data);
}

export async function updateGoal(
  id: string,
  patch: Partial<SavingGoal>
): Promise<SavingGoal | null> {
  const userId = await getUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowPatch: Record<string, any> = {};
  if (patch.name !== undefined) rowPatch.name = patch.name;
  if (patch.targetAmount !== undefined) rowPatch.target_amount = patch.targetAmount;
  if (patch.currentAmount !== undefined) rowPatch.current_amount = patch.currentAmount;
  if (patch.deadline !== undefined) rowPatch.deadline = patch.deadline;
  if (patch.emoji !== undefined) rowPatch.emoji = patch.emoji;
  if (patch.color !== undefined) rowPatch.color = patch.color;

  const { data, error } = await supabase
    .from("saving_goals")
    .update(rowPatch)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) return null;
  return rowToGoal(data);
}

export async function deleteGoal(id: string): Promise<boolean> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("saving_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

// ---------------- Profile ----------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProfile(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    avatarEmoji: row.avatar_emoji,
    pinEnabled: row.pin_enabled,
    biometricEnabled: row.biometric_enabled,
    currency: row.currency,
    locale: row.locale,
    onboarded: row.onboarded,
  };
}

export async function getProfile(): Promise<UserProfile> {
  const userId = await getUserId();
  const { data: { session } } = await supabase.auth.getSession();
  const email = session?.user?.email;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (data) return rowToProfile(data);

  // สร้าง profile ใหม่สำหรับผู้ใช้ที่ลงทะเบียนครั้งแรก
  const newProfile = {
    id: userId,
    name: email?.split("@")[0] ?? "ผู้ใช้ใหม่",
    email: email,
    avatar_emoji: "😊",
    pin_enabled: false,
    biometric_enabled: false,
    currency: "THB",
    locale: "th",
    onboarded: false,
  };
  await supabase.from("profiles").insert(newProfile);

  // สร้างบัญชีเงินสดเริ่มต้น
  await supabase.from("accounts").insert({
    id: uid("acc"),
    user_id: userId,
    name: "เงินสด",
    type: "cash",
    color_from: "#FFD64F",
    color_to: "#E78132",
  });

  return {
    id: userId,
    name: newProfile.name,
    email: email,
    avatarEmoji: "😊",
    pinEnabled: false,
    biometricEnabled: false,
    currency: "THB",
    locale: "th",
    onboarded: false,
  };
}

export async function updateProfile(
  patch: Partial<UserProfile>
): Promise<UserProfile> {
  const userId = await getUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowPatch: Record<string, any> = {};
  if (patch.name !== undefined) rowPatch.name = patch.name;
  if (patch.email !== undefined) rowPatch.email = patch.email;
  if (patch.phone !== undefined) rowPatch.phone = patch.phone;
  if (patch.avatarEmoji !== undefined) rowPatch.avatar_emoji = patch.avatarEmoji;
  if (patch.pinEnabled !== undefined) rowPatch.pin_enabled = patch.pinEnabled;
  if (patch.biometricEnabled !== undefined) rowPatch.biometric_enabled = patch.biometricEnabled;
  if (patch.onboarded !== undefined) rowPatch.onboarded = patch.onboarded;

  const { data } = await supabase
    .from("profiles")
    .update(rowPatch)
    .eq("id", userId)
    .select()
    .single();

  if (data) return rowToProfile(data);
  const current = await getProfile();
  return { ...current, ...patch };
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
  return "﻿" + csv;
}

export async function resetAllData(): Promise<void> {
  const userId = await getUserId();
  await Promise.all([
    supabase.from("transactions").delete().eq("user_id", userId),
    supabase.from("saving_goals").delete().eq("user_id", userId),
    supabase.from("budgets").delete().eq("user_id", userId),
  ]);
}

export async function deleteAccount(): Promise<void> {
  const userId = await getUserId();
  await Promise.all([
    supabase.from("transactions").delete().eq("user_id", userId),
    supabase.from("accounts").delete().eq("user_id", userId),
    supabase.from("saving_goals").delete().eq("user_id", userId),
    supabase.from("budgets").delete().eq("user_id", userId),
    supabase.from("profiles").delete().eq("id", userId),
  ]);
  await supabase.auth.signOut();
}
