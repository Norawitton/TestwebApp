// OCR service layer.
//
// ส่งรูปสลิปไปที่ /api/scan-slip ซึ่งใช้ Claude Vision อ่านข้อมูล
// ถ้าไม่มี ANTHROPIC_API_KEY → คืนค่า null เพื่อให้ผู้ใช้กรอกเอง

import { SlipOcrResult } from "@/lib/types";

export interface ScanSlipInput {
  imageDataUrl?: string;
}

const EMPTY_RESULT: SlipOcrResult = {
  amount: 0,
  date: new Date().toISOString(),
  time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
  merchant: "",
  bank: "other",
  suggestedCategory: "other",
  refNumber: "",
  confidence: 0,
};

export async function scanSlip(input: ScanSlipInput): Promise<SlipOcrResult | null> {
  if (!input.imageDataUrl) {
    // ไม่มีรูป → คืน null ให้กรอกเอง
    return null;
  }

  try {
    const res = await fetch("/api/scan-slip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: input.imageDataUrl }),
    });

    if (!res.ok) return EMPTY_RESULT;

    const { result } = await res.json();
    if (!result) return EMPTY_RESULT; // ไม่มี API key → กรอกเอง

    return result as SlipOcrResult;
  } catch {
    return EMPTY_RESULT;
  }
}
