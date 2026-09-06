"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, ImagePlus, X } from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { scanSlip } from "@/lib/services/ocr";
import { SlipOcrResult } from "@/lib/types";
import { SlipReviewSheet } from "@/components/transactions/SlipReviewSheet";

type ScanState = "idle" | "scanning" | "done" | "error";

export default function ScanSlipPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ag-navy" />}>
      <ScanSlipInner />
    </Suspense>
  );
}

function ScanSlipInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "upload" ? "upload" : "camera";

  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<SlipOcrResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // input สำหรับกล้อง/ไฟล์
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleButtonClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // แสดง preview รูปภาพ
    const dataUrl = await readFileAsDataUrl(file);
    setPreviewUrl(dataUrl);
    setState("scanning");

    try {
      const ocrResult = await scanSlip({ imageDataUrl: dataUrl });
      // ถ้า ocrResult เป็น null/0 amount → ยังเปิด review sheet ให้กรอกเอง
      setResult(ocrResult ?? {
        amount: 0,
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        merchant: "",
        bank: "other",
        suggestedCategory: "other",
        refNumber: "",
        confidence: 0,
      });
      setState("done");
    } catch {
      setState("error");
    }
    // reset input เพื่อให้เลือกรูปใหม่ได้
    e.target.value = "";
  }

  function handleRetry() {
    setPreviewUrl(null);
    setState("idle");
    setResult(null);
  }

  return (
    <div className="relative min-h-screen bg-ag-navy">
      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={mode === "camera" ? "environment" : undefined}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between px-4 pt-5">
        <button
          onClick={() => router.back()}
          aria-label="ปิด"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
        >
          <X size={22} color="#FFFDF7" />
        </button>
        <p className="text-sm font-semibold text-white/80">
          {mode === "camera" ? "ถ่ายภาพสลิป" : "อัปโหลดสลิป"}
        </p>
        <div className="w-10" />
      </div>

      {/* Framing guide / preview */}
      <div className="flex flex-col items-center justify-center px-10 pt-14">
        <div className="relative flex h-[360px] w-full max-w-[300px] items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-white/40">
          {/* Corner decorations */}
          <div className="pointer-events-none absolute left-3 top-3 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-ag-yellow z-10" />
          <div className="pointer-events-none absolute right-3 top-3 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-ag-yellow z-10" />
          <div className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-ag-yellow z-10" />
          <div className="pointer-events-none absolute bottom-3 right-3 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-ag-yellow z-10" />

          {/* Preview image */}
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="สลิป"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {state === "scanning" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ag-navy/60">
              <div className="ag-animate-float">
                <Mascot pose="peek" size={72} />
              </div>
              <p className="text-sm font-semibold text-white/90">น้องออมกำลังอ่านสลิป...</p>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-full origin-left animate-[ag-slide-up_1.4s_ease-in-out_infinite] bg-ag-yellow" />
              </div>
            </div>
          )}

          {state === "idle" && !previewUrl && (
            <p className="max-w-[200px] text-center text-sm text-white/60">
              {mode === "camera"
                ? "กดปุ่มด้านล่างเพื่อถ่ายภาพสลิป"
                : "กดปุ่มด้านล่างเพื่อเลือกรูปสลิปจากคลัง"}
            </p>
          )}
        </div>

        {state === "idle" && (
          <button
            onClick={handleButtonClick}
            className="mt-10 flex h-20 w-20 items-center justify-center rounded-full bg-white ag-animate-pulse-ring active:scale-90"
            aria-label={mode === "camera" ? "ถ่ายภาพ" : "เลือกรูปภาพ"}
          >
            {mode === "camera" ? (
              <Camera size={30} color="#00233D" />
            ) : (
              <ImagePlus size={30} color="#00233D" />
            )}
          </button>
        )}

        {state === "error" && (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <Mascot pose="worried" size={64} />
            <p className="text-sm text-white/80">อ่านสลิปไม่สำเร็จ ลองอีกครั้งนะครับ</p>
            <button
              onClick={handleRetry}
              className="rounded-2xl bg-ag-yellow px-5 py-2.5 text-sm font-bold text-ag-navy active:scale-95"
            >
              ลองอีกครั้ง
            </button>
          </div>
        )}
      </div>

      {state === "done" && result && (
        <SlipReviewSheet
          result={result}
          onClose={() => router.push("/home")}
          onSaved={() => router.push("/home")}
        />
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
