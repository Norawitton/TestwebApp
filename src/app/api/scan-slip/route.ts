import { NextRequest, NextResponse } from "next/server";

// ใช้ Claude Vision อ่านสลิปโอนเงินไทย
// ต้องตั้ง ANTHROPIC_API_KEY ใน Vercel Environment Variables
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // ไม่มี API key → คืนค่า null เพื่อให้ผู้ใช้กรอกเอง
    return NextResponse.json({ result: null });
  }

  let imageDataUrl: string;
  try {
    const body = await req.json();
    imageDataUrl = body.imageDataUrl;
    if (!imageDataUrl) throw new Error("no image");
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  // แยก mime type และ base64 data
  const match = imageDataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "invalid image format" }, { status: 400 });
  }
  const mediaType = match[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  const base64Data = match[2];

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            {
              type: "text",
              text: `อ่านข้อมูลจากสลิปโอนเงินไทยนี้แล้วตอบเป็น JSON ดังนี้:
{
  "amount": <จำนวนเงิน เป็นตัวเลข>,
  "merchant": "<ชื่อผู้รับเงิน/บัญชีปลายทาง>",
  "bank": "<รหัสธนาคาร: kbank|scb|bbl|ktb|gsb|bay|ttb|uob|lhb|other>",
  "date": "<วันที่ ISO8601 format>",
  "time": "<เวลา HH:MM>",
  "refNumber": "<เลขอ้างอิง>",
  "category": "<หมวดหมู่: food|transport|shopping|health|entertainment|utilities|education|investment|other>"
}
ถ้าอ่านไม่ออกหรือไม่แน่ใจให้ใส่ null สำหรับฟิลด์นั้น ตอบแค่ JSON เท่านั้น ไม่ต้องมีคำอธิบาย`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    // ลบ markdown code block ถ้ามี
    const jsonText = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ result: null });
    }

    const now = new Date().toISOString();
    const result = {
      amount: typeof parsed.amount === "number" ? parsed.amount : 0,
      merchant: typeof parsed.merchant === "string" ? parsed.merchant : "ไม่ทราบ",
      bank: typeof parsed.bank === "string" ? parsed.bank : "other",
      date: typeof parsed.date === "string" ? parsed.date : now,
      time: typeof parsed.time === "string" ? parsed.time : "00:00",
      refNumber: typeof parsed.refNumber === "string" ? parsed.refNumber : "",
      suggestedCategory: typeof parsed.category === "string" ? parsed.category : "other",
      confidence: 0.9,
    };

    return NextResponse.json({ result });
  } catch (err) {
    console.error("Claude Vision error:", err);
    return NextResponse.json({ result: null });
  }
}
