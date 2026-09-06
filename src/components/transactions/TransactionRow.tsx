import { Transaction } from "@/lib/types";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatBaht, formatThaiTime } from "@/lib/format";
import { CATEGORIES } from "@/lib/categories";
import { clsx } from "clsx";

export function TransactionRow({
  tx,
  onClick,
}: {
  tx: Transaction;
  onClick?: () => void;
}) {
  const isIncome = tx.type === "income";
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-1 py-2.5 text-left transition-colors active:bg-ag-grayblue/50"
    >
      <CategoryIcon category={tx.category} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ag-text">{tx.merchant}</p>
        <div className="flex items-center gap-1.5 text-xs text-ag-text-secondary">
          <span>{CATEGORIES[tx.category].label} · {formatThaiTime(tx.date)}</span>
          {tx.status === "pending" && (
            <span className="shrink-0 rounded-full bg-ag-yellow/40 px-1.5 py-0.5 text-[10px] font-bold text-[#8a6d00]">
              รอยืนยัน
            </span>
          )}
        </div>
      </div>
      <span
        className={clsx(
          "ag-money shrink-0 text-sm font-bold",
          isIncome ? "text-ag-green" : "text-ag-text"
        )}
      >
        {isIncome ? "+" : "-"}
        {formatBaht(tx.amount)}
      </span>
    </button>
  );
}
