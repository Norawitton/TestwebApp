"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

function compactBaht(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}ล.`;
  if (abs >= 1_000) return `${(value / 1000).toFixed(0)}k`;
  return `${value}`;
}

export function DailySpendChart({ data }: { data: { day: number; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#EAF1F7" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: "#71818E" }}
          axisLine={false}
          tickLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#71818E" }}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={compactBaht}
        />
        <Tooltip
          formatter={(value) => [`฿${Number(value).toLocaleString("th-TH")}`, "รายจ่าย"]}
          labelFormatter={(d) => `วันที่ ${d}`}
          contentStyle={{ borderRadius: 12, border: "1px solid #EAF1F7", fontSize: 12 }}
        />
        <Line type="monotone" dataKey="amount" stroke="#1689F5" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MonthlyComparisonChart({
  data,
}: {
  data: { label: string; expense: number; income: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke="#EAF1F7" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#71818E" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 10, fill: "#71818E" }}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={compactBaht}
        />
        <Tooltip
          formatter={(value, name) => [
            `฿${Number(value).toLocaleString("th-TH")}`,
            name === "expense" ? "รายจ่าย" : "รายรับ",
          ]}
          contentStyle={{ borderRadius: 12, border: "1px solid #EAF1F7", fontSize: 12 }}
        />
        <Bar dataKey="expense" fill="#F36B5F" radius={[6, 6, 0, 0]} maxBarSize={16} />
        <Bar dataKey="income" fill="#20B978" radius={[6, 6, 0, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
