"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { DailySpendChart, MonthlyComparisonChart } from "@/components/charts/AnalyticsCharts";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { MascotTipCard } from "@/components/ui/MascotTipCard";
import { useAppData } from "@/hooks/useAppData";
import {
  categoryBreakdownWithPending,
  currentMonthKey,
  dailySpendSeries,
  filterByMonth,
  monthlyComparisonSeries,
  recurringMerchants,
  sumByType,
  sumPending,
  topCategories,
  topMerchants,
} from "@/lib/analytics";
import { formatBaht } from "@/lib/format";
import { CATEGORIES } from "@/lib/categories";
import { buildAnalyticsInsights } from "@/lib/insights";
import { Repeat } from "lucide-react";

export default function AnalyticsPage() {
  const { transactions, budget, loading } = useAppData();
  const monthKey = currentMonthKey();
  const monthTx = useMemo(() => filterByMonth(transactions, monthKey), [transactions, monthKey]);

  const totalExpense = sumByType(monthTx, "expense");
  const totalIncome = sumByType(monthTx, "income");
  const balance = totalIncome - totalExpense;

  const daily = useMemo(() => dailySpendSeries(transactions, monthKey), [transactions, monthKey]);
  const comparison = useMemo(() => monthlyComparisonSeries(transactions, 6), [transactions]);
  const catBreakdown = useMemo(() => topCategories(monthTx, 8), [monthTx]);
  const top3 = catBreakdown.slice(0, 3);
  const donutBreakdown = useMemo(() => categoryBreakdownWithPending(monthTx, 8), [monthTx]);
  const pendingExpense = useMemo(() => sumPending(monthTx, "expense"), [monthTx]);
  const pendingIncome = useMemo(() => sumPending(monthTx, "income"), [monthTx]);
  const merchants = useMemo(() => topMerchants(monthTx, 5), [monthTx]);
  const recurring = useMemo(() => recurringMerchants(transactions), [transactions]);
  const insights = useMemo(() => buildAnalyticsInsights(transactions, budget), [transactions, budget]);

  if (loading) {
    return (
      <AppShell>
        <ScreenHeader title="วิเคราะห์" />
        <div className="animate-pulse space-y-4 px-5">
          <div className="h-24 rounded-[22px] bg-ag-grayblue" />
          <div className="h-48 rounded-[22px] bg-ag-grayblue" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScreenHeader title="วิเคราะห์" />

      <div className="flex flex-col gap-5 px-5 pb-4">
        {/* Totals */}
        <div className="grid grid-cols-3 gap-2.5">
          <Card padded={false} className="p-3.5 text-center">
            <p className="text-[11px] text-ag-text-secondary">รายจ่ายรวม</p>
            <p className="ag-money mt-1 text-sm font-bold text-ag-coral">{formatBaht(totalExpense)}</p>
            {pendingExpense > 0 && (
              <p className="ag-money mt-0.5 text-[10px] font-semibold text-[#8a6d00]">
                +รอยืนยัน {formatBaht(pendingExpense)}
              </p>
            )}
          </Card>
          <Card padded={false} className="p-3.5 text-center">
            <p className="text-[11px] text-ag-text-secondary">รายรับรวม</p>
            <p className="ag-money mt-1 text-sm font-bold text-ag-green">{formatBaht(totalIncome)}</p>
            {pendingIncome > 0 && (
              <p className="ag-money mt-0.5 text-[10px] font-semibold text-[#8a6d00]">
                +รอยืนยัน {formatBaht(pendingIncome)}
              </p>
            )}
          </Card>
          <Card padded={false} className="p-3.5 text-center">
            <p className="text-[11px] text-ag-text-secondary">เงินคงเหลือ</p>
            {/* formatBaht() ใช้ Math.abs() เสมอ และใส่เครื่องหมาย +/- ให้ก็ต่อ
                เมื่อส่ง { sign: true } เท่านั้น — เดิมไม่ได้ส่ง ทำให้เงินคงเหลือ
                ติดลบ (เช่น รายรับ 0 แต่มีรายจ่าย) โชว์เป็นตัวเลขบวกเฉยๆ */}
            <p className={`ag-money mt-1 text-sm font-bold ${balance < 0 ? "text-ag-coral" : "text-ag-text"}`}>
              {formatBaht(balance, { sign: true })}
            </p>
          </Card>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <MascotTipCard message={insights[0]} tone="info" pose="point" />
        )}

        {/* Daily spend */}
        <Card>
          <h2 className="mb-1 font-bold text-ag-text">รายจ่ายรายวัน</h2>
          <p className="mb-2 text-xs text-ag-text-secondary">แนวโน้มการใช้จ่ายตลอดเดือนนี้</p>
          <DailySpendChart data={daily} />
        </Card>

        {/* Monthly comparison */}
        <Card>
          <h2 className="mb-1 font-bold text-ag-text">เปรียบเทียบรายเดือน</h2>
          <p className="mb-2 text-xs text-ag-text-secondary">รายรับเทียบกับรายจ่าย 6 เดือนล่าสุด</p>
          <MonthlyComparisonChart data={comparison} />
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-ag-text-secondary">
              <span className="h-2.5 w-2.5 rounded-full bg-ag-coral" /> รายจ่าย
            </span>
            <span className="flex items-center gap-1.5 text-ag-text-secondary">
              <span className="h-2.5 w-2.5 rounded-full bg-ag-green" /> รายรับ
            </span>
          </div>
        </Card>

        {/* Category donut */}
        <Card>
          <h2 className="mb-3 font-bold text-ag-text">สัดส่วนตามหมวดหมู่</h2>
          <div className="flex items-center gap-4">
            <CategoryDonut data={donutBreakdown} total={totalExpense + pendingExpense} size={140} />
            <div className="flex flex-1 flex-col gap-2">
              {[
                ...donutBreakdown.filter((c) => c.category !== "pending").slice(0, 5),
                ...donutBreakdown.filter((c) => c.category === "pending"),
              ].map((c) => (
                <div key={c.category} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORIES[c.category].color }} />
                  <span className="flex-1 truncate text-ag-text-secondary">{CATEGORIES[c.category].label}</span>
                  <span className="ag-money font-semibold text-ag-text">{formatBaht(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top 3 categories */}
        <Card>
          <h2 className="mb-3 font-bold text-ag-text">3 หมวดที่ใช้จ่ายมากที่สุด</h2>
          <div className="flex flex-col gap-3">
            {top3.map((c, i) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="w-5 text-sm font-bold text-ag-text-secondary">{i + 1}</span>
                <CategoryIcon category={c.category} size={40} iconSize={18} />
                <span className="flex-1 text-sm font-semibold text-ag-text">{CATEGORIES[c.category].label}</span>
                <span className="ag-money text-sm font-bold text-ag-text">{formatBaht(c.amount)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top merchants */}
        <Card>
          <h2 className="mb-3 font-bold text-ag-text">ร้านค้าที่ใช้จ่ายบ่อย</h2>
          <div className="flex flex-col gap-2.5">
            {merchants.map((m) => (
              <div key={m.merchant} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ag-text">{m.merchant}</p>
                  <p className="text-xs text-ag-text-secondary">{m.count} ครั้ง</p>
                </div>
                <span className="ag-money text-sm font-bold text-ag-text">{formatBaht(m.amount)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recurring expenses */}
        {recurring.length > 0 && (
          <Card>
            <h2 className="mb-3 flex items-center gap-1.5 font-bold text-ag-text">
              <Repeat size={16} color="#1689F5" /> ค่าใช้จ่ายประจำ
            </h2>
            <div className="flex flex-col gap-2.5">
              {recurring.map((r) => (
                <div key={r.merchant} className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ag-text">{r.merchant}</p>
                  <span className="ag-money text-sm font-bold text-ag-text">{formatBaht(r.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Additional insights */}
        {insights.length > 1 && (
          <div className="flex flex-col gap-3">
            {insights.slice(1).map((msg, i) => (
              <MascotTipCard key={i} message={msg} tone="encourage" pose="cheer" />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
