"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useAppData } from "@/hooks/useAppData";
import { CategoryId, TransactionType } from "@/lib/types";
import { CATEGORIES, EXPENSE_CATEGORY_LIST } from "@/lib/categories";
import { clsx } from "clsx";
import { Mascot } from "@/components/mascot/Mascot";

interface TransactionFormProps {
  type: TransactionType;
  title: string;
  defaultAccountId?: string;
  restrictToAccountType?: "credit_card";
}

interface FormErrors {
  amount?: string;
  merchant?: string;
  category?: string;
  account?: string;
}

export function TransactionForm({ type, title, restrictToAccountType }: TransactionFormProps) {
  const router = useRouter();
  const { accounts, addTransaction } = useAppData();
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<CategoryId>(type === "income" ? "income" : "food");
  const [accountId, setAccountId] = useState<string>("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const availableAccounts = restrictToAccountType
    ? accounts.filter((a) => a.type === restrictToAccountType)
    : accounts;

  function validate(): boolean {
    const next: FormErrors = {};
    const numeric = Number(amount.replace(/,/g, ""));
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      next.amount = "กรุณากรอกจำนวนเงินให้ถูกต้อง";
    }
    if (!merchant.trim()) {
      next.merchant = type === "income" ? "กรุณาระบุแหล่งที่มาของรายรับ" : "กรุณาระบุชื่อร้านค้าหรือรายการ";
    }
    if (type === "expense" && !category) {
      next.category = "กรุณาเลือกหมวดหมู่";
    }
    if (!accountId) {
      next.account = "กรุณาเลือกบัญชี";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    const numeric = Number(amount.replace(/,/g, ""));
    await addTransaction({
      type,
      amount: numeric,
      merchant: merchant.trim(),
      category: type === "income" ? "income" : category,
      accountId,
      date: new Date().toISOString(),
      note: note.trim() || undefined,
      source: restrictToAccountType === "credit_card" ? "credit_card" : "manual",
    });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => router.push("/home"), 900);
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ag-yellow-soft px-8 text-center">
        <Mascot pose="cheer" size={110} />
        <h2 className="text-xl font-bold text-ag-navy">บันทึกรายการเรียบร้อย!</h2>
        <p className="text-sm text-ag-text/70">น้องออมบันทึกรายการของคุณให้แล้วครับ</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-ag-offwhite pb-10">
      <ScreenHeader title={title} />

      <div className="flex flex-col gap-6 px-5 pt-2">
        {/* Amount */}
        <div className="flex flex-col items-center gap-1 py-4">
          <span className="text-sm text-ag-text-secondary">จำนวนเงิน</span>
          <div className="flex items-center gap-1">
            <span className="ag-money text-3xl font-bold text-ag-text-secondary">฿</span>
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              className="ag-money w-[200px] bg-transparent text-center text-4xl font-bold text-ag-text outline-none placeholder:text-ag-text-secondary/30"
            />
          </div>
          {errors.amount && <p className="text-xs font-semibold text-ag-coral">{errors.amount}</p>}
        </div>

        {/* Merchant / source */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ag-text">
            {type === "income" ? "แหล่งที่มา" : "ร้านค้า / รายการ"}
          </label>
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder={type === "income" ? "เช่น เงินเดือน, งานฟรีแลนซ์" : "เช่น ร้านกาแฟ, ค่าไฟ"}
            className={clsx(
              "h-12 w-full rounded-2xl border bg-white px-4 text-sm text-ag-text outline-none placeholder:text-ag-text-secondary/60 focus:border-ag-blue",
              errors.merchant ? "border-ag-coral" : "border-ag-grayblue"
            )}
          />
          {errors.merchant && <p className="mt-1 text-xs font-semibold text-ag-coral">{errors.merchant}</p>}
        </div>

        {/* Category (expense only) */}
        {type !== "income" && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-ag-text">หมวดหมู่</label>
            <div className="grid grid-cols-4 gap-3">
              {EXPENSE_CATEGORY_LIST.map((catId) => (
                <button
                  key={catId}
                  onClick={() => setCategory(catId)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={clsx(
                      "flex h-14 w-14 items-center justify-center rounded-2xl transition-all",
                      category === catId && "ring-2 ring-ag-blue ring-offset-2"
                    )}
                  >
                    <CategoryIcon category={catId} size={52} iconSize={24} />
                  </div>
                  <span className="text-center text-[11px] leading-tight text-ag-text-secondary">
                    {CATEGORIES[catId].label}
                  </span>
                </button>
              ))}
            </div>
            {errors.category && <p className="mt-2 text-xs font-semibold text-ag-coral">{errors.category}</p>}
          </div>
        )}

        {/* Account */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ag-text">บัญชี</label>
          <div className="flex flex-col gap-2">
            {availableAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setAccountId(acc.id)}
                className={clsx(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors",
                  accountId === acc.id ? "border-ag-blue bg-[#EAF4FE]" : "border-ag-grayblue bg-white"
                )}
              >
                <span className="text-sm font-semibold text-ag-text">{acc.name}</span>
                {acc.last4 && <span className="text-xs text-ag-text-secondary">•••• {acc.last4}</span>}
              </button>
            ))}
          </div>
          {errors.account && <p className="mt-1 text-xs font-semibold text-ag-coral">{errors.account}</p>}
        </div>

        {/* Note */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ag-text">บันทึกเพิ่มเติม (ไม่บังคับ)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น มื้อเที่ยงกับเพื่อน"
            className="h-12 w-full rounded-2xl border border-ag-grayblue bg-white px-4 text-sm text-ag-text outline-none placeholder:text-ag-text-secondary/60 focus:border-ag-blue"
          />
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึกรายการ"}
        </Button>
      </div>
    </div>
  );
}
