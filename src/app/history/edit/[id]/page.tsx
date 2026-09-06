"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Mascot } from "@/components/mascot/Mascot";

export default function EditTransactionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { transactions, loading } = useAppData();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ag-offwhite">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ag-blue border-t-transparent" />
      </div>
    );
  }

  const tx = transactions.find((t) => t.id === params.id);

  if (!tx) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ag-offwhite px-8 text-center">
        <Mascot pose="worried" size={90} />
        <p className="text-sm text-ag-text-secondary">ไม่พบรายการนี้ อาจถูกลบไปแล้ว</p>
        <button onClick={() => router.push("/history")} className="text-sm font-bold text-ag-blue active:opacity-60">
          กลับไปหน้ารายการ
        </button>
      </div>
    );
  }

  return (
    <TransactionForm
      type={tx.type}
      title={tx.type === "income" ? "แก้ไขรายรับ" : "แก้ไขรายจ่าย"}
      existing={tx}
    />
  );
}
