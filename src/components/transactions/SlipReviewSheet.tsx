"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { CategoryId, SlipOcrResult } from "@/lib/types";
import { CATEGORIES, BANKS, EXPENSE_CATEGORY_LIST } from "@/lib/categories";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/hooks/useAppData";
import { formatThaiDateFull } from "@/lib/format";
import { Mascot } from "@/components/mascot/Mascot";
import { CheckCircle2 } from "lucide-react";

interface SlipReviewSheetProps {
  result: SlipOcrResult;
  onClose: () => void;
  onSaved: () => void;
}

export function SlipReviewSheet({ result, onSaved }: SlipReviewSheetProps) {
  const { accounts, addTransaction } = useAppData();
  const hasOcrData = result.confidence > 0;
  const [amount, setAmount] = useState(result.amount > 0 ? result.amount.toString() : "");
  const [merchant, setMerchant] = useState(result.merchant);
  const [category, setCategory] = useState<CategoryId>(result.suggestedCategory);
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [amountError, setAmountError] = useState<string | undefined>();

  async function handleSave() {
    const numeric = Number(amount);
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      setAmountError("กรุณากรอกจำนวนเงินให้ถูกต้อง");
      return;
    }
    setSaving(true);
    await addTransaction({
      type: "expense",
      amount: numeric,
      merchant: merchant.trim() || "รายการจากสลิป",
      category,
      accountId: accountId || accounts[0]?.id || "acc-cash",
      date: result.date,
      note: note.trim() || undefined,
      source: "slip_scan",
      bank: result.bank,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(onSaved, 900);
  }

  if (saved) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ag-navy/70">
        <div className="ag-animate-slide-up flex flex-col items-center gap-3 rounded-[28px] bg-white px-10 py-10">
          <Mascot pose="cheer" size={90} />
          <p className="flex items-center gap-1.5 font-bold text-ag-text">
            <CheckCircle2 size={18} color="#20B978" /> บันทึกรายการเรียบร้อย!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-ag-navy/50" />
      <div className="relative z-10 max-h-[88vh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] bg-white p-5 pb-8 ag-animate-slide-up">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ag-grayblue" />

        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-ag-yellow-soft p-3">
          <Mascot pose="coin" size={48} />
          <p className="text-sm font-medium text-ag-navy">
            {hasOcrData
              ? "น้องออมอ่านสลิปให้แล้ว ลองตรวจสอบข้อมูลอีกครั้งก่อนบันทึกนะครับ"
              : "กรอกข้อมูลรายการจากสลิปด้วยตัวเองได้เลยครับ"}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">จำนวนเงิน</label>
            <div className="flex items-center gap-1 rounded-2xl border border-ag-grayblue bg-white px-4 py-2.5">
              <span className="ag-money text-lg font-bold text-ag-text-secondary">฿</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value.replace(/[^\d.]/g, ""));
                  setAmountError(undefined);
                }}
                className="ag-money w-full bg-transparent text-lg font-bold text-ag-text outline-none"
              />
            </div>
            {amountError && <p className="mt-1 text-xs font-semibold text-ag-coral">{amountError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ag-text">วันที่และเวลา</label>
              <div className="flex h-11 items-center rounded-2xl border border-ag-grayblue px-3 text-sm text-ag-text">
                {formatThaiDateFull(result.date)}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ag-text">เวลา</label>
              <div className="flex h-11 items-center rounded-2xl border border-ag-grayblue px-3 text-sm text-ag-text">
                {result.time} น.
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">ผู้รับเงิน / ชื่อร้านค้า</label>
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">ธนาคาร</label>
            <div className="flex h-11 items-center rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text">
              {BANKS[result.bank]?.name ?? "ไม่ทราบธนาคาร"}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ag-text">หมวดหมู่</label>
            <div className="flex gap-3 overflow-x-auto ag-scrollbar-hide">
              {EXPENSE_CATEGORY_LIST.map((catId) => (
                <button
                  key={catId}
                  onClick={() => setCategory(catId)}
                  className="flex shrink-0 flex-col items-center gap-1"
                >
                  <div className={clsx("rounded-2xl", category === catId && "ring-2 ring-ag-blue ring-offset-2")}>
                    <CategoryIcon category={catId} size={48} iconSize={22} />
                  </div>
                  <span className="max-w-[54px] truncate text-[10px] text-ag-text-secondary">
                    {CATEGORIES[catId].label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">บัญชี</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">บันทึกเพิ่มเติม (ไม่บังคับ)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เพิ่มรายละเอียด..."
              className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none placeholder:text-ag-text-secondary/60 focus:border-ag-blue"
            />
          </div>

          <Button variant="primary" size="lg" fullWidth onClick={handleSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกรายการ"}
          </Button>
        </div>
      </div>
    </div>
  );
}
