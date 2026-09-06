// Formatting helpers — Thai Baht + Buddhist-era-aware date labels.

export function formatBaht(amount: number, opts?: { sign?: boolean }): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = opts?.sign && amount !== 0 ? (amount > 0 ? "+" : "-") : "";
  return `${sign}฿${formatted}`;
}

export function formatBahtCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `฿${(abs / 1_000_000).toFixed(1)}ล้าน`;
  if (abs >= 1_000) return `฿${(abs / 1000).toFixed(1)}พัน`;
  return `฿${abs.toFixed(0)}`;
}

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];
const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const THAI_DAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export function toBuddhistYear(year: number): number {
  return year + 543;
}

export function formatThaiDateShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]}`;
}

export function formatThaiDateFull(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${THAI_MONTHS_FULL[d.getMonth()]} ${toBuddhistYear(d.getFullYear())}`;
}

export function formatThaiDateWithDay(iso: string): string {
  const d = new Date(iso);
  return `วัน${THAI_DAY_NAMES_FULL[d.getDay()]}ที่ ${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]}`;
}

const THAI_DAY_NAMES_FULL = [
  "อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์",
];

export function formatThaiTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export function formatThaiMonthYear(monthKey: string): string {
  // monthKey like "2026-09"
  const [y, m] = monthKey.split("-").map(Number);
  return `${THAI_MONTHS_FULL[m - 1]} ${toBuddhistYear(y)}`;
}

export function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function isToday(iso: string): boolean {
  return isSameDay(iso, new Date().toISOString());
}

export function isYesterday(iso: string): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return isSameDay(iso, y.toISOString());
}

export function relativeDayLabel(iso: string): string {
  if (isToday(iso)) return "วันนี้";
  if (isYesterday(iso)) return "เมื่อวาน";
  return formatThaiDateWithDay(iso);
}

export function monthKeyOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// "YYYY-MM-DD" ตามเวลาท้องถิ่นของเครื่อง — ใช้จัดกลุ่มรายการตามวัน แทนการตัด
// สตริง ISO ตรงๆ (iso.slice(0,10)) ซึ่งเป็นวันที่แบบ UTC และจะผิดวันสำหรับ
// รายการที่บันทึกช่วงเที่ยงคืนถึงเช้าตรู่ตามเวลาไทย (UTC+7)
export function localDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(100, Math.round((part / whole) * 100));
}
