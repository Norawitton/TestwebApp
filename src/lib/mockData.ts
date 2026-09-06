import { Account, Budget, SavingGoal, Transaction, UserProfile } from "./types";

// ---------- Accounts ----------
export const SEED_ACCOUNTS: Account[] = [
  {
    id: "acc-kbank",
    name: "กสิกรไทย ออมทรัพย์",
    type: "bank",
    bank: "kbank",
    last4: "4821",
    colorFrom: "#0B8342",
    colorTo: "#0D5C33",
  },
  {
    id: "acc-scb-credit",
    name: "SCB บัตรเครดิต",
    type: "credit_card",
    bank: "scb",
    last4: "7790",
    colorFrom: "#4E2E7F",
    colorTo: "#2E1B4D",
  },
  {
    id: "acc-cash",
    name: "เงินสด",
    type: "cash",
    colorFrom: "#E78132",
    colorTo: "#B85F1D",
  },
  {
    id: "acc-truemoney",
    name: "TrueMoney Wallet",
    type: "e_wallet",
    colorFrom: "#1689F5",
    colorTo: "#0A5BC4",
  },
];

// ---------- Transactions ----------
// Helper to build an ISO date relative to "today" in this prototype.
function daysAgo(n: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const SEED_TRANSACTIONS: Transaction[] = [
  { id: "t1", type: "expense", amount: 65, merchant: "ร้านกาแฟ อรุณอมฤต", category: "food", accountId: "acc-truemoney", date: daysAgo(0, 8, 15), source: "manual", createdAt: daysAgo(0, 8, 15) },
  { id: "t2", type: "expense", amount: 320, merchant: "Grab - เดินทางไปทำงาน", category: "transport", accountId: "acc-scb-credit", date: daysAgo(0, 8, 40), bank: "scb", source: "credit_card", createdAt: daysAgo(0, 8, 40) },
  { id: "t3", type: "expense", amount: 145, merchant: "ส้มตำนัว", category: "food", accountId: "acc-cash", date: daysAgo(0, 12, 30), source: "manual", createdAt: daysAgo(0, 12, 30) },
  { id: "t4", type: "expense", amount: 89, merchant: "7-Eleven สาขาอารีย์", category: "food", accountId: "acc-truemoney", date: daysAgo(1, 19, 10), source: "slip_scan", bank: "kbank", note: "ของกินเล่นตอนเย็น", createdAt: daysAgo(1, 19, 10) },
  { id: "t5", type: "expense", amount: 1290, merchant: "Big C สาขาลาดพร้าว", category: "shopping", accountId: "acc-scb-credit", date: daysAgo(1, 18, 5), bank: "scb", source: "credit_card", createdAt: daysAgo(1, 18, 5) },
  { id: "t6", type: "income", amount: 32000, merchant: "เงินเดือนบริษัท ABC จำกัด", category: "income", accountId: "acc-kbank", date: daysAgo(2, 9, 0), source: "manual", createdAt: daysAgo(2, 9, 0) },
  { id: "t7", type: "expense", amount: 450, merchant: "ค่าไฟฟ้า (กฟน.)", category: "utilities", accountId: "acc-kbank", date: daysAgo(2, 14, 0), source: "manual", createdAt: daysAgo(2, 14, 0) },
  { id: "t8", type: "expense", amount: 199, merchant: "Netflix", category: "shopping", accountId: "acc-scb-credit", date: daysAgo(3, 0, 5), bank: "scb", source: "credit_card", createdAt: daysAgo(3, 0, 5) },
  { id: "t9", type: "expense", amount: 60, merchant: "วินมอเตอร์ไซค์ ปากซอย", category: "transport", accountId: "acc-cash", date: daysAgo(3, 8, 20), source: "manual", createdAt: daysAgo(3, 8, 20) },
  { id: "t10", type: "expense", amount: 780, merchant: "คลินิกหมอฟัน สไมล์เดนท์", category: "health", accountId: "acc-kbank", date: daysAgo(4, 16, 0), bank: "kbank", source: "slip_scan", createdAt: daysAgo(4, 16, 0) },
  { id: "t11", type: "expense", amount: 175, merchant: "ก๋วยเตี๋ยวเรือ ป้าแดง", category: "food", accountId: "acc-cash", date: daysAgo(4, 12, 15), source: "manual", createdAt: daysAgo(4, 12, 15) },
  { id: "t12", type: "expense", amount: 2400, merchant: "ค่าเช่าหอพัก", category: "housing", accountId: "acc-kbank", date: daysAgo(5, 10, 0), source: "manual", note: "ค่าเช่าเดือนนี้", createdAt: daysAgo(5, 10, 0) },
  { id: "t13", type: "expense", amount: 340, merchant: "Lazada - อุปกรณ์เขียนหนังสือ", category: "shopping", accountId: "acc-scb-credit", date: daysAgo(5, 21, 30), bank: "scb", source: "credit_card", createdAt: daysAgo(5, 21, 30) },
  { id: "t14", type: "expense", amount: 55, merchant: "BTS สายสุขุมวิท", category: "transport", accountId: "acc-truemoney", date: daysAgo(6, 8, 0), source: "manual", createdAt: daysAgo(6, 8, 0) },
  { id: "t15", type: "expense", amount: 129, merchant: "ชาไข่มุก เพิร์ลมิลค์ที", category: "food", accountId: "acc-truemoney", date: daysAgo(6, 15, 45), source: "manual", createdAt: daysAgo(6, 15, 45) },
  { id: "t16", type: "expense", amount: 890, merchant: "คอร์สเรียนภาษาอังกฤษออนไลน์", category: "education", accountId: "acc-scb-credit", date: daysAgo(7, 20, 0), bank: "scb", source: "credit_card", createdAt: daysAgo(7, 20, 0) },
  { id: "t17", type: "expense", amount: 250, merchant: "ค่าน้ำประปา", category: "utilities", accountId: "acc-kbank", date: daysAgo(8, 9, 30), source: "manual", createdAt: daysAgo(8, 9, 30) },
  { id: "t18", type: "expense", amount: 480, merchant: "ร้านอาหารญี่ปุ่น ซากุระ", category: "food", accountId: "acc-scb-credit", date: daysAgo(8, 19, 0), bank: "scb", source: "slip_scan", createdAt: daysAgo(8, 19, 0) },
  { id: "t19", type: "expense", amount: 1500, merchant: "ค่าโทรศัพท์และเน็ตบ้าน", category: "utilities", accountId: "acc-kbank", date: daysAgo(9, 11, 0), source: "manual", createdAt: daysAgo(9, 11, 0) },
  { id: "t20", type: "expense", amount: 220, merchant: "ฟิตเนสรายเดือน", category: "health", accountId: "acc-scb-credit", date: daysAgo(10, 6, 30), bank: "scb", source: "credit_card", createdAt: daysAgo(10, 6, 30) },
  { id: "t21", type: "expense", amount: 95, merchant: "ข้าวมันไก่ ป้าทองสุก", category: "food", accountId: "acc-cash", date: daysAgo(10, 12, 0), source: "manual", createdAt: daysAgo(10, 12, 0) },
  { id: "t22", type: "expense", amount: 599, merchant: "Uniqlo สยามพารากอน", category: "shopping", accountId: "acc-scb-credit", date: daysAgo(11, 17, 30), bank: "scb", source: "credit_card", createdAt: daysAgo(11, 17, 30) },
  { id: "t23", type: "income", amount: 3500, merchant: "งานฟรีแลนซ์ออกแบบโลโก้", category: "income", accountId: "acc-kbank", date: daysAgo(12, 14, 0), source: "manual", createdAt: daysAgo(12, 14, 0) },
  { id: "t24", type: "expense", amount: 150, merchant: "Grab Food - ส้มตำ", category: "food", accountId: "acc-truemoney", date: daysAgo(13, 19, 20), source: "manual", createdAt: daysAgo(13, 19, 20) },
  { id: "t25", type: "expense", amount: 40, merchant: "วินมอเตอร์ไซค์", category: "transport", accountId: "acc-cash", date: daysAgo(14, 8, 10), source: "manual", createdAt: daysAgo(14, 8, 10) },
];

// ---------- Budget ----------
function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const SEED_BUDGET: Budget = {
  id: "budget-current",
  month: currentMonthKey(),
  totalLimit: 18000,
  categoryLimits: [
    { category: "food", limit: 6000 },
    { category: "transport", limit: 2500 },
    { category: "shopping", limit: 3000 },
    { category: "housing", limit: 2400 },
    { category: "utilities", limit: 2500 },
    { category: "health", limit: 1000 },
    { category: "education", limit: 1000 },
    { category: "other", limit: 600 },
  ],
  alertThresholds: [0.7, 0.9, 1.0],
};

// ---------- Saving goals ----------
export const SEED_GOALS: SavingGoal[] = [
  {
    id: "goal-trip",
    name: "ทริปเที่ยวญี่ปุ่น",
    targetAmount: 30000,
    currentAmount: 12500,
    deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 4, 1).toISOString(),
    emoji: "🗻",
    color: "#1689F5",
  },
  {
    id: "goal-emergency",
    name: "เงินสำรองฉุกเฉิน",
    targetAmount: 50000,
    currentAmount: 31000,
    emoji: "🛟",
    color: "#20B978",
  },
  {
    id: "goal-gadget",
    name: "เปลี่ยนโทรศัพท์ใหม่",
    targetAmount: 25000,
    currentAmount: 6200,
    deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 6, 1).toISOString(),
    emoji: "📱",
    color: "#E78132",
  },
];

// ---------- Profile ----------
export const SEED_PROFILE: UserProfile = {
  id: "user-1",
  name: "คุณนนท์",
  email: "non.saver@example.com",
  phone: "081-234-5678",
  avatarEmoji: "🧑",
  pinEnabled: true,
  biometricEnabled: false,
  currency: "THB",
  locale: "th",
  onboarded: false,
};
