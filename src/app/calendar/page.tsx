"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { Card } from "@/components/ui/Card";
import { Mascot } from "@/components/mascot/Mascot";
import { CalendarEvent, EventCategory } from "@/lib/lifeTypes";
import { listEvents, createEvent, deleteEvent } from "@/lib/services/lifeServices";
import { Plus, Trash2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string }> = {
  bill: { label: "ค่าใช้จ่าย", color: "#F36B5F" },
  appointment: { label: "นัดหมาย", color: "#1689F5" },
  reminder: { label: "แจ้งเตือน", color: "#FFD64F" },
  personal: { label: "ส่วนตัว", color: "#20B978" },
  other: { label: "อื่นๆ", color: "#71818E" },
};

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const THAI_DAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listEvents(monthKey(year, month))
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch((e) => console.error(e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Events by day
  const eventsByDay: Record<number, CalendarEvent[]> = {};
  events.forEach((ev) => {
    const d = new Date(ev.startAt).getDate();
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d].push(ev);
  });

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  async function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteEvent(id);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <AppShell>
      <div className="rounded-b-[28px] bg-ag-navy px-5 pb-6 pt-8 text-white">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/20">
            <ChevronLeft size={18} color="white" />
          </button>
          <div className="text-center">
            <p className="font-bold text-lg">{THAI_MONTHS[month]}</p>
            <p className="text-sm text-white/70">{year + 543}</p>
          </div>
          <button onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/20">
            <ChevronRight size={18} color="white" />
          </button>
        </div>

        {/* Day header */}
        <div className="mt-5 grid grid-cols-7 text-center">
          {THAI_DAYS_SHORT.map((d) => (
            <div key={d} className="text-[11px] font-semibold text-white/50">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="mt-2 grid grid-cols-7 gap-y-1 text-center">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            const isSelected = day === selectedDay;
            const hasEvents = !!eventsByDay[day];
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={clsx(
                  "mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  isSelected ? "bg-ag-yellow text-ag-navy" :
                  isToday ? "bg-white/20 text-white" : "text-white/80"
                )}
              >
                {day}
                {hasEvents && !isSelected && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-ag-yellow" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-3">
        {selectedDay && (
          <p className="text-sm font-bold text-ag-text">
            {selectedDay} {THAI_MONTHS[month]} {year + 543}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-ag-blue border-t-transparent" />
          </div>
        ) : selectedDay ? (
          selectedEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Mascot pose="wave" size={64} />
              <p className="text-sm text-ag-text-secondary">ไม่มีกิจกรรมวันนี้</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedEvents.map((ev) => (
                <EventCard key={ev.id} event={ev} onDelete={handleDelete} />
              ))}
            </div>
          )
        ) : (
          // Show all events for month
          events.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Mascot pose="wave" size={64} />
              <p className="text-sm text-ag-text-secondary">ยังไม่มีกิจกรรมในเดือนนี้</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} onDelete={handleDelete} />
              ))}
            </div>
          )
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-[calc(76px+env(safe-area-inset-bottom)+16px)] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-ag-blue shadow-[0_8px_20px_rgba(22,137,245,0.4)] active:scale-90"
      >
        <Plus size={26} color="white" strokeWidth={2.5} />
      </button>

      {showAdd && (
        <AddEventSheet
          defaultDate={selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : ""}
          onClose={() => setShowAdd(false)}
          onSaved={(ev) => {
            setEvents((prev) => [...prev, ev].sort((a, b) => a.startAt.localeCompare(b.startAt)));
            setShowAdd(false);
          }}
        />
      )}
    </AppShell>
  );
}

function EventCard({ event, onDelete }: { event: CalendarEvent; onDelete: (id: string) => void }) {
  const cfg = CATEGORY_CONFIG[event.category];
  const start = new Date(event.startAt);
  return (
    <Card padded={false} className="flex items-center gap-3 px-4 py-3.5">
      <div className="h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cfg.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ag-text truncate">{event.title}</p>
        <p className="text-xs text-ag-text-secondary">
          {event.allDay ? "ทั้งวัน" : start.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
          {" · "}{cfg.label}
        </p>
        {event.description && (
          <p className="mt-0.5 text-xs text-ag-text-secondary truncate">{event.description}</p>
        )}
      </div>
      <button onClick={() => onDelete(event.id)} className="shrink-0 p-1.5 active:scale-90">
        <Trash2 size={15} color="#C4CDD6" />
      </button>
    </Card>
  );
}

function AddEventSheet({ defaultDate, onClose, onSaved }: {
  defaultDate: string;
  onClose: () => void;
  onSaved: (ev: CalendarEvent) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate || today);
  const [time, setTime] = useState("09:00");
  const [allDay, setAllDay] = useState(false);
  const [category, setCategory] = useState<EventCategory>("personal");
  const [color, setColor] = useState("#1689F5");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const COLORS = ["#1689F5", "#20B978", "#F36B5F", "#FFD64F", "#6C63FF", "#E78132"];

  async function handleSave() {
    if (!title.trim()) { setError("กรุณากรอกชื่อกิจกรรม"); return; }
    if (!date) { setError("กรุณาเลือกวันที่"); return; }
    setSaving(true);
    try {
      const startAt = allDay ? `${date}T00:00:00.000Z` : `${date}T${time}:00.000Z`;
      const ev = await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        startAt,
        allDay,
        color,
        category,
      });
      onSaved(ev);
    } catch {
      setError("บันทึกไม่สำเร็จ ลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button aria-label="ปิด" onClick={onClose} className="absolute inset-0 bg-ag-navy/50" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] bg-white p-5 pb-8 ag-animate-slide-up">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ag-grayblue" />
        <h2 className="mb-4 text-lg font-bold text-ag-text">เพิ่มกิจกรรม</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">ชื่อกิจกรรม *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              placeholder="เช่น จ่ายค่าไฟ, นัดหมอ..."
              className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
            />
            {error && <p className="mt-1 text-xs text-ag-coral">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ag-text">วันที่ *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
              />
            </div>
            {!allDay && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ag-text">เวลา</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 accent-ag-blue"
            />
            <span className="text-sm font-semibold text-ag-text">ทั้งวัน</span>
          </label>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">ประเภท</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="h-11 w-full appearance-none rounded-2xl border border-ag-grayblue px-4 pr-8 text-sm text-ag-text outline-none"
              >
                {(Object.entries(CATEGORY_CONFIG) as [EventCategory, { label: string }][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown size={14} color="#71818E" className="pointer-events-none absolute right-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">สี</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={clsx("h-8 w-8 rounded-full transition-transform active:scale-90", color === c && "ring-2 ring-offset-2 ring-ag-navy")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">รายละเอียด (ไม่บังคับ)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม..."
              className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="h-12 w-full rounded-2xl bg-ag-navy text-sm font-bold text-white disabled:opacity-60 active:scale-[0.98]"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
          </button>
        </div>
      </div>
    </div>
  );
}
