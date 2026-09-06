"use client";

import { Camera, Upload, MinusCircle, PlusCircle, CreditCard, X } from "lucide-react";

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const OPTIONS = [
  {
    icon: Camera,
    label: "ถ่ายภาพสลิป",
    desc: "ถ่ายสลิปแล้วให้น้องออมอ่านให้",
    path: "/scan?mode=camera",
    bg: "#FFD64F",
    fg: "#00233D",
  },
  {
    icon: Upload,
    label: "อัปโหลดสลิป",
    desc: "เลือกรูปสลิปจากเครื่อง",
    path: "/scan?mode=upload",
    bg: "#EAF1F7",
    fg: "#1689F5",
  },
  {
    icon: MinusCircle,
    label: "เพิ่มรายจ่ายเอง",
    desc: "กรอกรายละเอียดด้วยตัวเอง",
    path: "/add/expense",
    bg: "#FDE4DE",
    fg: "#F36B5F",
  },
  {
    icon: PlusCircle,
    label: "เพิ่มรายรับ",
    desc: "บันทึกเงินเดือนหรือรายรับอื่น ๆ",
    path: "/add/income",
    bg: "#DCF5E9",
    fg: "#20B978",
  },
  {
    icon: CreditCard,
    label: "เพิ่มรายการบัตรเครดิต",
    desc: "บันทึกยอดใช้จ่ายผ่านบัตร",
    path: "/add/credit-card",
    bg: "#EDE3F7",
    fg: "#4E2E7F",
  },
];

export function AddTransactionSheet({ open, onClose, onNavigate }: AddTransactionSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="ปิด"
        onClick={onClose}
        className="absolute inset-0 bg-ag-navy/50 ag-animate-fade"
      />
      <div className="relative z-10 w-full max-w-[480px] rounded-t-[28px] bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] ag-animate-slide-up">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ag-grayblue" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ag-text">จดรายการเพิ่ม</h2>
          <button onClick={onClose} aria-label="ปิดหน้าต่าง" className="rounded-full p-1.5 active:bg-ag-grayblue">
            <X size={22} color="#71818E" />
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.label}
                onClick={() => onNavigate(opt.path)}
                className="flex items-center gap-4 rounded-2xl border border-ag-grayblue p-3.5 text-left transition-transform active:scale-[0.98] active:bg-ag-grayblue/40"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: opt.bg }}
                >
                  <Icon size={22} color={opt.fg} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="font-bold text-ag-text">{opt.label}</p>
                  <p className="text-xs text-ag-text-secondary">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
