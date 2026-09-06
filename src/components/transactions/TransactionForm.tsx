"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useAppData } from "@/hooks/useAppData";
import { CategoryId, Transaction, TransactionType } from "@/lib/types";
import { CATEGORIES, EXPENSE_CATEGORY_LIST, INCOME_CATEGORY_LIST } from "@/lib/categories";
import { clsx } from "clsx";
import { Mascot } from "@/components/mascot/Mascot";
import { RequireAuth } from "@/components/auth/RequireAuth";

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// รวมวันที่ที่ผู้ใช้เลือกเข้ากับเวลาปัจจุบัน (local time) แล้วคืนเป็น ISO string
function combineDateWithNow(dateStr: string): string {
  const now = new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
}

interface TransactionFormProps {
  type: TransactionType;
  title: string;
  defaultAccountId?: string;
  restrictToAccountType?: "credit_card";
  // ถ้าใส่มา ฟอร์มจะพรีฟิลค่าจากรายการนี้และแก้ไข (editTransaction) แทนที่จะ
  // สร้างรายการใหม่ (addTransaction) ตอนกดบันทึก
  existing?: Transaction;
}

interface FormErrors {
  amount?: string;
  merchant?: string;
  category?: string;
  account?: string;
}

export function TransactionForm({ type, title, restrictToAccountType, existing }: TransactionFormProps) {
  const router = useRouter();
  const { accounts, addTransaction, editTransaction } = useAppData();
  const [amount, setAmount] = useState(() => (existing ? String(existing.amount) : ""));
  const [merchant, setMerchant] = useState(() => existing?.merchant ?? "");
  const [category, setCategory] = useState<CategoryId>(
    () => existing?.category ?? (type === "income" ? "salary" : "food")
  );
  const [accountId, setAccountId] = useState<string>(() => existing?.accountId ?? "");
  const [dateStr, setDateStr] = useState(() => toDateInputValue(existing ? new Date(existing.date) : new Date()));
  const [pending, setPending] = useState(() => existing?.status === "pending");
  const [note, setNote] = useState(() => existing?.note ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const availableAccounts = restrictToAccountType
    ? accounts.filter((a) => a.type === restrictToAccountType)
    : accounts;
  const categoryList = type === "income" ? INCOME_CATEGORY_LIST : EXPENSE_CATEGORY_LIST;

  function validate(): boolean {
    const next: FormErrors = {};
    const numeric = Number(amount.replace(/,/g, ""));
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      next.amount = "กรุณากรอกจำนวนเงินให้ถูกต้อง";
    }
    if (!merchant.trim()) {
      next.merchant = type === "income" ? "กรุณาระบุแหล่งที่มาของรายรับ" : "กรุณาระบุชื่อร้านค้าหรือรายการ";
    }
    if (!category) {
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
    setSubmitError("");
    const numeric = Number(amount.replace(/,/g, ""));
    const status = pending ? "pending" : "completed";
    try {
      if (existing) {
        await editTransaction(existing.id, {
          amount: numeric,
          merchant: merchant.trim(),
          category,
          accountId,
          date: combineDateWithNow(dateStr),
          // ส่งเป็น "" แทน undefined ตอนแก้ไข เพราะ updateTransaction() จะข้าม
          // field ที่เป็น undefined ไปเลย (ถือว่า "ไม่แตะ") — ถ้าผู้ใช้ลบโน้ต
          // ทิ้งแล้วส่ง undefined ไป โน้ตเดิมจะไม่ถูกล้างออกจริง
          note: note.trim(),
          status,
        });
      } else {
        await addTransaction({
          type,
          amount: numeric,
          merchant: merchant.trim(),
          category,
          accountId,
          date: combineDateWithNow(dateStr),
          note: note.trim() || undefined,
          source: restrictToAccountType === "credit_card" ? "credit_card" : "manual",
          status,
        });
      }
    } catch (err) {
      // เดิม updateTransaction() คืน null เงียบๆ ตอน error ทำให้ตรงนี้ไม่มีทาง
      // รู้ว่าล้มเหลว แล้วขึ้นหน้า "สำเร็จ" หลอกผู้ใช้ไปเลย — เช็คแล้วโชว์ error จริง
      console.error("บันทึกรายการไม่สำเร็จ:", err);
      setSaving(false);
      setSubmitError(
        existing ? "แก้ไขรายการไม่สำเร็จ ลองใหม่อีกครั้ง" : "บันทึกรายการไม่สำเร็จ ลองใหม่อีกครั้ง"
      );
      return;
    }
    setSaving(false);
    setSuccess(true);
    setTimeout(() => router.push(existing ? "/history" : "/home"), 900);
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ag-yellow-soft px-8 text-center">
        <Mascot pose="cheer" size={110} />
        <h2 className="text-xl font-bold text-ag-navy">
          {existing ? "แก้ไขรายการเรียบร้อย!" : "บันทึกรายการเรียบร้อย!"}
        </h2>
        <p className="text-sm text-ag-text/70">น้องออมบันทึกรายการของคุณให้แล้วครับ</p>
      </div>
    );
  }

  return (
    <RequireAuth>
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

        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-ag-text">หมวดหมู่</label>
          <div className="grid grid-cols-4 gap-3">
            {categoryList.map((catId) => (
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

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ag-text">วันที่</label>
          <input
            type="date"
            value={dateStr}
            max={toDateInputValue(new Date())}
            onChange={(e) => setDateStr(e.target.value)}
            className="h-12 w-full rounded-2xl border border-ag-grayblue bg-white px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
          />
        </div>

        {/* Account */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ag-text">บัญชี</label>
          {availableAccounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ag-grayblue bg-white px-4 py-4 text-center">
              <p className="text-sm text-ag-text-secondary">
                {restrictToAccountType === "credit_card"
                  ? "ยังไม่มีบัตรเครดิตในระบบ ต้องเพิ่มบัตรก่อนถึงจะบันทึกรายการนี้ได้"
                  : "ยังไม่มีบัญชีในระบบ ต้องเพิ่มบัญชีก่อนถึงจะบันทึกรายการได้"}
              </p>
              <button
                onClick={() => router.push("/accounts")}
                className="mt-2 text-sm font-bold text-ag-blue active:opacity-60"
              >
                {restrictToAccountType === "credit_card" ? "เพิ่มบัตรเครดิต" : "เพิ่มบัญชี"} →
              </button>
            </div>
          ) : (
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
          )}
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

        {/* Pending toggle */}
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-ag-grayblue bg-white px-4 py-3.5">
          <span>
            <span className="block text-sm font-semibold text-ag-text">
              {type === "income" ? "ยังไม่ได้รับเงินจริง (รอยืนยัน)" : "ยังไม่ได้จ่ายจริง (ค้างจ่าย)"}
            </span>
            <span className="block text-xs text-ag-text-secondary">
              {type === "income"
                ? "เช่น ทำงานเสร็จแล้วแต่เงินยังไม่เข้าบัญชี"
                : "เช่น ตกลงจะจ่ายแล้วแต่ยังไม่ได้โอน/จ่ายจริง"}
            </span>
          </span>
          <input
            type="checkbox"
            checked={pending}
            onChange={(e) => setPending(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-ag-blue"
          />
        </label>

        {submitError && (
          <p className="text-center text-sm font-semibold text-ag-coral">{submitError}</p>
        )}

        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={saving}>
          {saving ? "กำลังบันทึก..." : existing ? "บันทึกการแก้ไข" : "บันทึกรายการ"}
        </Button>
      </div>
    </div>
    </RequireAuth>
  );
}
