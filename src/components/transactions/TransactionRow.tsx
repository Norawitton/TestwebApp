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
        <p className="text-xs text-ag-text-secondary">
          {CATEGORIES[tx.category].label} · {formatThaiTime(tx.date)}
        </p>
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
