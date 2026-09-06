"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { Card } from "@/components/ui/Card";
import { Mascot } from "@/components/mascot/Mascot";
import { ShoppingItem, ShoppingCategory } from "@/lib/lifeTypes";
import {
  listShoppingItems,
  createShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  clearCheckedItems,
} from "@/lib/services/lifeServices";
import { Plus, Trash2, CheckSquare, Square, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

const CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  food: "อาหาร",
  household: "ของใช้ในบ้าน",
  personal: "ส่วนตัว",
  health: "สุขภาพ",
  other: "อื่นๆ",
};

const CATEGORY_COLORS: Record<ShoppingCategory, string> = {
  food: "#FFD64F",
  household: "#1689F5",
  personal: "#E78132",
  health: "#20B978",
  other: "#71818E",
};

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listShoppingItems();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(item: ShoppingItem) {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: !i.checked } : i));
    await toggleShoppingItem(item.id, !item.checked);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteShoppingItem(id);
  }

  async function handleClearChecked() {
    setItems((prev) => prev.filter((i) => !i.checked));
    await clearCheckedItems();
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <AppShell>
      <div className="rounded-b-[28px] bg-ag-navy px-5 pb-8 pt-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">รายการซื้อของ</p>
            <h1 className="mt-0.5 text-xl font-bold">
              {unchecked.length === 0 && items.length > 0
                ? "ซื้อครบแล้ว! 🛒"
                : unchecked.length > 0
                ? `ยังต้องซื้ออีก ${unchecked.length} รายการ`
                : "ยังไม่มีรายการ"}
            </h1>
          </div>
          <Mascot pose={unchecked.length === 0 && items.length > 0 ? "cheer" : "coin"} size={60} />
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">
        {/* Clear checked button */}
        {checked.length > 0 && (
          <button
            onClick={handleClearChecked}
            className="self-end text-xs font-semibold text-ag-coral active:opacity-70"
          >
            ลบที่ซื้อแล้ว ({checked.length})
          </button>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-ag-blue border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Mascot pose="wave" size={80} />
            <p className="text-sm text-ag-text-secondary">ยังไม่มีรายการซื้อของ</p>
            <p className="text-xs text-ag-text-secondary">กดปุ่ม + เพื่อเพิ่มรายการ</p>
          </div>
        ) : (
          <>
            {/* Unchecked items */}
            {unchecked.length > 0 && (
              <div className="flex flex-col gap-2">
                {unchecked.map((item) => <ShoppingRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />)}
              </div>
            )}

            {/* Checked items */}
            {checked.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-ag-text-secondary">ซื้อแล้ว</p>
                {checked.map((item) => <ShoppingRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />)}
              </div>
            )}
          </>
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
        <AddItemSheet
          onClose={() => setShowAdd(false)}
          onSaved={(item) => { setItems((prev) => [item, ...prev]); setShowAdd(false); }}
        />
      )}
    </AppShell>
  );
}

function ShoppingRow({ item, onToggle, onDelete }: {
  item: ShoppingItem;
  onToggle: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card padded={false} className={clsx("flex items-center gap-3 px-4 py-3.5", item.checked && "opacity-50")}>
      <button onClick={() => onToggle(item)} className="shrink-0 active:scale-90">
        {item.checked
          ? <CheckSquare size={22} color="#20B978" />
          : <Square size={22} color="#C4CDD6" />}
      </button>
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
      />
      <div className="flex-1 min-w-0">
        <p className={clsx("text-sm font-semibold text-ag-text", item.checked && "line-through")}>
          {item.name}
        </p>
        <p className="text-xs text-ag-text-secondary">
          {item.quantity}{item.unit ? ` ${item.unit}` : ""}
          {item.estimatedPrice ? ` · ≈฿${item.estimatedPrice.toLocaleString()}` : ""}
        </p>
      </div>
      <button onClick={() => onDelete(item.id)} className="shrink-0 p-1.5 active:scale-90">
        <Trash2 size={15} color="#C4CDD6" />
      </button>
    </Card>
  );
}

function AddItemSheet({ onClose, onSaved }: {
  onClose: () => void;
  onSaved: (item: ShoppingItem) => void;
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>("food");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("กรุณากรอกชื่อสินค้า"); return; }
    setSaving(true);
    try {
      const item = await createShoppingItem({
        name: name.trim(),
        quantity: quantity || "1",
        unit: unit.trim() || undefined,
        estimatedPrice: estimatedPrice ? Number(estimatedPrice) : undefined,
        category,
        listName: "ทั่วไป",
      });
      onSaved(item);
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
        <h2 className="mb-4 text-lg font-bold text-ag-text">เพิ่มรายการซื้อของ</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">ชื่อสินค้า *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="เช่น ไข่ไก่, แชมพู..."
              className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
            />
            {error && <p className="mt-1 text-xs text-ag-coral">{error}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ag-text">จำนวน</label>
              <input
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ag-text">หน่วย</label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="กก./ชิ้น"
                className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ag-text">ราคา ≈</label>
              <input
                inputMode="decimal"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="฿"
                className="h-11 w-full rounded-2xl border border-ag-grayblue px-4 text-sm text-ag-text outline-none focus:border-ag-blue"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">หมวดหมู่</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ShoppingCategory)}
                className="h-11 w-full appearance-none rounded-2xl border border-ag-grayblue px-4 pr-8 text-sm text-ag-text outline-none"
              >
                {(Object.entries(CATEGORY_LABELS) as [ShoppingCategory, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <ChevronDown size={14} color="#71818E" className="pointer-events-none absolute right-3 top-3.5" />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="h-12 w-full rounded-2xl bg-ag-navy text-sm font-bold text-white disabled:opacity-60 active:scale-[0.98]"
          >
            {saving ? "กำลังบันทึก..." : "เพิ่มในรายการ"}
          </button>
        </div>
      </div>
    </div>
  );
}
