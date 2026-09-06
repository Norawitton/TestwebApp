"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import {
  IllustrationQuickEntry,
  IllustrationSpendingClarity,
  IllustrationPlanSave,
} from "@/components/illustrations/Illustrations";
import { updateProfile } from "@/lib/services/database";
import { RequireAuth } from "@/components/auth/RequireAuth";

const SLIDES = [
  {
    title: "จดรายรับรายจ่ายได้ในไม่กี่วินาที",
    body: "กดปุ่ม + เลือกหมวดหมู่ที่ต้องการ ใส่จำนวนเงิน แค่นี้ก็บันทึกเสร็จ ไม่ต้องพิมพ์ยาวๆ",
    illustration: IllustrationQuickEntry,
    bg: "#FFED9A",
  },
  {
    title: "เห็นชัดว่าเงินหายไปไหน",
    body: "กราฟสรุปรายจ่ายตามหมวดหมู่ ช่วยให้คุณรู้ทันทีว่าเดือนนี้ใช้เงินไปกับอะไรมากที่สุด",
    illustration: IllustrationSpendingClarity,
    bg: "#EAF1F7",
  },
  {
    title: "วางแผนง่าย เก็บเงินได้จริง",
    body: "ตั้งงบประมาณ สร้างเป้าหมายการออม แล้วให้น้องออมช่วยเตือนก่อนเงินจะหมดเดือน",
    illustration: IllustrationPlanSave,
    bg: "#FFD64F",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];
  const Illustration = slide.illustration;

  async function handleStart() {
    if (starting) return;
    setStarting(true);
    setStartError("");
    try {
      await updateProfile({ onboarded: true });
      router.push("/home");
    } catch {
      // เดิม updateProfile() คืน "สำเร็จ" ปลอมตอน error ทำให้ผู้ใช้เข้าหน้า
      // /home ได้ในเซสชันนั้น แต่ DB ยังเป็น onboarded: false อยู่ — เปิดแอพ
      // ใหม่ครั้งหน้า src/app/page.tsx จะเช็คแล้วเด้งกลับมา /onboarding อีก
      // โดยไม่มีคำอธิบาย เช็ค error แล้วให้ลองใหม่แทน
      setStartError("เริ่มต้นใช้งานไม่สำเร็จ ลองใหม่อีกครั้ง");
      setStarting(false);
    }
  }

  return (
    <RequireAuth>
    <div
      className="flex min-h-screen flex-col transition-colors duration-500"
      style={{ backgroundColor: slide.bg }}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div key={index} className="ag-animate-slide-up">
          <Illustration size={220} />
        </div>
        <h1 key={`t-${index}`} className="ag-animate-slide-up mt-8 text-2xl font-bold leading-snug text-ag-navy">
          {slide.title}
        </h1>
        <p key={`b-${index}`} className="ag-animate-slide-up mt-3 max-w-[300px] text-sm leading-relaxed text-ag-text/80">
          {slide.body}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 px-8 pb-10">
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`ไปหน้าที่ ${i + 1}`}
              className={clsx(
                "h-2 rounded-full transition-all",
                i === index ? "w-6 bg-ag-navy" : "w-2 bg-ag-navy/25"
              )}
            />
          ))}
        </div>

        {startError && <p className="text-xs font-semibold text-ag-coral">{startError}</p>}

        {isLast ? (
          <Button variant="navy" size="lg" fullWidth onClick={handleStart} disabled={starting}>
            {starting ? "กำลังเริ่มต้น..." : "เริ่มต้นใช้งาน"}
          </Button>
        ) : (
          <div className="flex w-full gap-3">
            <button
              onClick={handleStart}
              disabled={starting}
              className="h-14 flex-1 rounded-2xl text-sm font-bold text-ag-navy/60 active:opacity-60 disabled:opacity-50"
            >
              ข้าม
            </button>
            <Button variant="navy" size="lg" className="flex-[2]" onClick={() => setIndex(index + 1)}>
              ถัดไป
            </Button>
          </div>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}
