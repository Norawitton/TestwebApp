"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Wallet, Landmark, CreditCard as CreditCardIcon, Smartphone } from "lucide-react";
import { Account, AccountType, BankId } from "@/lib/types";
import { BANKS } from "@/lib/categories";

interface AddAccountSheetProps {
  onClose: () => void;
  onSave: (input: Omit<Account, "id">) => Promise<void> | void;
}

const TYPE_OPTIONS: { type: AccountType; label: string; icon: typeof Wallet }[] = [
  { type: "cash", label: "เงินสด", icon: Wallet },
  { type: "bank", label: "บัญชีธนาคาร", icon: Landmark },
  { type: "credit_card", label: "บัตรเครดิต", icon: CreditCardIcon },
  { type: "e_wallet", label: "e-Wallet", icon: Smartphone },
];

const DEFAULT_COLORS: Record<AccountType, [string, string]> = {
  cash: ["#20B978", "#0E7A4F"],
  bank: ["#1689F5", "#0F6FD1"],
  credit_card: ["#4E2E7F", "#2E1B4D"],
  e_wallet: ["#E78132", "#B85F1C"],
};

function darken(hex: string, amount = 0.35): string {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function AddAccountSheet({ onClose, onSave }: AddAccountSheetProps) {
  const [type, setType] = useState<AccountType>("credit_card");
  const [name, setName] = useState("");
  const [bank, setBank] = useState<BankId | "">("");
  const [last4, setLast4] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const needsBank = type === "bank" || type === "credit_card";

  async function handleSave() {
    if (!name.trim()) { setError("กรุณาตั้งชื่อบัญชี"); return; }
    if (needsBank && !bank) { setError("กรุณาเลือกธนาคาร"); return; }
    if (last4 && !/^\d{4}$/.test(last4)) { setError("เลข 4 ตัวท้ายต้องเป็นตัวเลข 4 หลัก"); return; }

    setSaving(true);
    try {
      const [colorFrom, colorTo] = bank
        ? [BANKS[bank].color, darken(BANKS[bank].color)]
        : DEFAULT_COLORS[type];
      await onSave({
        name: name.trim(),
        type,
        bank: needsBank && bank ? bank : undefined,
        last4: last4 || undefined,
        colorFrom,
        colorTo,
      });
    } catch {
      setError("บันทึกไม่สำเร็จ ลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button aria-label="ปิด" onClick={onClose} className="absolute inset-0 bg-ag-navy/50" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] bg-white p-5 pb-8 ag-animate-slide-up">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ag-grayblue" />
        <h2 className="mb-4 text-lg font-bold text-ag-text">เพิ่มบัญชีใหม่</h2>

        <div className="flex flex-col gap-4">
          {/* Type selector */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">ประเภทบัญชี</label>
            <div className="grid grid-cols-4 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = type === opt.type;
                return (
                  <button
                    key={opt.type}
                    onClick={() => { setType(opt.type); setBank(""); setLast4(""); setError(""); }}
                    className={clsx(
                      "flex flex-col items-center gap-1 rounded-2xl border py-3 transition-colors",
                      active ? "border-ag-blue bg-[#EAF4FE]" : "border-ag-grayblue bg-white"
                    )}
                  >
                    <Icon size={20} color={active ? "#1689F5" : "#71818E"} />
                    <span className={clsx("text-[10px] font-semibold", active ? "text-ag-blue" : "text-ag-text-secondary")}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">ชื่อบัญชี *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder={type === "credit_card" ? "เช่น บัตรเครดิต SCB" : type === "bank" ? "เช่น ออมทรัพย์ กสิกรไทย" : type === "e_wallet" ? "เช่น TrueMoney Wallet" : "เช่น เงินสดในกระเป๋า"}
              className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
            />
          </div>

          {/* Bank selector */}
          {needsBank && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ag-text">ธนาคาร *</label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(BANKS) as [BankId, { name: string; color: string }][]).map(([id, b]) => (
                  <button
                    key={id}
                    onClick={() => { setBank(id); setError(""); }}
                    className={clsx(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      bank === id ? "border-transparent text-white" : "border-ag-grayblue text-ag-text-secondary bg-white"
                    )}
                    style={bank === id ? { backgroundColor: b.color } : undefined}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Last 4 digits */}
          {needsBank && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ag-text">เลข 4 ตัวท้าย (ไม่บังคับ)</label>
              <input
                inputMode="numeric"
                maxLength={4}
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
              />
            </div>
          )}

          {error && <p className="text-xs font-semibold text-ag-coral">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="h-12 w-full rounded-2xl bg-ag-navy text-sm font-bold text-white disabled:opacity-60 active:scale-[0.98]"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกบัญชี"}
          </button>
        </div>
      </div>
    </div>
  );
}
