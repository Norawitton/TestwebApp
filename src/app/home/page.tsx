"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/nav/AppShell";
import { Mascot } from "@/components/mascot/Mascot";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { MascotTipCard } from "@/components/ui/MascotTipCard";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { useAppData } from "@/hooks/useAppData";
import {
  categoryBreakdownWithPending,
  currentMonthKey,
  filterByMonth,
  percentChange,
  previousMonthKey,
  sumByType,
  sumPending,
} from "@/lib/analytics";
import { formatBaht, formatThaiMonthYear, percent, relativeDayLabel } from "@/lib/format";
import { buildHomeInsight } from "@/lib/insights";
import { CATEGORIES } from "@/lib/categories";

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 11) return "สวัสดีตอนเช้าครับ";
  if (h < 17) return "สวัสดีตอนบ่ายครับ";
  return "สวัสดีตอนเย็นครับ";
}

export default function HomePage() {
  const router = useRouter();
  const { loading, transactions, budget } = useAppData();
  const [monthKey] = useState(currentMonthKey());

  const monthTx = useMemo(() => filterByMonth(transactions, monthKey), [transactions, monthKey]);
  const prevMonthTx = useMemo(
    () => filterByMonth(transactions, previousMonthKey()),
    [transactions]
  );

  const totalExpense = sumByType(monthTx, "expense");
  const prevExpense = sumByType(prevMonthTx, "expense");
  const change = percentChange(totalExpense, prevExpense);

  const budgetLimit = budget?.totalLimit ?? 0;
  const budgetRemaining = Math.max(0, budgetLimit - totalExpense);
  const usedPercent = percent(totalExpense, budgetLimit);

  const catBreakdown = useMemo(() => categoryBreakdownWithPending(monthTx, 8), [monthTx]);
  const pendingExpense = useMemo(() => sumPending(monthTx, "expense"), [monthTx]);
  const pendingIncome = useMemo(() => sumPending(monthTx, "income"), [monthTx]);
  const donutTotal = totalExpense + pendingExpense;
  const recentTx = transactions.slice(0, 6);
  const insight = useMemo(() => buildHomeInsight(transactions, budget), [transactions, budget]);
  const isNewUser = transactions.length === 0;
  const hasComparisonData = prevExpense > 0;

  if (loading) {
    return (
      <AppShell>
        <HomeLoadingSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell bg="#FFFDF7">
      {/* Header — navy section, with a soft yellow accent behind the greeting */}
      <div className="rounded-b-[28px] bg-ag-navy px-5 pb-8 pt-6 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="inline-block rounded-full bg-ag-yellow px-3 py-1 text-sm font-bold text-ag-navy">
              {greetingByHour()}
            </span>
            <h1 className="mt-2.5 text-lg font-bold leading-snug">วันนี้ใช้เงินเป็นอย่างไรบ้าง?</h1>
          </div>
          <div className="shrink-0 rounded-full bg-ag-yellow p-2">
            <Mascot pose="wave" size={64} />
          </div>
        </div>

        <button className="mt-6 flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5">
          <span className="text-sm font-semibold">{formatThaiMonthYear(monthKey)}</span>
          <ChevronDown size={16} />
        </button>

        <div className="mt-5">
          <p className="text-sm font-medium text-white/80">รายจ่ายเดือนนี้</p>
          <div className="mt-1.5 flex items-end justify-between gap-2">
            <p className="ag-money text-4xl font-bold">{formatBaht(totalExpense)}</p>
            {hasComparisonData ? (
              <span
                className={`ag-money mb-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                  change > 0 ? "bg-ag-coral/20 text-[#FF9C92]" : "bg-ag-green/20 text-[#5FE0A8]"
                }`}
              >
                {change > 0 ? "+" : ""}
                {change}% จากเดือนก่อน
              </span>
            ) : (
              <span className="mb-1 rounded-full bg-white/10 px-2.5 py-1 text-sm font-medium text-white/50">
                ยังไม่มีข้อมูลเปรียบเทียบ
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/10 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-white/85">งบประมาณคงเหลือ</span>
            <span className="ag-money font-bold">{formatBaht(budgetRemaining)}</span>
          </div>
          <div className="mt-3">
            <ProgressBar percent={usedPercent} height={10} trackColor="rgba(255,255,255,0.15)" showThresholds />
          </div>
          <p className="ag-money mt-2 text-sm font-medium text-white/75">
            ใช้ไปแล้ว {usedPercent}% จากงบ {formatBaht(budgetLimit)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-5">
        {/* Mascot insight */}
        <div className="ag-animate-slide-up">
          <MascotTipCard
            message={insight.message}
            tone={insight.tone}
            pose={isNewUser ? "empty" : insight.tone === "warning" ? "worried" : insight.tone === "encourage" ? "cheer" : "point"}
            actions={
              isNewUser
                ? [
                    { label: "จดรายการแรก", onClick: () => router.push("/add/expense") },
                    { label: "ตั้งงบเดือนนี้", onClick: () => router.push("/budget") },
                  ]
                : [{ label: "ตั้งงบเดือนนี้", onClick: () => router.push("/budget") }]
            }
          />
        </div>

        {/* Category donut */}
        <Card className="ag-animate-slide-up" style={{ animationDelay: "60ms" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-ag-text">สรุปรายจ่ายตามหมวดหมู่</h2>
            {catBreakdown.length > 0 && (
              <button
                onClick={() => router.push("/analytics")}
                className="flex items-center text-sm font-semibold text-ag-blue"
              >
                ดูทั้งหมด <ChevronRight size={14} />
              </button>
            )}
          </div>
          {pendingIncome > 0 && (
            <p className="mb-3 rounded-xl bg-ag-yellow/20 px-3 py-2 text-sm font-semibold text-[#8a6d00]">
              รายรับรอยืนยันอีก {formatBaht(pendingIncome)}
            </p>
          )}
          {catBreakdown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Mascot pose="empty" size={100} />
              <p className="text-sm text-ag-text-secondary">ยังไม่มีรายจ่ายในเดือนนี้</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <CategoryDonut data={catBreakdown} total={donutTotal} size={140} />
              <div className="flex flex-1 flex-col gap-2">
                {[
                  ...catBreakdown.filter((c) => c.category !== "pending").slice(0, 4),
                  ...catBreakdown.filter((c) => c.category === "pending"),
                ].map((c) => (
                  <div key={c.category} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: CATEGORIES[c.category].color }}
                    />
                    <span className="flex-1 truncate text-ag-text-secondary">
                      {CATEGORIES[c.category].label}
                    </span>
                    <span className="ag-money font-semibold text-ag-text">{formatBaht(c.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Recent transactions */}
        <div className="ag-animate-slide-up" style={{ animationDelay: "120ms" }}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold text-ag-text">รายการล่าสุด</h2>
            {recentTx.length > 0 && (
              <button
                onClick={() => router.push("/history")}
                className="flex items-center text-sm font-semibold text-ag-blue"
              >
                ดูทั้งหมด <ChevronRight size={14} />
              </button>
            )}
          </div>
          <Card padded={false} className="divide-y divide-ag-grayblue/60 px-4">
            {recentTx.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Mascot pose="empty" size={100} />
                <p className="text-sm text-ag-text-secondary">ยังไม่มีรายการ ลองจดรายการแรกกันเลย</p>
              </div>
            ) : (
              recentTx.map((tx) => (
                <div key={tx.id} className="py-0.5">
                  <TransactionRow tx={tx} onClick={() => router.push(`/history?highlight=${tx.id}`)} />
                  <p className="pb-1.5 pl-[56px] text-[11px] text-ag-text-secondary">
                    {relativeDayLabel(tx.date)}
                  </p>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function HomeLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[300px] rounded-b-[28px] bg-ag-navy/10" />
      <div className="flex flex-col gap-4 px-5 pt-5">
        <div className="h-20 rounded-[22px] bg-ag-grayblue" />
        <div className="h-48 rounded-[22px] bg-ag-grayblue" />
        <div className="h-64 rounded-[22px] bg-ag-grayblue" />
      </div>
    </div>
  );
}
