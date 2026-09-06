// AomGun (ออมกัน) — core data model
// Designed so localStorage-backed prototype data can later be swapped
// 1:1 for Supabase/Firebase records without changing consuming components.

export type TransactionType = "expense" | "income";

export type CategoryId =
  | "food"
  | "transport"
  | "shopping"
  | "housing"
  | "utilities"
  | "health"
  | "education"
  | "income"
  | "other";

export interface Category {
  id: CategoryId;
  label: string; // Thai display label
  labelEn: string;
  color: string; // hex, used in charts + icon chips
  icon: string; // lucide-react icon name, resolved by a lookup map
}

export type AccountType = "cash" | "bank" | "credit_card" | "e_wallet";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bank?: BankId;
  last4?: string;
  colorFrom: string;
  colorTo: string;
}

export type BankId =
  | "kbank"
  | "scb"
  | "bbl"
  | "ktb"
  | "ttb"
  | "gsb"
  | "krungsri"
  | "other";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // always positive; sign implied by `type`
  merchant: string;
  category: CategoryId;
  accountId: string;
  date: string; // ISO 8601
  note?: string;
  source: "manual" | "slip_scan" | "credit_card";
  bank?: BankId;
  createdAt: string;
}

export interface CategoryBudget {
  category: CategoryId;
  limit: number;
}

export interface Budget {
  id: string;
  month: string; // "2026-09"
  totalLimit: number;
  categoryLimits: CategoryBudget[];
  alertThresholds: number[]; // e.g. [0.7, 0.9, 1.0]
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO date
  emoji: string;
  color: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarEmoji: string;
  pinEnabled: boolean;
  biometricEnabled: boolean;
  currency: "THB";
  locale: "th" | "en";
  onboarded: boolean;
}

export interface SlipOcrResult {
  amount: number;
  date: string;
  time: string;
  merchant: string;
  bank: BankId;
  suggestedCategory: CategoryId;
  refNumber?: string;
  confidence: number; // 0-1
}

export interface MascotTip {
  id: string;
  message: string;
  tone: "info" | "warning" | "success" | "encourage";
}
