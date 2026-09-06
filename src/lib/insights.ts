import { Budget, CategoryId, MascotTip, Transaction } from "./types";
import { CATEGORIES } from "./categories";
import {
  currentMonthKey,
  filterByMonth,
  percentChange,
  previousMonthKey,
  sumByCategory,
  sumByType,
} from "./analytics";
import { formatBaht } from "./format";

export function buildHomeInsight(transactions: Transaction[], budget: Budget | null): MascotTip {
  // ผู้ใช้ใหม่ที่ยังไม่เคยจดรายการเลย — ไม่ควรเจอข้อความ/เปอร์เซ็นต์งบที่อิงข้อมูล
  // ที่ยังไม่มี ให้ทักทายแบบชวนเริ่มต้นแทน
  if (transactions.length === 0) {
    return {
      id: "insight-new-user",
      tone: "encourage",
      message: "เริ่มจดรายการแรก แล้วน้องออมจะช่วยสรุปให้เองครับ",
    };
  }

  const curMonth = currentMonthKey();
  const prevMonth = previousMonthKey();
  const curTx = filterByMonth(transactions, curMonth);
  const prevTx = filterByMonth(transactions, prevMonth);

  const curByCategory = sumByCategory(curTx);
  const prevByCategory = sumByCategory(prevTx);

  // Find the category with the largest % increase that also has meaningful spend.
  let worstCategory: CategoryId | null = null;
  let worstChange = 0;
  (Object.keys(curByCategory) as CategoryId[]).forEach((cat) => {
    const cur = curByCategory[cat] ?? 0;
    const prev = prevByCategory[cat] ?? 0;
    if (cur < 200) return;
    const change = percentChange(cur, prev);
    if (change > worstChange) {
      worstChange = change;
      worstCategory = cat;
    }
  });

  if (worstCategory !== null) {
    const catLabel = CATEGORIES[worstCategory as CategoryId].label;
    if (worstChange >= 10) {
      return {
        id: "insight-category-up",
        tone: "warning",
        message: `เดือนนี้ค่า${catLabel}สูงกว่าเดือนก่อน ${worstChange}% ลองตั้งงบรายสัปดาห์ดูไหมครับ?`,
      };
    }
  }

  if (budget) {
    const totalSpent = sumByType(curTx, "expense");
    const usedPercent = Math.round((totalSpent / budget.totalLimit) * 100);
    if (usedPercent >= 90) {
      return {
        id: "insight-budget-warning",
        tone: "warning",
        message: `ใช้งบไปแล้ว ${usedPercent}% ของเดือนนี้ เหลืออีกไม่มาก ลองชะลอการใช้จ่ายดูนะครับ`,
      };
    }
    if (usedPercent <= 40) {
      return {
        id: "insight-budget-good",
        tone: "encourage",
        message: `เก่งมากครับ ใช้งบไปแค่ ${usedPercent}% ของเดือนนี้ รักษาจังหวะนี้ไว้นะ`,
      };
    }
  }

  return {
    id: "insight-default",
    tone: "info",
    message: "จดรายจ่ายสม่ำเสมอแบบนี้ น้องออมช่วยดูแลเงินให้คุณได้ดีขึ้นทุกวันเลยครับ",
  };
}

export function buildAnalyticsInsights(transactions: Transaction[], budget: Budget | null): string[] {
  const curMonth = currentMonthKey();
  const prevMonth = previousMonthKey();
  const curTx = filterByMonth(transactions, curMonth);
  const prevTx = filterByMonth(transactions, prevMonth);
  const insights: string[] = [];

  const transportCur = sumByCategory(curTx).transport ?? 0;
  const transportPrev = sumByCategory(prevTx).transport ?? 0;
  if (transportPrev > 0) {
    const change = percentChange(transportCur, transportPrev);
    if (change < 0) {
      insights.push(`ค่าเดินทางของคุณลดลง ${Math.abs(change)}% เมื่อเทียบกับเดือนที่แล้ว`);
    } else if (change > 10) {
      insights.push(`ค่าเดินทางของคุณเพิ่มขึ้น ${change}% เมื่อเทียบกับเดือนที่แล้ว`);
    }
  }

  const totalIncome = sumByType(curTx, "income") || 32000;
  const totalExpense = sumByType(curTx, "expense");
  const today = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailyRate = totalExpense / Math.max(1, today);
  const projected = Math.round(totalIncome - dailyRate * daysInMonth);
  insights.push(
    `หากรักษาระดับการใช้จ่ายนี้ คุณจะเหลือเงินประมาณ ${formatBaht(Math.max(0, projected))} เมื่อสิ้นเดือน`
  );

  const foodCur = sumByCategory(curTx).food ?? 0;
  if (budget) {
    const foodLimit = budget.categoryLimits.find((c) => c.category === "food")?.limit ?? 0;
    if (foodLimit > 0 && foodCur > foodLimit * 0.8) {
      insights.push(
        `ค่าอาหารใกล้เต็มงบที่ตั้งไว้แล้ว (${Math.round((foodCur / foodLimit) * 100)}%) ลองทำอาหารเองสัก 2-3 มื้อต่อสัปดาห์ดูนะ`
      );
    }
  }

  return insights;
}
