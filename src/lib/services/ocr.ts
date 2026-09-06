// OCR service layer.
//
// In production this module would POST the slip image to a real OCR/vision
// endpoint (e.g. a bank-slip-reader API or a Claude vision call) and map its
// response into a SlipOcrResult. For this prototype it returns randomized
// but realistic mock data after a short delay, so the rest of the app
// (review screen, categorization, save flow) can be built and tested against
// a stable interface.

import { BankId, CategoryId, SlipOcrResult } from "@/lib/types";

const MOCK_MERCHANTS: { merchant: string; category: CategoryId }[] = [
  { merchant: "ร้านกาแฟ คิวช่า คาเฟ่", category: "food" },
  { merchant: "เซเว่น อีเลฟเว่น สาขาทองหล่อ", category: "food" },
  { merchant: "Grab - ค่าเดินทาง", category: "transport" },
  { merchant: "ร้านอาหารตามสั่ง ป้านิด", category: "food" },
  { merchant: "Lotus's Go Fresh", category: "shopping" },
  { merchant: "ค่าไฟฟ้า การไฟฟ้านครหลวง", category: "utilities" },
];

const MOCK_BANKS: BankId[] = ["kbank", "scb", "bbl", "ktb"];

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface ScanSlipInput {
  // In production: image file/blob. Kept loose for the mock.
  imageDataUrl?: string;
}

export async function scanSlip(_input: ScanSlipInput): Promise<SlipOcrResult> {
  const pick = randomOf(MOCK_MERCHANTS);
  const now = new Date();

  await new Promise((resolve) => setTimeout(resolve, 1400 + Math.random() * 600));

  return {
    amount: Math.round((Math.random() * 450 + 40) * 100) / 100,
    date: now.toISOString(),
    time: now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    merchant: pick.merchant,
    bank: randomOf(MOCK_BANKS),
    suggestedCategory: pick.category,
    refNumber: `AG${Math.floor(Math.random() * 900000 + 100000)}`,
    confidence: 0.85 + Math.random() * 0.13,
  };
}
