"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { MascotTipCard } from "@/components/ui/MascotTipCard";
import { useAppData } from "@/hooks/useAppData";
import { currentMonthKey, filterByMonth, sumByCategory, sumByType } from "@/lib/analytics";
import { formatBaht, percent } from "@/lib/format";
import { CATEGORIES, EXPENSE_CATEGORY_LIST } from "@/lib/categories";
import { CategoryId } from "@/lib/types";
import { Plus, X } from "lucide-react";
import { clsx } from "clsx";

// แปลงข้อความช่องกรอกเป็นจำนวนเงินที่ใช้ได้ (>= 0) — คืนค่า null ถ้ากรอกไม่ถูกต้อง
// (ว่าง/ไม่ใช่ตัวเลข/ติดลบ) แทนที่จะใช้ `Number(input) || fallback` เพราะ 0 เป็นค่า
// falsy ใน JS ทำให้พิมพ์ 0 แล้วเงียบๆ กลับไปใช้ค่าเดิมแทนที่จะบันทึกเป็น 0 จริงๆ
function parseAmountInput(input: string): number | null {
  if (input.trim() === "") return null;
  const n = Number(input);
  return Number.isNaN(n) || n < 0 ? null : n;
}

export default function BudgetPage() {
  const { transactions, budget, goals, loading, saveBudget, addGoal, editGoal, removeGoal } = useAppData();
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState("");
  const [totalError, setTotalError] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [bumpingGoalId, setBumpingGoalId] = useState<string | null>(null);
  const [showAddCategoryBudget, setShowAddCategoryBudget] = useState(false);

  const monthKey = currentMonthKey();
  const monthTx = useMemo(() => filterByMonth(transactions, monthKey), [transactions, monthKey]);
  const totalSpent = sumByType(monthTx, "expense");
  const byCategory = useMemo(() => sumByCategory(monthTx), [monthTx]);
  const availableCategoriesForBudget = useMemo(
    () => EXPENSE_CATEGORY_LIST.filter((c) => !(budget?.categoryLimits ?? []).some((cl) => cl.category === c)),
    [budget]
  );

  if (loading || !budget) {
    return (
      <AppShell>
        <ScreenHeader title="งบประมาณและเป้าหมาย" />
        <div className="animate-pulse space-y-4 px-5">
          <div className="h-32 rounded-[22px] bg-ag-grayblue" />
          <div className="h-64 rounded-[22px] bg-ag-grayblue" />
        </div>
      </AppShell>
    );
  }

  const totalPercent = percent(totalSpent, budget.totalLimit);
  const alertTone = totalPercent >= 100 ? "warning" : totalPercent >= 90 ? "warning" : totalPercent >= 70 ? "encourage" : "info";

  return (
    <AppShell>
      <ScreenHeader title="งบประมาณและเป้าหมาย" />

      <div className="flex flex-col gap-5 px-5 pb-4">
        {/* Overall budget */}
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold text-ag-text">งบประมาณรวมรายเดือน</h2>
            <button
              onClick={() => {
                setEditingTotal(true);
                setTotalError("");
                setTotalInput(budget.totalLimit.toString());
              }}
              className="text-xs font-semibold text-ag-blue"
            >
              แก้ไข
            </button>
          </div>

          {editingTotal ? (
            <div>
              <div className="flex items-center gap-2">
                <input
                  inputMode="numeric"
                  value={totalInput}
                  onChange={(e) => { setTotalInput(e.target.value.replace(/[^\d]/g, "")); setTotalError(""); }}
                  className="h-11 flex-1 rounded-2xl border border-ag-grayblue px-4 text-sm outline-none focus:border-ag-blue"
                />
                <Button
                  size="md"
                  onClick={async () => {
                    const parsed = parseAmountInput(totalInput);
                    if (parsed === null) {
                      setTotalError("กรุณากรอกจำนวนเงินให้ถูกต้อง");
                      return;
                    }
                    try {
                      await saveBudget({ totalLimit: parsed });
                      setEditingTotal(false);
                    } catch {
                      setTotalError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
                    }
                  }}
                >
                  บันทึก
                </Button>
              </div>
              {totalError && <p className="mt-1.5 text-xs font-semibold text-ag-coral">{totalError}</p>}
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between">
                <p className="ag-money text-2xl font-bold text-ag-text">{formatBaht(totalSpent)}</p>
                <p className="text-sm text-ag-text-secondary">จาก {formatBaht(budget.totalLimit)}</p>
              </div>
              <div className="mt-2">
                <ProgressBar percent={totalPercent} showThresholds />
              </div>
              <p className="mt-1.5 text-xs text-ag-text-secondary">ใช้ไปแล้ว {totalPercent}%</p>
            </>
          )}
        </Card>

        {totalPercent >= 70 && (
          <MascotTipCard
            tone={alertTone as "warning" | "encourage" | "info"}
            pose={totalPercent >= 90 ? "worried" : "point"}
            message={
              totalPercent >= 100
                ? "ใช้งบเดือนนี้เกินแล้วนะครับ ลองดูรายจ่ายที่ลดได้ก่อนสิ้นเดือน"
                : totalPercent >= 90
                ? "ใกล้เต็มงบเดือนนี้แล้วครับ เหลืออีกไม่มาก ระวังการใช้จ่ายเพิ่มนะ"
                : "ใช้งบไปแล้ว 70% ของเดือนนี้ ลองวางแผนรายจ่ายที่เหลือดูนะครับ"
            }
          />
        )}

        {/* Category budgets */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-ag-text">งบประมาณแยกหมวดหมู่</h2>
            {availableCategoriesForBudget.length > 0 && (
              <button
                onClick={() => setShowAddCategoryBudget(true)}
                className="flex items-center gap-1 text-xs font-semibold text-ag-blue"
              >
                <Plus size={14} /> เพิ่มหมวดหมู่
              </button>
            )}
          </div>
          {budget.categoryLimits.length === 0 ? (
            <p className="text-sm text-ag-text-secondary">
              ยังไม่มีงบประมาณแยกหมวดหมู่ กด &quot;เพิ่มหมวดหมู่&quot; เพื่อเริ่มตั้งงบ
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {budget.categoryLimits.map((cl) => {
                const spent = byCategory[cl.category] ?? 0;
                const pct = percent(spent, cl.limit);
                const isEditing = editingCategory === cl.category;
                return (
                  <div key={cl.category}>
                    <div className="mb-1.5 flex items-center gap-2.5">
                      <CategoryIcon category={cl.category} size={36} iconSize={16} />
                      <span className="flex-1 text-sm font-semibold text-ag-text">
                        {CATEGORIES[cl.category].label}
                      </span>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            inputMode="numeric"
                            value={categoryInput}
                            onChange={(e) => { setCategoryInput(e.target.value.replace(/[^\d]/g, "")); setCategoryError(""); }}
                            className="h-8 w-20 rounded-lg border border-ag-grayblue px-2 text-xs outline-none"
                          />
                          <button
                            onClick={async () => {
                              const parsed = parseAmountInput(categoryInput);
                              if (parsed === null) {
                                setCategoryError("จำนวนไม่ถูกต้อง");
                                return;
                              }
                              const next = budget.categoryLimits.map((c) =>
                                c.category === cl.category ? { ...c, limit: parsed } : c
                              );
                              try {
                                await saveBudget({ categoryLimits: next });
                                setEditingCategory(null);
                              } catch {
                                setCategoryError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
                              }
                            }}
                            className="text-xs font-bold text-ag-blue"
                          >
                            บันทึก
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingCategory(cl.category);
                              setCategoryError("");
                              setCategoryInput(cl.limit.toString());
                            }}
                            className="ag-money text-xs font-semibold text-ag-text-secondary"
                          >
                            {formatBaht(spent)} / {formatBaht(cl.limit)}
                          </button>
                          <button
                            onClick={() =>
                              saveBudget({ categoryLimits: budget.categoryLimits.filter((c) => c.category !== cl.category) }).catch(
                                (err) => console.error("ลบงบหมวดหมู่ไม่สำเร็จ:", err)
                              )
                            }
                            aria-label={`ลบงบ${CATEGORIES[cl.category].label}`}
                            className="text-ag-text-secondary"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                    {isEditing && categoryError && (
                      <p className="mb-1.5 text-xs font-semibold text-ag-coral">{categoryError}</p>
                    )}
                    <ProgressBar percent={pct} height={8} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Saving goals */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ag-text">เป้าหมายการออม</h2>
          <button
            onClick={() => setShowGoalForm(true)}
            className="flex items-center gap-1 text-xs font-semibold text-ag-blue"
          >
            <Plus size={14} /> เพิ่มเป้าหมาย
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {goals.map((g) => {
            const pct = percent(g.currentAmount, g.targetAmount);
            return (
              <Card key={g.id}>
                <div className="mb-2 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl"
                    style={{ backgroundColor: `${g.color}1F` }}
                  >
                    {g.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ag-text">{g.name}</p>
                    <p className="ag-money text-xs text-ag-text-secondary">
                      {formatBaht(g.currentAmount)} จาก {formatBaht(g.targetAmount)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeGoal(g.id).catch((err) => console.error("ลบเป้าหมายไม่สำเร็จ:", err))}
                    aria-label="ลบเป้าหมาย"
                    className="text-ag-text-secondary"
                  >
                    <X size={16} />
                  </button>
                </div>
                <ProgressBar percent={pct} />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={async () => {
                      // กันกดรัวๆ: ถ้าไม่ล็อกปุ่มระหว่างบันทึก การกด 2 ครั้งเร็วๆ
                      // จะอ่าน g.currentAmount ค่าเดิม (ก่อน refresh) ทั้งคู่ ทำให้
                      // ยอดเพิ่มแค่ +500 ครั้งเดียวทั้งที่กดไป 2 ครั้ง
                      if (bumpingGoalId === g.id) return;
                      setBumpingGoalId(g.id);
                      try {
                        await editGoal(g.id, { currentAmount: g.currentAmount + 500 });
                      } catch (err) {
                        console.error("เพิ่มยอดเป้าหมายไม่สำเร็จ:", err);
                      } finally {
                        setBumpingGoalId(null);
                      }
                    }}
                    disabled={bumpingGoalId === g.id}
                    className="rounded-full bg-ag-grayblue px-3 py-1 text-xs font-semibold text-ag-text disabled:opacity-50"
                  >
                    +฿500
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {showGoalForm && (
        <NewGoalSheet
          onClose={() => setShowGoalForm(false)}
          onCreate={async (goal) => {
            await addGoal(goal);
            setShowGoalForm(false);
          }}
        />
      )}

      {showAddCategoryBudget && (
        <AddCategoryBudgetSheet
          categories={availableCategoriesForBudget}
          onClose={() => setShowAddCategoryBudget(false)}
          onCreate={async ({ category, limit }) => {
            await saveBudget({ categoryLimits: [...budget.categoryLimits, { category, limit }] });
            setShowAddCategoryBudget(false);
          }}
        />
      )}
    </AppShell>
  );
}

function NewGoalSheet({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (goal: { name: string; targetAmount: number; currentAmount: number; emoji: string; color: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const EMOJIS = ["🎯", "🏖️", "🏠", "🚗", "🎓", "💍", "📱", "🛟"];

  async function handleCreate() {
    if (saving) return; // กันกดซ้ำระหว่างบันทึก ไม่งั้นได้เป้าหมายซ้ำ 2 อัน
    const numeric = Number(target);
    if (!name.trim()) {
      setError("กรุณาตั้งชื่อเป้าหมาย");
      return;
    }
    if (!target || Number.isNaN(numeric) || numeric <= 0) {
      setError("กรุณากรอกจำนวนเงินเป้าหมายให้ถูกต้อง");
      return;
    }
    setSaving(true);
    try {
      await onCreate({ name: name.trim(), targetAmount: numeric, currentAmount: 0, emoji, color: "#1689F5" });
    } catch {
      setError("สร้างเป้าหมายไม่สำเร็จ ลองใหม่อีกครั้ง");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button aria-label="ปิด" onClick={onClose} className="absolute inset-0 bg-ag-navy/50" />
      <div className="relative z-10 w-full max-w-[480px] rounded-t-[28px] bg-white p-5 pb-8 ag-animate-slide-up">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ag-grayblue" />
        <h2 className="mb-4 text-lg font-bold text-ag-text">สร้างเป้าหมายการออม</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={clsx(
                "flex h-11 w-11 items-center justify-center rounded-2xl bg-ag-grayblue text-xl",
                emoji === e && "ring-2 ring-ag-blue"
              )}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-sm font-semibold text-ag-text">ชื่อเป้าหมาย</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น ทริปเที่ยวเชียงใหม่"
          className="mb-4 h-12 w-full rounded-2xl border border-ag-grayblue px-4 text-sm outline-none focus:border-ag-blue"
        />

        <label className="mb-1.5 block text-sm font-semibold text-ag-text">จำนวนเงินเป้าหมาย</label>
        <input
          inputMode="numeric"
          value={target}
          onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="0"
          className="mb-1 h-12 w-full rounded-2xl border border-ag-grayblue px-4 text-sm outline-none focus:border-ag-blue"
        />
        {error && <p className="mb-3 text-xs font-semibold text-ag-coral">{error}</p>}

        <Button variant="primary" size="lg" fullWidth onClick={handleCreate} disabled={saving} className="mt-3">
          {saving ? "กำลังบันทึก..." : "สร้างเป้าหมาย"}
        </Button>
      </div>
    </div>
  );
}

function AddCategoryBudgetSheet({
  categories,
  onClose,
  onCreate,
}: {
  categories: CategoryId[];
  onClose: () => void;
  onCreate: (input: { category: CategoryId; limit: number }) => Promise<void>;
}) {
  const [category, setCategory] = useState<CategoryId>(categories[0]);
  const [limitInput, setLimitInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (saving) return;
    const parsed = parseAmountInput(limitInput);
    if (parsed === null || parsed <= 0) {
      setError("กรุณากรอกวงเงินให้ถูกต้อง");
      return;
    }
    setSaving(true);
    try {
      await onCreate({ category, limit: parsed });
    } catch {
      setError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button aria-label="ปิด" onClick={onClose} className="absolute inset-0 bg-ag-navy/50" />
      <div className="relative z-10 w-full max-w-[480px] rounded-t-[28px] bg-white p-5 pb-8 ag-animate-slide-up">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ag-grayblue" />
        <h2 className="mb-4 text-lg font-bold text-ag-text">เพิ่มงบประมาณตามหมวดหมู่</h2>

        <label className="mb-1.5 block text-sm font-semibold text-ag-text">หมวดหมู่</label>
        <div className="mb-4 grid grid-cols-4 gap-3">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={clsx(
                  "flex h-14 w-14 items-center justify-center rounded-2xl transition-all",
                  category === c && "ring-2 ring-ag-blue ring-offset-2"
                )}
              >
                <CategoryIcon category={c} size={52} iconSize={24} />
              </div>
              <span className="text-center text-[11px] leading-tight text-ag-text-secondary">
                {CATEGORIES[c].label}
              </span>
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-sm font-semibold text-ag-text">วงเงินต่อเดือน</label>
        <input
          inputMode="numeric"
          value={limitInput}
          onChange={(e) => { setLimitInput(e.target.value.replace(/[^\d]/g, "")); setError(""); }}
          placeholder="0"
          className="mb-1 h-12 w-full rounded-2xl border border-ag-grayblue px-4 text-sm outline-none focus:border-ag-blue"
        />
        {error && <p className="mb-3 text-xs font-semibold text-ag-coral">{error}</p>}

        <Button variant="primary" size="lg" fullWidth onClick={handleCreate} disabled={saving} className="mt-3">
          {saving ? "กำลังบันทึก..." : "เพิ่มงบประมาณ"}
        </Button>
      </div>
    </div>
  );
}
