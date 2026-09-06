import { Category, CategoryId } from "./types";

export const CATEGORIES: Record<CategoryId, Category> = {
  food: {
    id: "food",
    label: "อาหารและเครื่องดื่ม",
    labelEn: "Food & Drink",
    color: "#E78132",
    icon: "UtensilsCrossed",
  },
  transport: {
    id: "transport",
    label: "เดินทาง",
    labelEn: "Transport",
    color: "#1689F5",
    icon: "Car",
  },
  shopping: {
    id: "shopping",
    label: "ช้อปปิ้ง",
    labelEn: "Shopping",
    color: "#F36B5F",
    icon: "ShoppingBag",
  },
  housing: {
    id: "housing",
    label: "ที่อยู่อาศัย",
    labelEn: "Housing",
    color: "#00233D",
    icon: "Home",
  },
  utilities: {
    id: "utilities",
    label: "ค่าสาธารณูปโภค",
    labelEn: "Utilities",
    color: "#71818E",
    icon: "Zap",
  },
  health: {
    id: "health",
    label: "สุขภาพ",
    labelEn: "Health",
    color: "#20B978",
    icon: "HeartPulse",
  },
  education: {
    id: "education",
    label: "การศึกษา",
    labelEn: "Education",
    color: "#FFD64F",
    icon: "GraduationCap",
  },
  investment: {
    id: "investment",
    label: "การลงทุน",
    labelEn: "Investment",
    color: "#6C63FF",
    icon: "TrendingUp",
  },
  income: {
    id: "income",
    label: "รายรับ",
    labelEn: "Income",
    color: "#20B978",
    icon: "Wallet",
  },
  other: {
    id: "other",
    label: "อื่น ๆ",
    labelEn: "Other",
    color: "#EAF1F7",
    icon: "MoreHorizontal",
  },
};

export const EXPENSE_CATEGORY_LIST: CategoryId[] = [
  "food",
  "transport",
  "shopping",
  "housing",
  "utilities",
  "health",
  "education",
  "investment",
  "other",
];

export const BANKS: Record<string, { name: string; color: string }> = {
  kbank: { name: "ธนาคารกสิกรไทย", color: "#0B8342" },
  scb: { name: "ธนาคารไทยพาณิชย์", color: "#4E2E7F" },
  bbl: { name: "ธนาคารกรุงเทพ", color: "#1E4598" },
  ktb: { name: "ธนาคารกรุงไทย", color: "#1BA5E1" },
  ttb: { name: "ธนาคารทีทีบี", color: "#F5A800" },
  gsb: { name: "ธนาคารออมสิน", color: "#EB198D" },
  krungsri: { name: "ธนาคารกรุงศรีอยุธยา", color: "#FEC43B" },
  other: { name: "ธนาคารอื่น ๆ", color: "#71818E" },
};
