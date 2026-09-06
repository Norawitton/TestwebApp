"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Trash2, Pencil, Check } from "lucide-react";
import { AppShell } from "@/components/nav/AppShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { IllustrationEmptyState } from "@/components/illustrations/Illustrations";
import { useAppData } from "@/hooks/useAppData";
import { CategoryId, Transaction, TransactionType } from "@/lib/types";
import { CATEGORIES, EXPENSE_CATEGORY_LIST, INCOME_CATEGORY_LIST } from "@/lib/categories";
import { formatBaht, relativeDayLabel, formatThaiTime, localDateKey } from "@/lib/format";
import { clsx } from "clsx";

type TabFilter = "all" | "expense" | "income";

export default function HistoryPage() {
  const { transactions, accounts, loading, removeTransaction, editTransaction } = useAppData();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (tab !== "all" && t.type !== tab) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (accountFilter !== "all" && t.accountId !== accountFilter) return false;
      if (query.trim() && !t.merchant.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [transactions, tab, categoryFilter, accountFilter, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach((t) => {
      const key = localDateKey(t.date);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const categoryOptions: CategoryId[] = useMemo(() => {
    if (tab === "income") return INCOME_CATEGORY_LIST;
    if (tab === "expense") return EXPENSE_CATEGORY_LIST;
    return Array.from(new Set([...EXPENSE_CATEGORY_LIST, ...INCOME_CATEGORY_LIST]));
  }, [tab]);

  return (
    <AppShell>
      <ScreenHeader title="รายการทั้งหมด" onBack={() => history.back()} />

      <div className="px-5 pt-1">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-2xl border border-ag-grayblue bg-white px-4 py-2.5">
          <Search size={18} color="#71818E" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาร้านค้าหรือรายการ"
            className="w-full bg-transparent text-sm text-ag-text outline-none placeholder:text-ag-text-secondary/60"
          />
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            aria-label="ตัวกรอง"
            className={clsx(
              "rounded-full p-1",
              filtersOpen ? "bg-ag-blue text-white" : "text-ag-text-secondary"
            )}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex gap-2">
          {(
            [
              { key: "all", label: "ทั้งหมด" },
              { key: "expense", label: "รายจ่าย" },
              { key: "income", label: "รายรับ" },
            ] as { key: TabFilter; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setCategoryFilter("all"); }}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                tab === t.key ? "bg-ag-navy text-white" : "bg-ag-grayblue text-ag-text-secondary"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-ag-grayblue/50 p-3 ag-animate-slide-up">
            <div>
              <p className="mb-1.5 text-xs font-bold text-ag-text-secondary">หมวดหมู่</p>
              <div className="flex gap-2 overflow-x-auto ag-scrollbar-hide">
                <FilterChip active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")}>
                  ทั้งหมด
                </FilterChip>
                {categoryOptions.map((c) => (
                  <FilterChip key={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)}>
                    {CATEGORIES[c].label}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold text-ag-text-secondary">บัญชี</p>
              <div className="flex gap-2 overflow-x-auto ag-scrollbar-hide">
                <FilterChip active={accountFilter === "all"} onClick={() => setAccountFilter("all")}>
                  ทั้งหมด
                </FilterChip>
                {accounts.map((a) => (
                  <FilterChip key={a.id} active={accountFilter === a.id} onClick={() => setAccountFilter(a.id)}>
                    {a.name}
                  </FilterChip>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-4 px-5">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-ag-grayblue" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <IllustrationEmptyState size={140} />
            <p className="text-sm text-ag-text-secondary">ไม่พบรายการที่ค้นหา</p>
          </div>
        ) : (
          grouped.map(([dateKey, txs]) => (
            <div key={dateKey}>
              <p className="mb-1.5 text-xs font-bold text-ag-text-secondary">
                {relativeDayLabel(txs[0].date)}
              </p>
              <div className="flex flex-col gap-2">
                {txs.map((tx) => (
                  <SwipeableRow
                    key={tx.id}
                    tx={tx}
                    swiped={swipedId === tx.id}
                    onSwipe={() => setSwipedId(swipedId === tx.id ? null : tx.id)}
                    onDelete={() =>
                      removeTransaction(tx.id).catch((err) => console.error("ลบรายการไม่สำเร็จ:", err))
                    }
                    onConfirm={() =>
                      editTransaction(tx.id, { status: "completed" }).catch((err) =>
                        console.error("ยืนยันรายการไม่สำเร็จ:", err)
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        active ? "bg-ag-blue text-white" : "bg-white text-ag-text-secondary"
      )}
    >
      {children}
    </button>
  );
}

function SwipeableRow({
  tx,
  swiped,
  onSwipe,
  onDelete,
  onConfirm,
}: {
  tx: Transaction;
  swiped: boolean;
  onSwipe: () => void;
  onDelete: () => void;
  onConfirm: () => void;
}) {
  const router = useRouter();
  const isIncome = tx.type === "income";
  const isPending = tx.status === "pending";
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-1">
        {isPending && (
          <button
            onClick={onConfirm}
            aria-label="ยืนยันรายการ"
            className="flex h-full items-center justify-center rounded-xl bg-ag-green px-4"
          >
            <Check size={18} color="white" />
          </button>
        )}
        <button
          onClick={() => router.push(`/history/edit/${tx.id}`)}
          aria-label="แก้ไข"
          className="flex h-full items-center justify-center rounded-xl bg-ag-blue px-4"
        >
          <Pencil size={18} color="white" />
        </button>
        <button
          onClick={onDelete}
          aria-label="ลบ"
          className="flex h-full items-center justify-center rounded-xl bg-ag-coral px-4"
        >
          <Trash2 size={18} color="white" />
        </button>
      </div>
      <button
        onClick={onSwipe}
        className={clsx(
          "relative flex w-full items-center gap-3 bg-white px-2 py-3 text-left transition-transform duration-200",
          swiped && (isPending ? "-translate-x-[156px]" : "-translate-x-[104px]")
        )}
      >
        <CategoryIcon category={tx.category} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ag-text">{tx.merchant}</p>
          <div className="flex items-center gap-1.5 text-xs text-ag-text-secondary">
            <span>{CATEGORIES[tx.category].label} · {formatThaiTime(tx.date)}</span>
            {isPending && (
              <span className="shrink-0 rounded-full bg-ag-yellow/40 px-1.5 py-0.5 text-[10px] font-bold text-[#8a6d00]">
                รอยืนยัน
              </span>
            )}
          </div>
        </div>
        <span className={clsx("ag-money shrink-0 text-sm font-bold", isIncome ? "text-ag-green" : "text-ag-text")}>
          {isIncome ? "+" : "-"}
          {formatBaht(tx.amount)}
        </span>
      </button>
    </div>
  );
}
