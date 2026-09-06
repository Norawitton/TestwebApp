"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { Card } from "@/components/ui/Card";
import { Mascot } from "@/components/mascot/Mascot";
import { Task, TaskCategory, TaskPriority } from "@/lib/lifeTypes";
import {
  listTasks,
  createTask,
  toggleTask,
  deleteTask,
} from "@/lib/services/lifeServices";
import { Plus, Trash2, CheckCircle2, Circle, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  chore: "งานบ้าน",
  errand: "ธุระ",
  finance: "การเงิน",
  health: "สุขภาพ",
  other: "อื่นๆ",
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "ต่ำ", color: "#71818E" },
  normal: { label: "ปกติ", color: "#1689F5" },
  high: { label: "เร่งด่วน", color: "#F36B5F" },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("pending");

  const load = useCallback(async () => {
    try {
      const data = await listTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(task: Task) {
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, done: !t.done } : t));
    await toggleTask(task.id, !task.done);
  }

  async function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTask(id);
  }

  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done
  );
  const pendingCount = tasks.filter((t) => !t.done).length;

  return (
    <AppShell>
      <div className="rounded-b-[28px] bg-ag-navy px-5 pb-8 pt-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">สิ่งที่ต้องทำ</p>
            <h1 className="mt-0.5 text-xl font-bold">
              {pendingCount > 0 ? `รออยู่ ${pendingCount} รายการ` : "เสร็จหมดแล้ว! 🎉"}
            </h1>
          </div>
          <Mascot pose={pendingCount === 0 ? "cheer" : "point"} size={60} />
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">
        {/* Filter tabs */}
        <div className="flex rounded-2xl bg-white/60 p-1 shadow-sm border border-ag-grayblue/30">
          {(["pending", "done", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "flex-1 rounded-xl py-2 text-xs font-bold transition-all",
                filter === f ? "bg-ag-navy text-white shadow" : "text-ag-text-secondary"
              )}
            >
              {f === "pending" ? "รอทำ" : f === "done" ? "เสร็จแล้ว" : "ทั้งหมด"}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-ag-blue border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Mascot pose="wave" size={80} />
            <p className="text-sm text-ag-text-secondary">
              {filter === "pending" ? "ไม่มีงานค้างอยู่ เยี่ยมมาก!" : "ยังไม่มีรายการ"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((task) => (
              <Card key={task.id} padded={false}
                className={clsx("flex items-center gap-3 px-4 py-3.5 transition-opacity", task.done && "opacity-60")}
              >
                <button onClick={() => handleToggle(task)} className="shrink-0 active:scale-90">
                  {task.done
                    ? <CheckCircle2 size={24} color="#20B978" />
                    : <Circle size={24} color="#C4CDD6" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm font-semibold text-ag-text truncate", task.done && "line-through")}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-ag-text-secondary">
                      {CATEGORY_LABELS[task.category]}
                    </span>
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: PRIORITY_CONFIG[task.priority].color }}
                    >
                      {PRIORITY_CONFIG[task.priority].label}
                    </span>
                    {task.dueDate && (
                      <span className="text-[10px] text-ag-text-secondary">
                        ครบ {new Date(task.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(task.id)} className="shrink-0 p-1.5 active:scale-90">
                  <Trash2 size={16} color="#C4CDD6" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-[calc(76px+env(safe-area-inset-bottom)+16px)] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-ag-blue shadow-[0_8px_20px_rgba(22,137,245,0.4)] active:scale-90"
      >
        <Plus size={26} color="white" strokeWidth={2.5} />
      </button>

      {/* Add task sheet */}
      {showAdd && (
        <AddTaskSheet
          onClose={() => setShowAdd(false)}
          onSaved={async (task) => {
            setTasks((prev) => [task, ...prev]);
            setShowAdd(false);
            setFilter("pending");
          }}
        />
      )}
    </AppShell>
  );
}

function AddTaskSheet({ onClose, onSaved }: {
  onClose: () => void;
  onSaved: (task: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("other");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!title.trim()) { setError("กรุณากรอกชื่องาน"); return; }
    setSaving(true);
    try {
      const task = await createTask({
        title: title.trim(),
        category,
        priority,
        dueDate: dueDate || undefined,
      });
      onSaved(task);
    } catch {
      setError("บันทึกไม่สำเร็จ ลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button aria-label="ปิด" onClick={onClose} className="absolute inset-0 bg-ag-navy/50" />
      <div className="relative z-10 w-full max-w-[480px] rounded-t-[28px] bg-white p-5 pb-8 ag-animate-slide-up">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ag-grayblue" />
        <h2 className="mb-4 text-lg font-bold text-ag-text">เพิ่มงานใหม่</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">ชื่องาน *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              placeholder="เช่น ซื้อของ, โทรหาหมอ..."
              className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
            />
            {error && <p className="mt-1 text-xs text-ag-coral">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ag-text">หมวดหมู่</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="h-11 w-full appearance-none rounded-2xl border border-ag-grayblue px-4 pr-8 text-sm text-ag-text outline-none"
                >
                  {(Object.entries(CATEGORY_LABELS) as [TaskCategory, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <ChevronDown size={14} color="#71818E" className="pointer-events-none absolute right-3 top-3.5" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ag-text">ความสำคัญ</label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="h-11 w-full appearance-none rounded-2xl border border-ag-grayblue px-4 pr-8 text-sm text-ag-text outline-none"
                >
                  {(Object.entries(PRIORITY_CONFIG) as [TaskPriority, { label: string }][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} color="#71818E" className="pointer-events-none absolute right-3 top-3.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">วันครบกำหนด (ไม่บังคับ)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="h-12 w-full rounded-2xl bg-ag-navy text-sm font-bold text-white disabled:opacity-60 active:scale-[0.98]"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกงาน"}
          </button>
        </div>
      </div>
    </div>
  );
}
