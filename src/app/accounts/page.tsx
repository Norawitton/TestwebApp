"use client";

import { useState } from "react";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Mascot } from "@/components/mascot/Mascot";
import { IllustrationCreditCard } from "@/components/illustrations/Illustrations";
import { useAppData } from "@/hooks/useAppData";
import { Account } from "@/lib/types";
import { BANKS } from "@/lib/categories";
import { AddAccountSheet } from "@/components/accounts/AddAccountSheet";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Plus, Trash2 } from "lucide-react";

const TYPE_LABELS: Record<Account["type"], string> = {
  cash: "เงินสด",
  bank: "บัญชีธนาคาร",
  credit_card: "บัตรเครดิต",
  e_wallet: "e-Wallet",
};

export default function AccountsPage() {
  const { accounts, loading, addAccount, removeAccount } = useAppData();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const creditCards = accounts.filter((a) => a.type === "credit_card");
  const others = accounts.filter((a) => a.type !== "credit_card");

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await removeAccount(confirmDelete.id);
      setConfirmDelete(null);
    } catch {
      // เดิม deleteFinancialAccount() คืนค่าเงียบๆ ตอน error ทำให้ตรงนี้ปิด
      // dialog เหมือนลบสำเร็จอยู่ดีแม้จะลบไม่สำเร็จจริง — เช็คแล้วโชว์ error จริง
      setDeleteError("ลบบัญชีไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <RequireAuth>
    <div className="mx-auto min-h-screen max-w-[480px] bg-ag-offwhite pb-24">
      <ScreenHeader title="จัดการบัญชีและบัตร" />

      <div className="flex flex-col gap-5 px-5 pt-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-ag-blue border-t-transparent" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Mascot pose="wave" size={80} />
            <p className="text-sm text-ag-text-secondary">ยังไม่มีบัญชี เพิ่มบัญชีแรกของคุณเลย</p>
          </div>
        ) : (
          <>
            {/* Credit cards */}
            <div>
              <h2 className="mb-2 font-bold text-ag-text">บัตรเครดิต</h2>
              {creditCards.length === 0 ? (
                <p className="text-sm text-ag-text-secondary">ยังไม่มีบัตรเครดิต กดปุ่ม + เพื่อเพิ่ม</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto ag-scrollbar-hide pb-1">
                  {creditCards.map((a) => (
                    <div key={a.id} className="shrink-0">
                      <IllustrationCreditCard size={150} colorFrom={a.colorFrom} colorTo={a.colorTo} />
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-ag-text">
                          {a.name}
                          {a.last4 && <span className="text-ag-text-secondary"> •••• {a.last4}</span>}
                        </p>
                        <button
                          onClick={() => { setConfirmDelete(a); setDeleteError(""); }}
                          aria-label="ลบบัตร"
                          className="shrink-0 p-1 active:scale-90"
                        >
                          <Trash2 size={14} color="#C4CDD6" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Other accounts */}
            <div>
              <h2 className="mb-2 font-bold text-ag-text">บัญชีอื่น ๆ</h2>
              {others.length === 0 ? (
                <p className="text-sm text-ag-text-secondary">ยังไม่มีบัญชีเงินสดหรือธนาคาร</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {others.map((a) => (
                    <Card key={a.id} padded={false} className="flex items-center justify-between px-4 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-ag-text">{a.name}</p>
                        <p className="text-xs text-ag-text-secondary">
                          {TYPE_LABELS[a.type]}
                          {a.bank && ` · ${BANKS[a.bank]?.name ?? a.bank}`}
                          {a.last4 && ` · •••• ${a.last4}`}
                        </p>
                      </div>
                      <button
                        onClick={() => { setConfirmDelete(a); setDeleteError(""); }}
                        aria-label="ลบบัญชี"
                        className="shrink-0 p-1.5 active:scale-90"
                      >
                        <Trash2 size={16} color="#C4CDD6" />
                      </button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+20px)] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-ag-blue shadow-[0_8px_20px_rgba(22,137,245,0.4)] active:scale-90"
      >
        <Plus size={26} color="white" strokeWidth={2.5} />
      </button>

      {showAdd && (
        <AddAccountSheet
          onClose={() => setShowAdd(false)}
          onSave={async (input) => {
            await addAccount(input);
            setShowAdd(false);
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ag-navy/50 px-8">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 text-center ag-animate-slide-up">
            <Mascot pose="worried" size={72} />
            <h3 className="mt-3 text-lg font-bold text-ag-text">ลบ &quot;{confirmDelete.name}&quot;?</h3>
            <p className="mt-1 text-sm text-ag-text-secondary">
              รายการที่เคยบันทึกไว้ในบัญชีนี้จะยังอยู่ในประวัติ แต่จะไม่สามารถกรองตามชื่อบัญชีนี้ได้อีก
            </p>
            {deleteError && <p className="mt-2 text-xs font-semibold text-ag-coral">{deleteError}</p>}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="h-12 flex-1 rounded-2xl bg-ag-grayblue text-sm font-bold text-ag-text"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="h-12 flex-1 rounded-2xl bg-ag-coral text-sm font-bold text-white disabled:opacity-60"
              >
                {deleting ? "กำลังลบ..." : "ลบบัญชี"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RequireAuth>
  );
}
