"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CategoryId } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { formatBaht } from "@/lib/format";

interface CategoryDonutProps {
  data: { category: CategoryId; amount: number }[];
  total: number;
  size?: number;
  // เดิมตรงกลางวงจะโชว์ "รวมทั้งหมด" = total เสมอ (ผลรวมของทุกสไลซ์ รวมรายรับ
  // ด้วย) ซึ่งพอเพิ่มสไลซ์รายรับเข้ามาแล้วตัวเลขตรงกลางเลยกลายเป็นผลรวม
  // รายรับ+รายจ่ายที่ตีความผิดได้ง่ายว่าเป็น "เงินคงเหลือ" — centerLabel/
  // centerValue ให้ผู้เรียกเลือกโชว์อย่างอื่นแทนได้ (เช่นเงินคงเหลือจริงๆ)
  // โดย `total` ยังคงใช้ตัดสินสไลซ์และเช็คสถานะไม่มีข้อมูลเหมือนเดิม
  centerLabel?: string;
  centerValue?: number;
  centerValueClassName?: string;
}

export function CategoryDonut({
  data,
  total,
  size = 180,
  centerLabel = "รวมทั้งหมด",
  centerValue,
  centerValueClassName = "text-ag-text",
}: CategoryDonutProps) {
  const chartData = data.map((d) => ({
    name: CATEGORIES[d.category].label,
    value: d.amount,
    color: CATEGORIES[d.category].color,
  }));
  const shownValue = centerValue ?? total;

  if (total === 0) {
    return (
      <div
        className="mx-auto flex flex-col items-center justify-center rounded-full border-[14px] border-ag-grayblue"
        style={{ width: size, height: size }}
      >
        <p className="text-xs text-ag-text-secondary">ยังไม่มีรายจ่าย</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            innerRadius={size * 0.32}
            outerRadius={size * 0.5}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
          >
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] text-ag-text-secondary">{centerLabel}</span>
        <span className={`ag-money text-lg font-bold ${centerValueClassName}`}>
          {formatBaht(shownValue, centerValue !== undefined ? { sign: true } : undefined)}
        </span>
      </div>
    </div>
  );
}
