import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "./firebase.js";
import { ref, set, onValue, off } from "firebase/database";
import {
  Home as HomeIcon, ShoppingCart, Calendar as CalendarIcon, Wallet,
  Plus, X, Check, Trash2, PenLine, ChevronLeft, ChevronRight,
  Camera, ChevronDown, Grid3x3, List as ListIcon, Smile,
  UtensilsCrossed, Zap, Home as HomeIconSmall, Car, HeartPulse,
  Film, MoreHorizontal, Banknote, Briefcase, TrendingUp, CircleDollarSign,
  CalendarClock, ListChecks, Circle, CheckCircle2, Sparkles,
} from "lucide-react";

/* =========================================================================
   HOMIE — Household management app for two people, each with their own
   profile, sharing a common shopping list, calendar, to-dos, and finance.
   ========================================================================= */

// ---------- Design tokens ----------

const COLORS = {
  bg: "#FFF9F0",
  surface: "#FFFFFF",
  ink: "#2D2A26",
  inkSoft: "#8A8378",
  inkFaint: "#C4BCAE",
  line: "#F0E6D6",
  lineStrong: "#E8D9C0",
  brand: "#FF8C5A",
  brandSoft: "#FFE4D3",
  owed: "#FF6B8A",
  settled: "#00C896",
  amber: "#FFB648",
  shadow: "0 6px 20px rgba(45,42,38,0.06)",
};

const PROFILE_PALETTE = [
  { id: "coral", hex: "#FF8C5A" },
  { id: "mint", hex: "#00C896" },
  { id: "sky", hex: "#4FB0E8" },
  { id: "berry", hex: "#FF6B8A" },
  { id: "sun", hex: "#FFB648" },
  { id: "grape", hex: "#B18CE8" },
];

const FONT_SERIF = "'Baloo 2', sans-serif";
const FONT_SANS = "'Inter', sans-serif";

const SHOPPING_CATEGORIES = [
  { id: "food", label: "ของกิน" },
  { id: "household", label: "ของใช้ในบ้าน" },
  { id: "health", label: "สุขภาพ" },
];

const EXPENSE_CATEGORIES = [
  { id: "food", label: "อาหาร", icon: UtensilsCrossed, color: "#FFB648" },
  { id: "utilities", label: "ค่าน้ำ-ไฟ-เน็ต", icon: Zap, color: "#4FB0E8" },
  { id: "household", label: "ของใช้ในบ้าน", icon: HomeIconSmall, color: "#00C896" },
  { id: "transport", label: "เดินทาง", icon: Car, color: "#B18CE8" },
  { id: "health", label: "สุขภาพ", icon: HeartPulse, color: "#FF6B8A" },
  { id: "leisure", label: "บันเทิง", icon: Film, color: "#FF8C5A" },
  { id: "investing", label: "การลงทุน", icon: TrendingUp, color: "#2FAE8E" },
  { id: "other", label: "อื่นๆ", icon: MoreHorizontal, color: "#8A8378" },
];

const INCOME_CATEGORIES = [
  { id: "salary", label: "เงินเดือน", icon: Banknote, color: "#00C896" },
  { id: "freelance", label: "งานฟรีแลนซ์", icon: Briefcase, color: "#4FB0E8" },
  { id: "investment", label: "เงินลงทุน", icon: TrendingUp, color: "#2FAE8E" },
  { id: "other_income", label: "รายรับอื่นๆ", icon: CircleDollarSign, color: "#FFB648" },
];

const MOOD_OPTIONS = [
  { id: "happy", label: "มีความสุข", color: "#FF6B8A", shape: "circle" },
  { id: "calm", label: "สงบ", color: "#B18CE8", shape: "squircle" },
  { id: "sad", label: "เศร้า", color: "#4FB0E8", shape: "squircle" },
  { id: "angry", label: "หงุดหงิด", color: "#FF7A4A", shape: "diamond" },
  { id: "tired", label: "เหนื่อย", color: "#FFB648", shape: "circle" },
];

const MONTH_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const WEEKDAY_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const todayISO = () => new Date().toISOString().slice(0, 10);
const THB = (n) => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(n || 0);

function catInfo(id, type) {
  const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find((c) => c.id === id) || { label: "อื่นๆ", icon: MoreHorizontal, color: COLORS.inkSoft };
}

// ---------- Storage (localStorage + Firebase Realtime DB) ----------

// Maps localStorage key → Firebase path segment (activeProfile stays local only)
const FB_KEY = {};  // populated after KEYS is defined
let _roomCode = null; // set once when room is established

const KEYS = {
  profiles: "homie:profiles",
  activeProfile: "homie:active-profile",
  shopping: "homie:shopping",
  events: "homie:events",
  todos: "homie:todos",
  moods: "homie:moods",
  transactions: "homie:transactions",
  budgets: "homie:budgets",
  roomCode: "homie:room-code",
};

// Build Firebase path mapping (shared data only; activeProfile & roomCode stay local)
FB_KEY[KEYS.profiles]     = "profiles";
FB_KEY[KEYS.shopping]     = "shopping";
FB_KEY[KEYS.events]       = "events";
FB_KEY[KEYS.todos]        = "todos";
FB_KEY[KEYS.moods]        = "moods";
FB_KEY[KEYS.transactions] = "transactions";
FB_KEY[KEYS.budgets]      = "budgets";

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("save failed", key, e);
  }
  // Sync shared data to Firebase when a room is active
  const fbPath = FB_KEY[key];
  if (_roomCode && fbPath) {
    set(ref(db, `rooms/${_roomCode}/${fbPath}`), value).catch(console.error);
  }
}

// ---------- Shared small components ----------

function Segmented({ options, value, onChange }) {
  return (
    <div style={{
      display: "flex", background: COLORS.line, borderRadius: 12, padding: 3,
      overflowX: "auto", WebkitOverflowScrolling: "touch", gap: 2,
    }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          style={{
            flex: "1 0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px 14px", border: "none", borderRadius: 9, cursor: "pointer", whiteSpace: "nowrap",
            fontFamily: FONT_SANS, fontSize: 13, fontWeight: 700,
            background: value === opt.id ? COLORS.surface : "transparent",
            color: value === opt.id ? COLORS.brand : COLORS.inkSoft,
            boxShadow: value === opt.id ? "0 2px 6px rgba(45,42,38,0.10)" : "none",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
        >
          {opt.icon ? <opt.icon size={14} /> : null}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Modal({ onClose, children, width = 420 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(34,36,31,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 60, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.bg, border: `1px solid ${COLORS.line}`, borderRadius: 18,
          width: "100%", maxWidth: width, padding: 22, fontFamily: FONT_SANS,
          maxHeight: "85vh", overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <h2 style={{ fontFamily: FONT_SERIF, fontSize: 21, fontWeight: 600, margin: 0, color: COLORS.ink }}>
        {title}
      </h2>
      <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.inkSoft }}>
        <X size={20} />
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", fontSize: 13, color: COLORS.inkSoft, marginBottom: 14 }}>
      {label}
      <div style={{ marginTop: 6 }}>{children}</div>
    </label>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.line}`,
  borderRadius: 10, fontSize: 14, fontFamily: FONT_SANS, color: COLORS.ink,
  boxSizing: "border-box", background: COLORS.surface,
};

function PrimaryButton({ onClick, children, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "13px 0", border: "none", borderRadius: 14, background: COLORS.brand,
        color: "#FFFFFF", fontFamily: FONT_SANS, fontSize: 15, fontWeight: 700,
        cursor: "pointer", width: "100%", boxShadow: "0 6px 16px rgba(255,140,90,0.32)", ...style,
      }}
    >
      {children}
    </button>
  );
}

function Avatar({ profile, size = 28 }) {
  if (!profile) return null;
  const initial = profile.name.trim().charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", background: profile.color,
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT_SERIF, fontWeight: 600, fontSize: size * 0.42, flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

function CategoryIcon({ icon: Icon, color, size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32, flexShrink: 0,
      background: `${color}1A`, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={size * 0.5} color={color} />
    </div>
  );
}

function MoodMark({ mood, size = 32 }) {
  if (!mood) {
    return <div style={{ width: size, height: size, borderRadius: "50%", background: COLORS.line }} />;
  }
  const shapeStyle = {
    circle: { borderRadius: "50%" },
    squircle: { borderRadius: size * 0.28 },
    diamond: { borderRadius: size * 0.14, transform: "rotate(45deg)" },
  }[mood.shape || "circle"];
  return (
    <div style={{
      width: size, height: size, background: mood.color, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center", ...shapeStyle,
    }} />
  );
}

// ---------- Onboarding ----------

function Onboarding({ onComplete }) {
  const [names, setNames] = useState(["", ""]);
  const [colors, setColors] = useState([PROFILE_PALETTE[0].hex, PROFILE_PALETTE[1].hex]);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!names[0].trim() || !names[1].trim()) {
      setError("กรุณาใส่ชื่อทั้งสองคน");
      return;
    }
    const profiles = names.map((n, i) => ({ id: uid(), name: n.trim(), color: colors[i] }));
    onComplete(profiles);
  };

  return (
    <div style={{
      minHeight: "100%", background: COLORS.bg, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box",
    }}>
      <div style={{ maxWidth: 440, width: "100%" }}>
        <h1 style={{ fontFamily: FONT_SERIF, fontSize: 30, fontWeight: 600, color: COLORS.ink, marginBottom: 6 }}>
          ตั้งค่าบ้านของคุณ
        </h1>
        <p style={{ fontFamily: FONT_SANS, fontSize: 14, color: COLORS.inkSoft, marginBottom: 28, lineHeight: 1.6 }}>
          ใส่ชื่อและเลือกสีประจำตัวของทั้งสองคน แก้ไขทีหลังได้เสมอ
        </p>

        {[0, 1].map((i) => (
          <div key={i} style={{
            background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 16,
            padding: 18, marginBottom: 14,
          }}>
            <Field label={`คนที่ ${i + 1}`}>
              <input
                type="text"
                value={names[i]}
                onChange={(e) => setNames((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))}
                placeholder="ชื่อเล่น"
                style={inputStyle}
              />
            </Field>
            <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>สีประจำตัว</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PROFILE_PALETTE.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setColors((prev) => prev.map((c, idx) => (idx === i ? p.hex : c)))}
                  style={{
                    width: 32, height: 32, borderRadius: "50%", background: p.hex, cursor: "pointer",
                    border: colors[i] === p.hex ? `2px solid ${COLORS.ink}` : "2px solid transparent",
                    outline: colors[i] === p.hex ? `2px solid ${COLORS.bg}` : "none",
                    outlineOffset: -4,
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        {error && <div style={{ color: COLORS.owed, fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <PrimaryButton onClick={handleSubmit}>เริ่มใช้งาน</PrimaryButton>
      </div>
    </div>
  );
}

// ---------- Profile switcher ----------

function ProfileSwitcher({ profiles, activeId, onSwitch }) {
  const [open, setOpen] = useState(false);
  const active = profiles.find((p) => p.id === activeId);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8, border: `1px solid ${COLORS.line}`,
          background: COLORS.surface, borderRadius: 20, padding: "5px 12px 5px 5px", cursor: "pointer",
        }}
      >
        <Avatar profile={active} size={24} />
        <span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{active?.name}</span>
        <ChevronDown size={14} color={COLORS.inkSoft} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 41,
            background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14,
            minWidth: 160, boxShadow: "0 8px 24px rgba(34,36,31,0.10)", overflow: "hidden",
          }}>
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => { onSwitch(p.id); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px",
                  border: "none", background: p.id === activeId ? COLORS.bg : COLORS.surface, cursor: "pointer",
                  fontFamily: FONT_SANS, fontSize: 13, color: COLORS.ink, textAlign: "left",
                }}
              >
                <Avatar profile={p} size={22} />
                {p.name}
                {p.id === activeId && <Check size={14} style={{ marginLeft: "auto" }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function formatShortDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTH_TH[d.getMonth()]}`;
}

// =========================================================================
// HOME TAB
// =========================================================================

function HomeTab({ profiles, activeProfile, shopping, events, todos, transactions, onNavigate }) {
  const pendingShopping = shopping.filter((s) => !s.done).length;
  const openTodos = todos.filter((t) => !t.done).length;

  const upcomingEvents = useMemo(() => {
    const today = todayISO();
    return events.filter((e) => e.date >= today).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 3);
  }, [events]);

  const balances = useMemo(() => computeBalances(transactions, profiles), [transactions, profiles]);
  const myBalance = balances[activeProfile.id] || 0;
  const otherProfile = profiles.find((p) => p.id !== activeProfile.id);

  const monthExpense = useMemo(() => {
    const ym = todayISO().slice(0, 7);
    return transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(ym) && visibleDetail(t, activeProfile.id))
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions, activeProfile.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 18,
        padding: "22px 20px", boxShadow: COLORS.shadow,
      }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, marginBottom: 6 }}>
            สวัสดี {activeProfile.name}
          </div>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 600, color: COLORS.ink }}>
            {new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 2 }}>รายจ่ายเดือนนี้</div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 600, color: COLORS.ink }}>฿{THB(monthExpense)}</div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 2 }}>ของที่ต้องซื้อ</div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 600, color: COLORS.ink }}>{pendingShopping} รายการ</div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 2 }}>งานค้าง</div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 600, color: COLORS.ink }}>{openTodos} งาน</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <button
          onClick={() => onNavigate("finance")}
          style={{
            flex: "1 1 260px", textAlign: "left", cursor: "pointer",
            background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 18,
          }}
        >
          <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>สถานะเงินสำรองจ่าย</div>
          {myBalance === 0 ? (
            <div style={{ fontFamily: FONT_SERIF, fontSize: 17, color: COLORS.ink }}>เคลียร์กันหมดแล้ว</div>
          ) : myBalance > 0 ? (
            <div style={{ fontFamily: FONT_SERIF, fontSize: 17, color: COLORS.settled }}>{otherProfile?.name} ค้างคุณ ฿{THB(myBalance)}</div>
          ) : (
            <div style={{ fontFamily: FONT_SERIF, fontSize: 17, color: COLORS.owed }}>คุณค้าง {otherProfile?.name} ฿{THB(Math.abs(myBalance))}</div>
          )}
        </button>

        <button
          onClick={() => onNavigate("calendar")}
          style={{
            flex: "1 1 260px", textAlign: "left", cursor: "pointer",
            background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 18,
          }}
        >
          <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>นัดหมายที่จะถึง</div>
          {upcomingEvents.length === 0 ? (
            <div style={{ fontFamily: FONT_SANS, fontSize: 14, color: COLORS.inkSoft }}>ไม่มีนัดในเร็วๆ นี้</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {upcomingEvents.map((e) => (
                <div key={e.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: e.color || COLORS.ink, flexShrink: 0 }} />
                  <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                  <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, marginLeft: "auto", flexShrink: 0 }}>{formatShortDate(e.date)}</span>
                </div>
              ))}
            </div>
          )}
        </button>
      </div>

      <button
        onClick={() => onNavigate("calendar")}
        style={{
          textAlign: "left", cursor: "pointer",
          background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 18,
        }}
      >
        <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, marginBottom: 10 }}>งานที่ต้องทำ</div>
        {todos.filter((t) => !t.done).length === 0 ? (
          <div style={{ fontFamily: FONT_SANS, fontSize: 14, color: COLORS.inkSoft }}>ไม่มีงานค้าง</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {todos.filter((t) => !t.done).slice(0, 4).map((t) => (
              <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Circle size={13} color={COLORS.inkFaint} />
                <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.ink }}>{t.title}</span>
                {t.dueDate && <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, marginLeft: "auto" }}>{formatShortDate(t.dueDate)}</span>}
              </div>
            ))}
          </div>
        )}
      </button>

      <button
        onClick={() => onNavigate("shopping")}
        style={{
          textAlign: "left", cursor: "pointer",
          background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 18,
        }}
      >
        <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, marginBottom: 10 }}>รายการที่ต้องซื้อ</div>
        {shopping.filter((s) => !s.done).length === 0 ? (
          <div style={{ fontFamily: FONT_SANS, fontSize: 14, color: COLORS.inkSoft }}>ไม่มีของที่ต้องซื้อตอนนี้</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {shopping.filter((s) => !s.done).slice(0, 6).map((s) => (
              <span key={s.id} style={{
                fontFamily: FONT_SANS, fontSize: 13, color: COLORS.ink,
                border: `1px solid ${COLORS.line}`, borderRadius: 18, padding: "4px 12px",
              }}>{s.name}</span>
            ))}
          </div>
        )}
      </button>
    </div>
  );
}

// =========================================================================
// SHOPPING TAB
// =========================================================================

function ShoppingTab({ shopping, setShopping, profiles, activeProfile }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(SHOPPING_CATEGORIES[0].id);
  const [filter, setFilter] = useState("all");

  const persist = (updated) => { setShopping(updated); saveJSON(KEYS.shopping, updated); };

  const addItem = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    persist([...shopping, { id: uid(), name: trimmed, category, done: false, addedBy: activeProfile.id, createdAt: Date.now() }]);
    setName("");
  };

  const toggleItem = (id) => persist(shopping.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  const removeItem = (id) => persist(shopping.filter((s) => s.id !== id));
  const clearDone = () => persist(shopping.filter((s) => !s.done));

  const filtered = shopping.filter((s) => filter === "all" || s.category === filter);
  const grouped = SHOPPING_CATEGORIES.map((c) => ({ ...c, items: filtered.filter((s) => s.category === c.id) }))
    .filter((g) => filter === "all" || g.id === filter);

  const profileMap = useMemo(() => { const m = {}; profiles.forEach((p) => (m[p.id] = p)); return m; }, [profiles]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="เพิ่มของที่ต้องซื้อ" style={{ ...inputStyle, flex: 1 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, width: 140 }}>
          {SHOPPING_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button onClick={addItem} style={{
          width: 44, border: "none", borderRadius: 12, background: COLORS.brand, color: "#FFFFFF", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}><Plus size={18} /></button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <FilterChip label="ทั้งหมด" active={filter === "all"} onClick={() => setFilter("all")} />
        {SHOPPING_CATEGORIES.map((c) => <FilterChip key={c.id} label={c.label} active={filter === c.id} onClick={() => setFilter(c.id)} />)}
        {shopping.some((s) => s.done) && (
          <button onClick={clearDone} style={{ marginLeft: "auto", border: "none", background: "none", color: COLORS.inkSoft, fontFamily: FONT_SANS, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
            ล้างรายการที่ซื้อแล้ว
          </button>
        )}
      </div>

      {grouped.every((g) => g.items.length === 0) ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: COLORS.inkSoft, fontFamily: FONT_SANS, fontSize: 14 }}>
          ไม่มีของในรายการนี้ — พิมพ์ชื่อของด้านบนเพื่อเพิ่ม
        </div>
      ) : (
        grouped.map((g) => g.items.length > 0 && (
          <div key={g.id} style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 8 }}>{g.label}</div>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10 }}>
              {g.items.map((item, idx) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderBottom: idx < g.items.length - 1 ? `1px solid ${COLORS.line}` : "none" }}>
                  <button onClick={() => toggleItem(item.id)} style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                    border: `1.5px solid ${item.done ? COLORS.settled : COLORS.lineStrong}`,
                    background: item.done ? COLORS.settled : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.12s ease",
                  }}>{item.done && <Check size={12} color="#fff" />}</button>
                  <span style={{ flex: 1, fontFamily: FONT_SANS, fontSize: 14, color: item.done ? COLORS.inkSoft : COLORS.ink, textDecoration: item.done ? "line-through" : "none" }}>
                    {item.name}
                  </span>
                  <Avatar profile={profileMap[item.addedBy]} size={20} />
                  <button onClick={() => removeItem(item.id)} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.inkSoft }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 13px", borderRadius: 18, border: `1px solid ${active ? COLORS.brand : COLORS.line}`,
      background: active ? COLORS.brand : COLORS.surface, color: active ? "#FFFFFF" : COLORS.inkSoft,
      fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, cursor: "pointer",
    }}>{label}</button>
  );
}

const navBtnStyle = {
  border: `1px solid ${COLORS.line}`, background: COLORS.surface, borderRadius: 12,
  width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};

// =========================================================================
// CALENDAR TAB
// =========================================================================

function CalendarTab({ events, setEvents, todos, setTodos, moods, setMoods, profiles, activeProfile }) {
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [showEventForm, setShowEventForm] = useState(false);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingTodo, setEditingTodo] = useState(null);

  const persistEvents = (updated) => { setEvents(updated); saveJSON(KEYS.events, updated); };
  const persistTodos = (updated) => { setTodos(updated); saveJSON(KEYS.todos, updated); };
  const persistMoods = (updated) => { setMoods(updated); saveJSON(KEYS.moods, updated); };

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateKey = (d) => `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const eventsByDate = useMemo(() => {
    const m = {};
    events.forEach((e) => { (m[e.date] ||= []).push(e); });
    return m;
  }, [events]);

  const todosByDate = useMemo(() => {
    const m = {};
    todos.forEach((t) => { if (t.dueDate) (m[t.dueDate] ||= []).push(t); });
    return m;
  }, [todos]);

  const moodsByDate = useMemo(() => {
    const m = {};
    moods.forEach((mo) => { m[`${mo.date}:${mo.profileId}`] = mo; });
    return m;
  }, [moods]);

  const changeMonth = (delta) => {
    let m = cursor.month + delta, y = cursor.year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCursor({ year: y, month: m });
  };

  const setMoodForToday = (moodId) => {
    const date = todayISO();
    const existing = moods.find((m) => m.date === date && m.profileId === activeProfile.id);
    const updated = existing
      ? moods.map((m) => (m === existing ? { ...m, mood: moodId } : m))
      : [...moods, { id: uid(), date, profileId: activeProfile.id, mood: moodId }];
    persistMoods(updated);
  };

  const todayMood = moods.find((m) => m.date === todayISO() && m.profileId === activeProfile.id);
  const todayMoodDef = MOOD_OPTIONS.find((m) => m.id === todayMood?.mood);

  const profileMap = useMemo(() => { const m = {}; profiles.forEach((p) => (m[p.id] = p)); return m; }, [profiles]);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <Segmented
          options={[
            { id: "month", label: "เดือน", icon: Grid3x3 },
            { id: "list", label: "รายการ", icon: ListIcon },
            { id: "mood", label: "อารมณ์", icon: Smile },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === "month" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <button onClick={() => changeMonth(-1)} style={navBtnStyle}><ChevronLeft size={18} /></button>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 600, color: COLORS.ink }}>
              {MONTH_TH[cursor.month]} {cursor.year + 543}
            </div>
            <button onClick={() => changeMonth(1)} style={navBtnStyle}><ChevronRight size={18} /></button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {WEEKDAY_TH.map((w) => (
              <div key={w} style={{ textAlign: "center", fontFamily: FONT_SANS, fontSize: 11, color: COLORS.inkSoft, padding: "4px 0" }}>{w}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 20 }}>
            {cells.map((d, idx) => {
              if (d === null) return <div key={idx} />;
              const key = dateKey(d);
              const dayEvents = eventsByDate[key] || [];
              const dayTodos = todosByDate[key] || [];
              const isToday = key === todayISO();
              return (
                <button
                  key={idx}
                  onClick={() => { setSelectedDate(key); setShowEventForm(true); }}
                  style={{
                    aspectRatio: "1", border: `1px solid ${isToday ? COLORS.ink : COLORS.line}`,
                    borderRadius: 12, background: COLORS.surface, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", padding: 4,
                  }}
                >
                  <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: isToday ? 700 : 400, color: COLORS.ink }}>{d}</span>
                  <div style={{ display: "flex", gap: 2, marginTop: 3, flexWrap: "wrap", justifyContent: "center" }}>
                    {dayEvents.slice(0, 3).map((e) => <div key={e.id} style={{ width: 5, height: 5, borderRadius: "50%", background: e.color }} />)}
                    {dayTodos.length > 0 && <div style={{ width: 5, height: 5, borderRadius: 1, background: COLORS.inkFaint }} />}
                  </div>
                </button>
              );
            })}
          </div>

          {showEventForm && (
            <EventForm
              date={selectedDate} profiles={profiles} activeProfile={activeProfile}
              existingEvents={eventsByDate[selectedDate] || []}
              onClose={() => setShowEventForm(false)}
              onSave={(newEvent) => persistEvents([...events, newEvent])}
              onDelete={(id) => persistEvents(events.filter((e) => e.id !== id))}
            />
          )}
        </>
      )}

      {view === "list" && (
        <ListView
          events={events} todos={todos} profileMap={profileMap}
          onToggleTodo={(id) => persistTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))}
          onDeleteTodo={(id) => persistTodos(todos.filter((t) => t.id !== id))}
          onEditTodo={(t) => { setEditingTodo(t); setShowTodoForm(true); }}
          onDeleteEvent={(id) => persistEvents(events.filter((e) => e.id !== id))}
          onAddTodo={() => { setEditingTodo(null); setShowTodoForm(true); }}
        />
      )}

      {view === "mood" && (
        <div>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 18, padding: 20, marginBottom: 20, boxShadow: COLORS.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft }}>วันนี้คุณรู้สึกยังไง</div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkFaint }}>
                {new Date().toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short" })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: todayMoodDef ? 16 : 0 }}>
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMoodForToday(m.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    border: "none", background: "none", cursor: "pointer", padding: 4,
                  }}
                >
                  <div style={{
                    padding: 3, borderRadius: "50%",
                    border: `2px solid ${todayMood?.mood === m.id ? m.color : "transparent"}`,
                  }}>
                    <MoodMark mood={m} size={40} />
                  </div>
                  <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: todayMood?.mood === m.id ? COLORS.ink : COLORS.inkSoft, fontWeight: todayMood?.mood === m.id ? 700 : 400 }}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
            {todayMoodDef && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: COLORS.bg, borderRadius: 10 }}>
                <MoodMark mood={todayMoodDef} size={26} />
                <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.ink }}>
                  <strong>{activeProfile.name}</strong> รู้สึก<strong style={{ color: todayMoodDef.color }}> {todayMoodDef.label}</strong>
                </div>
              </div>
            )}
          </div>

          <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 10 }}>
            ย้อนหลังเดือนนี้ — {activeProfile.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button onClick={() => changeMonth(-1)} style={navBtnStyle}><ChevronLeft size={16} /></button>
            <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{MONTH_TH[cursor.month]} {cursor.year + 543}</div>
            <button onClick={() => changeMonth(1)} style={navBtnStyle}><ChevronRight size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
            {WEEKDAY_TH.map((w) => <div key={w} style={{ textAlign: "center", fontFamily: FONT_SANS, fontSize: 10, color: COLORS.inkSoft }}>{w}</div>)}
            {cells.map((d, idx) => {
              if (d === null) return <div key={idx} />;
              const key = dateKey(d);
              const mood = moodsByDate[`${key}:${activeProfile.id}`];
              const moodDef = MOOD_OPTIONS.find((m) => m.id === mood?.mood);
              return (
                <div key={idx} title={moodDef?.label} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <div style={{ position: "absolute", inset: 0, opacity: moodDef ? 1 : 0.4 }}>
                      <MoodMarkFill mood={moodDef} />
                    </div>
                    <span style={{
                      position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: FONT_SANS, fontSize: 10, color: moodDef ? "#fff" : COLORS.inkSoft, fontWeight: 600,
                    }}>{d}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showTodoForm && (
        <TodoForm
          initial={editingTodo}
          activeProfile={activeProfile}
          onClose={() => { setShowTodoForm(false); setEditingTodo(null); }}
          onSave={(todo) => {
            const exists = todos.some((t) => t.id === todo.id);
            persistTodos(exists ? todos.map((t) => (t.id === todo.id ? todo : t)) : [...todos, todo]);
            setShowTodoForm(false);
            setEditingTodo(null);
          }}
        />
      )}
    </div>
  );
}

function MoodMarkFill({ mood }) {
  if (!mood) return <div style={{ width: "100%", height: "100%", borderRadius: 10, background: COLORS.line }} />;
  const shapeStyle = {
    circle: { borderRadius: "50%" },
    squircle: { borderRadius: 7 },
    diamond: { borderRadius: 3, transform: "rotate(45deg) scale(0.78)" },
  }[mood.shape || "circle"];
  return <div style={{ width: "100%", height: "100%", background: mood.color, ...shapeStyle }} />;
}

function ListView({ events, todos, profileMap, onToggleTodo, onDeleteTodo, onEditTodo, onDeleteEvent, onAddTodo }) {
  const today = todayISO();

  const upcomingEvents = useMemo(
    () => events.filter((e) => e.date >= today).sort((a, b) => (a.date < b.date ? -1 : 1)),
    [events, today]
  );

  const openTodos = useMemo(
    () => todos.filter((t) => !t.done).sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    }),
    [todos]
  );

  const doneTodos = useMemo(() => todos.filter((t) => t.done), [todos]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft }}>
          <ListChecks size={15} /> งาน/แพลนที่ต้องทำ
        </div>
        <button onClick={onAddTodo} style={{
          display: "flex", alignItems: "center", gap: 6, border: "none", background: COLORS.brand, color: "#FFFFFF",
          borderRadius: 18, padding: "6px 12px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}><Plus size={13} /> เพิ่มงาน</button>
      </div>

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "2px 14px", marginBottom: 24 }}>
        {openTodos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: COLORS.inkSoft, fontFamily: FONT_SANS, fontSize: 13 }}>ไม่มีงานค้าง</div>
        ) : (
          openTodos.map((t, idx) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: idx < openTodos.length - 1 ? `1px solid ${COLORS.line}` : "none" }}>
              <button onClick={() => onToggleTodo(t.id)} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.inkFaint, display: "flex" }}>
                <Circle size={19} />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 14, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                {t.dueDate && <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft }}>กำหนด {formatShortDate(t.dueDate)}</div>}
              </div>
              <button onClick={() => onEditTodo(t)} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.inkSoft, padding: 4 }}><PenLine size={13} /></button>
              <button onClick={() => onDeleteTodo(t.id)} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.inkSoft, padding: 4 }}><Trash2 size={13} /></button>
            </div>
          ))
        )}
      </div>

      <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <CalendarClock size={15} /> นัดหมายที่จะถึง
      </div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "2px 14px", marginBottom: doneTodos.length ? 24 : 0 }}>
        {upcomingEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: COLORS.inkSoft, fontFamily: FONT_SANS, fontSize: 13 }}>ไม่มีนัดหมายที่จะถึง</div>
        ) : (
          upcomingEvents.map((e, idx) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: idx < upcomingEvents.length - 1 ? `1px solid ${COLORS.line}` : "none" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 14, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft }}>
                  {formatShortDate(e.date)}{e.time ? ` · ${e.time}` : ""} · {e.scope === "shared" ? "นัดร่วม" : "ส่วนตัว"}
                </div>
              </div>
              <button onClick={() => onDeleteEvent(e.id)} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.inkSoft, padding: 4 }}><Trash2 size={13} /></button>
            </div>
          ))
        )}
      </div>

      {doneTodos.length > 0 && (
        <>
          <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 10 }}>ทำเสร็จแล้ว</div>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "2px 14px" }}>
            {doneTodos.map((t, idx) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: idx < doneTodos.length - 1 ? `1px solid ${COLORS.line}` : "none" }}>
                <button onClick={() => onToggleTodo(t.id)} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.settled, display: "flex" }}>
                  <CheckCircle2 size={19} />
                </button>
                <div style={{ flex: 1, fontFamily: FONT_SANS, fontSize: 14, color: COLORS.inkSoft, textDecoration: "line-through" }}>{t.title}</div>
                <button onClick={() => onDeleteTodo(t.id)} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.inkSoft, padding: 4 }}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EventForm({ date, profiles, activeProfile, existingEvents, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState("personal");
  const [time, setTime] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    const color = scope === "shared" ? COLORS.ink : activeProfile.color;
    onSave({ id: uid(), date, title: title.trim(), time, scope, profileId: activeProfile.id, color });
    setTitle(""); setTime("");
  };

  const d = new Date(date);

  return (
    <Modal onClose={onClose}>
      <ModalHeader title={`${d.getDate()} ${MONTH_TH[d.getMonth()]} ${d.getFullYear() + 543}`} onClose={onClose} />

      {existingEvents.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {existingEvents.map((e) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${COLORS.line}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 14, color: COLORS.ink }}>{e.title}</div>
                {e.time && <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft }}>{e.time}</div>}
              </div>
              <button onClick={() => onDelete(e.id)} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.inkSoft }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <Field label="ชื่อนัดหมาย">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="เช่น นัดหมอฟัน" />
      </Field>
      <Field label="เวลา (ถ้ามี)">
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="ประเภทนัด">
        <Segmented options={[{ id: "personal", label: "ส่วนตัว" }, { id: "shared", label: "นัดร่วม" }]} value={scope} onChange={setScope} />
      </Field>
      <PrimaryButton onClick={submit}>เพิ่มนัดหมาย</PrimaryButton>
    </Modal>
  );
}

function TodoForm({ initial, activeProfile, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [dueDate, setDueDate] = useState(initial?.dueDate || "");
  const [error, setError] = useState("");

  const submit = () => {
    if (!title.trim()) { setError("กรุณาใส่ชื่องาน"); return; }
    onSave({
      id: initial?.id || uid(), title: title.trim(), dueDate: dueDate || null,
      done: initial?.done || false, createdBy: initial?.createdBy || activeProfile.id,
      createdAt: initial?.createdAt || Date.now(),
    });
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title={initial ? "แก้ไขงาน" : "เพิ่มงาน/แพลน"} onClose={onClose} />
      <Field label="ชื่องาน">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="เช่น เช็คไส้กรองแอร์" />
      </Field>
      <Field label="กำหนดวัน (ถ้ามี)">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
      </Field>
      {error && <div style={{ color: COLORS.owed, fontSize: 13, marginBottom: 12 }}>{error}</div>}
      <PrimaryButton onClick={submit}>{initial ? "บันทึกการแก้ไข" : "เพิ่มงาน"}</PrimaryButton>
    </Modal>
  );
}

// =========================================================================
// FINANCE TAB
// =========================================================================

function computeBalances(transactions, profiles) {
  const balances = {};
  profiles.forEach((p) => (balances[p.id] = 0));
  transactions.forEach((t) => {
    const scope = t.scope || "shared";
    if (t.type !== "expense" || t.settled || scope !== "shared") return;
    const payer = t.paidBy;
    const others = profiles.filter((p) => p.id !== payer);
    if (others.length === 0) return;
    const share = t.amount / profiles.length;
    balances[payer] = (balances[payer] || 0) + share * others.length;
    others.forEach((o) => { balances[o.id] = (balances[o.id] || 0) - share; });
  });
  return balances;
}

function visibleDetail(tx, profileId) {
  const scope = tx.scope || "shared";
  return scope === "shared" || tx.owner === profileId;
}

function FinanceTab({ transactions, setTransactions, profiles, activeProfile, budgets, setBudgets }) {
  const [subTab, setSubTab] = useState("ledger");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const persistTx = (updated) => { setTransactions(updated); saveJSON(KEYS.transactions, updated); };
  const persistBudgets = (updated) => { setBudgets(updated); saveJSON(KEYS.budgets, updated); };

  const otherProfile = profiles.find((p) => p.id !== activeProfile.id);

  const visibleTx = useMemo(() => transactions.filter((t) => visibleDetail(t, activeProfile.id)), [transactions, activeProfile.id]);

  const otherPersonalTotals = useMemo(() => {
    if (!otherProfile) return { income: 0, expense: 0 };
    let income = 0, expense = 0;
    transactions.filter((t) => (t.scope || "shared") === "personal" && t.owner === otherProfile.id)
      .forEach((t) => { if (t.type === "income") income += t.amount; else expense += t.amount; });
    return { income, expense };
  }, [transactions, otherProfile]);

  const monthKey = todayISO().slice(0, 7);
  const perPersonMonth = useMemo(() => {
    const out = {};
    profiles.forEach((p) => (out[p.id] = { paid: 0, pending: 0, pendingCount: 0 }));
    transactions
      .filter((t) => t.type === "expense" && (t.scope || "shared") === "shared" && t.date.startsWith(monthKey))
      .forEach((t) => {
        if (!out[t.paidBy]) return;
        if (t.settled) out[t.paidBy].paid += t.amount;
        else { out[t.paidBy].pending += t.amount; out[t.paidBy].pendingCount += 1; }
      });
    return out;
  }, [transactions, profiles, monthKey]);

  const monthSharedTotal = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense" && (t.scope || "shared") === "shared" && t.date.startsWith(monthKey))
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions, monthKey]);

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    visibleTx.forEach((t) => { if (t.type === "income") income += t.amount; else expense += t.amount; });
    return { income, expense };
  }, [visibleTx]);

  const monthByCategory = useMemo(() => {
    const m = {};
    visibleTx.filter((t) => t.type === "expense" && t.date.startsWith(monthKey))
      .forEach((t) => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return m;
  }, [visibleTx, monthKey]);

  const profileMap = useMemo(() => { const m = {}; profiles.forEach((p) => (m[p.id] = p)); return m; }, [profiles]);

  const sortedTx = useMemo(() =>
    visibleTx.slice().sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1)),
    [visibleTx]
  );

  const settleUp = () => persistTx(transactions.map((t) => (t.type === "expense" && (t.scope || "shared") === "shared" ? { ...t, settled: true } : t)));
  const settleOne = (id) => persistTx(transactions.map((t) => (t.id === id ? { ...t, settled: true } : t)));

  const myBalance = useMemo(() => computeBalances(transactions, profiles)[activeProfile.id] || 0, [transactions, profiles, activeProfile.id]);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <Segmented
          options={[
            { id: "ledger", label: "รายการ" },
            { id: "balance", label: "ค้างจ่าย" },
            { id: "summary", label: "สรุปรายเดือน" },
            { id: "budget", label: "งบประมาณ" },
          ]}
          value={subTab}
          onChange={setSubTab}
        />
      </div>

      {subTab === "ledger" && (
        <>
          <div style={{
            background: `linear-gradient(155deg, ${COLORS.brand} 0%, #FF6B4A 100%)`, borderRadius: 22,
            padding: "22px 22px 20px", marginBottom: 16, color: "#FFFFFF",
            boxShadow: "0 10px 28px rgba(255,140,90,0.28)",
          }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 11, letterSpacing: 0.3, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>
              ค่าใช้จ่ายส่วนกลางเดือนนี้
            </div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 34, fontWeight: 700, marginBottom: 18 }}>฿{THB(monthSharedTotal)}</div>
            <div style={{ display: "flex", gap: 14 }}>
              {profiles.map((p) => {
                const stat = perPersonMonth[p.id] || { paid: 0, pending: 0, pendingCount: 0 };
                const share = monthSharedTotal > 0 ? (stat.paid / monthSharedTotal) * 100 : 0;
                return (
                  <div key={p.id} style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>{p.name} จ่ายแล้ว</div>
                    <div style={{ fontFamily: FONT_SERIF, fontSize: 19, fontWeight: 700, marginBottom: 8 }}>฿{THB(stat.paid)}</div>
                    <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.25)", overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ height: "100%", width: `${Math.min(100, share)}%`, background: "#FFFFFF" }} />
                    </div>
                    {stat.pending > 0 && (
                      <div style={{
                        background: "rgba(255,255,255,0.16)", borderRadius: 14, padding: "8px 10px",
                      }}>
                        <div style={{ fontFamily: FONT_SANS, fontSize: 10, color: "rgba(255,255,255,0.75)" }}>ค้างจ่าย</div>
                        <div style={{ fontFamily: FONT_SERIF, fontSize: 14, fontWeight: 700 }}>฿{THB(stat.pending)}</div>
                        <div style={{ fontFamily: FONT_SANS, fontSize: 10, color: "rgba(255,255,255,0.75)" }}>{stat.pendingCount} รายการ</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <SummaryBox label="รายรับรวม" value={totals.income} color={COLORS.settled} />
            <SummaryBox label="รายจ่ายรวม" value={totals.expense} color={COLORS.owed} />
          </div>

          {otherProfile && (otherPersonalTotals.income > 0 || otherPersonalTotals.expense > 0) && (
            <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, marginBottom: 16, padding: "8px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 8 }}>
              รายการส่วนตัวของ {otherProfile.name}: รายรับ ฿{THB(otherPersonalTotals.income)} · รายจ่าย ฿{THB(otherPersonalTotals.expense)}
              <span style={{ display: "block", color: COLORS.inkSoft, marginTop: 2 }}>(เห็นแค่ยอดรวม ไม่เห็นรายการละเอียด)</span>
            </div>
          )}

          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center",
              padding: "13px 0", border: "none", borderRadius: 14, background: COLORS.brand, color: "#FFFFFF",
              fontFamily: FONT_SANS, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 18,
              boxShadow: "0 6px 16px rgba(255,140,90,0.28)",
            }}
          ><Plus size={16} /> เพิ่มรายการ</button>

          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "2px 14px" }}>
            {sortedTx.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.inkSoft, fontFamily: FONT_SANS, fontSize: 14 }}>ยังไม่มีรายการ</div>
            ) : (
              sortedTx.map((t) => (
                <TxRow key={t.id} tx={t} payer={profileMap[t.paidBy]}
                  onEdit={() => { setEditing(t); setShowForm(true); }}
                  onDelete={() => persistTx(transactions.filter((x) => x.id !== t.id))}
                  onSettle={() => settleOne(t.id)}
                />
              ))
            )}
          </div>
        </>
      )}

      {subTab === "balance" && (
        <div>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 18, padding: 26, textAlign: "center", marginBottom: 16, boxShadow: COLORS.shadow }}>
            {myBalance === 0 ? (
              <div style={{ fontFamily: FONT_SERIF, fontSize: 22, color: COLORS.ink }}>เคลียร์กันหมดแล้ว</div>
            ) : myBalance > 0 ? (
              <>
                <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, marginBottom: 6 }}>{otherProfile?.name} ค้างคุณ</div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 34, fontWeight: 600, color: COLORS.settled }}>฿{THB(myBalance)}</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, marginBottom: 6 }}>คุณค้าง {otherProfile?.name}</div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 34, fontWeight: 600, color: COLORS.owed }}>฿{THB(Math.abs(myBalance))}</div>
              </>
            )}
          </div>

          {myBalance !== 0 && (
            <button onClick={settleUp} style={{
              width: "100%", padding: "11px 0", border: `1.5px solid ${COLORS.brand}`, borderRadius: 14,
              background: COLORS.surface, color: COLORS.brand, fontFamily: FONT_SANS, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 20,
            }}>ทำเครื่องหมายว่าเคลียร์กันแล้ว</button>
          )}

          <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 10 }}>รายการที่ยังไม่ได้เคลียร์</div>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "2px 14px" }}>
            {sortedTx.filter((t) => t.type === "expense" && (t.scope || "shared") === "shared" && !t.settled).length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: COLORS.inkSoft, fontFamily: FONT_SANS, fontSize: 13 }}>ไม่มีรายการค้างจ่าย</div>
            ) : (
              sortedTx.filter((t) => t.type === "expense" && (t.scope || "shared") === "shared" && !t.settled).map((t) => (
                <TxRow key={t.id} tx={t} payer={profileMap[t.paidBy]}
                  onEdit={() => { setEditing(t); setShowForm(true); }}
                  onDelete={() => persistTx(transactions.filter((x) => x.id !== t.id))}
                  onSettle={() => settleOne(t.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {subTab === "summary" && <MonthlySummary transactions={transactions} profiles={profiles} activeProfile={activeProfile} />}

      {subTab === "budget" && <BudgetPanel budgets={budgets} onSave={persistBudgets} spentByCategory={monthByCategory} />}

      {showForm && (
        <TxForm
          initial={editing} profiles={profiles} activeProfile={activeProfile}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={(tx) => {
            const exists = transactions.some((t) => t.id === tx.id);
            persistTx(exists ? transactions.map((t) => (t.id === tx.id ? tx : t)) : [...transactions, tx]);
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function SummaryBox({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 20, fontWeight: 600, color }}>฿{THB(value)}</div>
    </div>
  );
}

function TxRow({ tx, payer, onEdit, onDelete, onSettle }) {
  const isIncome = tx.type === "income";
  const isShared = (tx.scope || "shared") === "shared";
  const cat = catInfo(tx.category, tx.type);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", borderBottom: `1px solid ${COLORS.line}` }}>
      <CategoryIcon icon={cat.icon} color={cat.color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: COLORS.ink, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tx.note || cat.label}
          </span>
          {isShared && <Avatar profile={payer} size={16} />}
        </div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft }}>
          {formatShortDate(tx.date)} · {isShared ? "ส่วนกลาง" : "ส่วนตัว"}
          {isShared && !isIncome && !tx.settled ? " · ยังไม่เคลียร์" : ""}
          {tx.receiptNote ? " · แนบสลิปแล้ว" : ""}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 15, fontWeight: 600, color: isIncome ? COLORS.settled : COLORS.owed, whiteSpace: "nowrap" }}>
          {isIncome ? "+" : "−"}฿{THB(tx.amount)}
        </div>
        {isShared && !isIncome && !tx.settled && (
          <button onClick={onSettle} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.settled, fontFamily: FONT_SANS, fontSize: 11, textDecoration: "underline", padding: 0 }}>
            เคลียร์แล้ว
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        <button onClick={onEdit} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.inkSoft, padding: 4 }}><PenLine size={13} /></button>
        <button onClick={onDelete} style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.inkSoft, padding: 4 }}><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function TxForm({ initial, profiles, activeProfile, onClose, onSave }) {
  const [type, setType] = useState(initial?.type || "expense");
  const [scope, setScope] = useState(initial?.scope || "personal");
  const [amount, setAmount] = useState(initial?.amount?.toString() || "");
  const [category, setCategory] = useState(initial?.category || EXPENSE_CATEGORIES[0].id);
  const [date, setDate] = useState(initial?.date || todayISO());
  const [note, setNote] = useState(initial?.note || "");
  const [paidBy, setPaidBy] = useState(initial?.paidBy || activeProfile.id);
  const [receiptDataUrl, setReceiptDataUrl] = useState(initial?.receiptDataUrl || "");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanApplied, setScanApplied] = useState(false);
  const fileRef = useRef(null);

  // Anthropic API key from environment variable (set in .env file)
  // ⚠️  Note: calling the API from a browser exposes your key to anyone
  // who views the page source. Use a backend proxy in production.
  const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

  const categoryList = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (!categoryList.find((c) => c.id === category)) setCategory(categoryList[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError("");
    setScanApplied(false);
    const reader = new FileReader();
    reader.onload = () => setReceiptDataUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const scanReceipt = async () => {
    if (!receiptDataUrl) return;
    if (!ANTHROPIC_API_KEY) {
      setScanError("ยังไม่ได้ตั้งค่า VITE_ANTHROPIC_API_KEY ในไฟล์ .env");
      return;
    }
    setScanning(true);
    setScanError("");
    setScanApplied(false);
    try {
      const commaIdx = receiptDataUrl.indexOf(",");
      const meta = receiptDataUrl.slice(5, commaIdx);
      const mediaType = meta.split(";")[0] || "image/jpeg";
      const base64Data = receiptDataUrl.slice(commaIdx + 1);

      const categoryOptions = EXPENSE_CATEGORIES.map((c) => c.id).join(", ");
      const prompt = `นี่คือรูปสลิป/ใบเสร็จ อ่านแล้วตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่นใดๆ นอกเหนือจาก JSON ห้ามใส่ markdown fence รูปแบบ:
{"amount": ตัวเลขจำนวนเงินรวมสุทธิ (number ไม่ใช่ string), "date": "YYYY-MM-DD หรือ null ถ้าอ่านไม่ได้", "merchant": "ชื่อร้านค้าสั้นๆ หรือ null", "category": "หนึ่งใน [${categoryOptions}] ที่ใกล้เคียงที่สุด"}
ถ้าอ่านจำนวนเงินไม่ได้เลยให้ตอบ {"amount": null}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
                { type: "text", text: prompt },
              ],
            },
          ],
        }),
      });

      if (!response.ok) throw new Error("เรียก AI ไม่สำเร็จ");
      const data = await response.json();
      const textBlock = (data.content || []).find((b) => b.type === "text");
      if (!textBlock) throw new Error("ไม่ได้รับคำตอบจาก AI");

      const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.amount === null || parsed.amount === undefined || isNaN(Number(parsed.amount))) {
        setScanError("อ่านจำนวนเงินจากสลิปไม่ได้ กรุณากรอกเอง");
      } else {
        setAmount(String(parsed.amount));
        if (parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) setDate(parsed.date);
        if (parsed.category && EXPENSE_CATEGORIES.find((c) => c.id === parsed.category)) {
          setType("expense");
          setCategory(parsed.category);
        }
        if (parsed.merchant) setNote(parsed.merchant);
        setScanApplied(true);
      }
    } catch (err) {
      console.error("receipt scan failed", err);
      setScanError("อ่านสลิปไม่สำเร็จ กรุณากรอกข้อมูลเอง");
    } finally {
      setScanning(false);
    }
  };

  const submit = () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) { setError("กรุณาใส่จำนวนเงินให้ถูกต้อง"); return; }
    onSave({
      id: initial?.id || uid(), type, scope, amount: num, category, date, note: note.trim(),
      paidBy: scope === "shared" ? paidBy : activeProfile.id,
      owner: scope === "personal" ? activeProfile.id : null,
      settled: type === "income" || scope === "personal" ? true : (initial?.settled || false),
      receiptDataUrl, receiptNote: !!receiptDataUrl,
      createdAt: initial?.createdAt || Date.now(),
    });
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title={initial ? "แก้ไขรายการ" : "บันทึกรายการใหม่"} onClose={onClose} />

      <div style={{ marginBottom: 16 }}>
        <Segmented options={[{ id: "expense", label: "รายจ่าย" }, { id: "income", label: "รายรับ" }]} value={type} onChange={setType} />
      </div>

      <Field label="ประเภทรายการ">
        <Segmented options={[{ id: "personal", label: "ส่วนตัว" }, { id: "shared", label: "ส่วนกลาง" }]} value={scope} onChange={setScope} />
      </Field>
      <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.inkSoft, marginTop: -8, marginBottom: 16 }}>
        {scope === "personal" ? "อีกฝ่ายจะเห็นแค่ยอดรวม ไม่เห็นรายการนี้" : "ทั้งสองคนเห็นรายการนี้ และมีผลกับยอดค้างจ่าย"}
      </div>

      <Field label="จำนวนเงิน (บาท)">
        <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ ...inputStyle, fontFamily: FONT_SERIF, fontSize: 16 }} />
      </Field>

      <Field label="หมวดหมู่">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {categoryList.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "9px 4px",
                border: `1.5px solid ${active ? c.color : COLORS.line}`, borderRadius: 12,
                background: active ? `${c.color}15` : COLORS.surface, cursor: "pointer",
              }}>
                <Icon size={16} color={active ? c.color : COLORS.inkSoft} />
                <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: active ? COLORS.ink : COLORS.inkSoft, textAlign: "center", lineHeight: 1.2 }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </Field>

      {type === "expense" && scope === "shared" && (
        <Field label="ใครจ่าย">
          <div style={{ display: "flex", gap: 8 }}>
            {profiles.map((p) => (
              <button key={p.id} onClick={() => setPaidBy(p.id)} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 12, cursor: "pointer",
                border: `1.5px solid ${paidBy === p.id ? p.color : COLORS.line}`,
                background: paidBy === p.id ? p.color : COLORS.surface, color: paidBy === p.id ? "#fff" : COLORS.ink,
                fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600,
              }}>{p.name}</button>
            ))}
          </div>
        </Field>
      )}

      <Field label="วันที่">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </Field>

      <Field label="หมายเหตุ (ถ้ามี)">
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ค่าข้าวเย็น" style={inputStyle} />
      </Field>

      {type === "expense" && (
        <Field label="แนบสลิป/บิล (ถ้ามี)">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px",
            border: `1px dashed ${COLORS.lineStrong}`, borderRadius: 12, background: COLORS.surface,
            color: COLORS.inkSoft, fontFamily: FONT_SANS, fontSize: 13, cursor: "pointer",
          }}><Camera size={16} /> {receiptDataUrl ? "เปลี่ยนรูปสลิป" : "แนบรูปสลิป"}</button>

          {receiptDataUrl && (
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <img src={receiptDataUrl} alt="สลิป" style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 12, border: `1px solid ${COLORS.line}`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <button
                  onClick={scanReceipt}
                  disabled={scanning}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%",
                    padding: "9px 0", border: "none", borderRadius: 10,
                    background: scanning ? COLORS.lineStrong : COLORS.brand, color: "#FFFFFF",
                    fontFamily: FONT_SANS, fontSize: 13, fontWeight: 700,
                    cursor: scanning ? "default" : "pointer",
                  }}
                >
                  <Sparkles size={14} /> {scanning ? "กำลังอ่านสลิป..." : "อ่านสลิปด้วย AI"}
                </button>
                {scanApplied && !scanning && (
                  <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.settled, marginTop: 6 }}>
                    กรอกให้อัตโนมัติแล้ว — ลองเช็คความถูกต้องก่อนบันทึก
                  </div>
                )}
                {scanError && !scanning && (
                  <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.owed, marginTop: 6 }}>{scanError}</div>
                )}
              </div>
            </div>
          )}
        </Field>
      )}

      {error && <div style={{ color: COLORS.owed, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <PrimaryButton onClick={submit}>{initial ? "บันทึกการแก้ไข" : "บันทึกรายการ"}</PrimaryButton>
    </Modal>
  );
}

function MonthlySummary({ transactions, profiles, activeProfile }) {
  const [view, setView] = useState("mine");
  const [monthOffset, setMonthOffset] = useState(0);

  const targetMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthOffset);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [monthOffset]);

  const monthKey = `${targetMonth.year}-${String(targetMonth.month + 1).padStart(2, "0")}`;

  const scopedTx = useMemo(() => transactions.filter((t) => {
    if (!t.date.startsWith(monthKey)) return false;
    const scope = t.scope || "shared";
    if (view === "household") return scope === "shared";
    return scope === "shared" || (scope === "personal" && t.owner === activeProfile.id);
  }), [transactions, monthKey, view, activeProfile.id]);

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    scopedTx.forEach((t) => { if (t.type === "income") income += t.amount; else expense += t.amount; });
    return { income, expense };
  }, [scopedTx]);

  const byCategory = useMemo(() => {
    const m = {};
    scopedTx.filter((t) => t.type === "expense").forEach((t) => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return Object.entries(m)
      .map(([id, value]) => ({ id, ...catInfo(id, "expense"), value }))
      .sort((a, b) => b.value - a.value);
  }, [scopedTx]);

  const trend = useMemo(() => {
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthTx = transactions.filter((t) => {
        if (!t.date.startsWith(key)) return false;
        const scope = t.scope || "shared";
        if (view === "household") return scope === "shared";
        return scope === "shared" || (scope === "personal" && t.owner === activeProfile.id);
      });
      const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      out.push({ label: `${MONTH_TH[d.getMonth()]} ${(d.getFullYear() + 543).toString().slice(-2)}`, expense, isTarget: key === monthKey });
    }
    return out;
  }, [transactions, view, activeProfile.id, monthKey]);

  const maxTrend = Math.max(1, ...trend.map((t) => t.expense));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Segmented options={[{ id: "mine", label: "มุมมองของฉัน" }, { id: "household", label: "รวมทั้งบ้าน" }]} value={view} onChange={setView} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => setMonthOffset((o) => o + 1)} style={navBtnStyle}><ChevronLeft size={18} /></button>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 600, color: COLORS.ink }}>{MONTH_TH[targetMonth.month]} {targetMonth.year + 543}</div>
        <button onClick={() => setMonthOffset((o) => Math.max(0, o - 1))} disabled={monthOffset === 0} style={{ ...navBtnStyle, opacity: monthOffset === 0 ? 0.3 : 1, cursor: monthOffset === 0 ? "default" : "pointer" }}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <SummaryBox label="รายรับเดือนนี้" value={totals.income} color={COLORS.settled} />
        <SummaryBox label="รายจ่ายเดือนนี้" value={totals.expense} color={COLORS.owed} />
      </div>

      <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 10 }}>ใช้ไปกับอะไรบ้าง</div>
      {byCategory.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: COLORS.inkSoft, fontFamily: FONT_SANS, fontSize: 13, border: `1px solid ${COLORS.line}`, borderRadius: 14, marginBottom: 24 }}>
          ไม่มีรายจ่ายในเดือนนี้
        </div>
      ) : (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "4px 16px", marginBottom: 24 }}>
          {byCategory.map((c, idx) => {
            const pct = totals.expense > 0 ? (c.value / totals.expense) * 100 : 0;
            const Icon = c.icon;
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: idx < byCategory.length - 1 ? `1px solid ${COLORS.line}` : "none" }}>
                <CategoryIcon icon={Icon} color={c.color} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: COLORS.ink }}>{c.label}</span>
                    <span style={{ fontFamily: FONT_SERIF, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>฿{THB(c.value)}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: COLORS.bg, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: c.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 10 }}>เทียบย้อนหลัง 6 เดือน</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "16px 14px 10px" }}>
        {trend.map((t, idx) => (
          <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
            <div style={{
              width: "100%", maxWidth: 28, borderRadius: "6px 6px 2px 2px",
              height: `${Math.max(4, (t.expense / maxTrend) * 90)}px`,
              background: t.isTarget ? COLORS.brand : COLORS.lineStrong,
            }} title={`฿${THB(t.expense)}`} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: t.isTarget ? COLORS.brand : COLORS.inkSoft, fontWeight: t.isTarget ? 700 : 400 }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetPanel({ budgets, onSave, spentByCategory }) {
  const [editingCat, setEditingCat] = useState(null);
  const [amount, setAmount] = useState("");

  const startEdit = (catId) => { setEditingCat(catId); setAmount((budgets[catId] || "").toString()); };
  const save = () => {
    const num = parseFloat(amount);
    onSave({ ...budgets, [editingCat]: isNaN(num) ? 0 : num });
    setEditingCat(null);
  };

  return (
    <div>
      <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, marginBottom: 16 }}>
        ตั้งงบต่อเดือนแยกตามหมวดหมู่ ระบบจะหักลบให้อัตโนมัติจากรายการที่บันทึก
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {EXPENSE_CATEGORIES.map((c) => {
          const budget = budgets[c.id] || 0;
          const spent = spentByCategory[c.id] || 0;
          const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
          const over = budget > 0 && spent > budget;
          const Icon = c.icon;
          return (
            <div key={c.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <CategoryIcon icon={Icon} color={c.color} size={28} />
                <span style={{ flex: 1, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{c.label}</span>
                {editingCat === c.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} autoFocus style={{ ...inputStyle, width: 100, padding: "5px 8px" }} />
                    <button onClick={save} style={{ border: "none", background: COLORS.brand, color: "#FFFFFF", borderRadius: 8, padding: "0 10px", cursor: "pointer" }}><Check size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(c.id)} style={{ border: "none", background: "none", cursor: "pointer", fontFamily: FONT_SANS, fontSize: 13, color: COLORS.inkSoft, textDecoration: "underline" }}>
                    {budget > 0 ? `งบ ฿${THB(budget)}` : "ตั้งงบ"}
                  </button>
                )}
              </div>
              {budget > 0 && (
                <>
                  <div style={{ height: 6, borderRadius: 3, background: COLORS.bg, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: over ? COLORS.owed : c.color }} />
                  </div>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: over ? COLORS.owed : COLORS.inkSoft }}>
                    ใช้ไป ฿{THB(spent)} จาก ฿{THB(budget)} {over ? "— เกินงบแล้ว" : ""}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================================
// ROOM SETUP — shown once before anything else (creates / joins a shared room)
// =========================================================================

function RoomSetup({ onSetup }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  const handleCreate = () => {
    const newCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    onSetup(newCode);
  };

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) { setErr("กรุณากรอกรหัสให้ครบ"); return; }
    onSetup(trimmed);
  };

  const card = {
    background: COLORS.surface,
    borderRadius: 20,
    padding: "28px 24px",
    boxShadow: COLORS.shadow,
    marginBottom: 16,
    cursor: "pointer",
    border: `2px solid ${COLORS.line}`,
    textAlign: "left",
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: FONT_SANS }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>🏠</div>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 26, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>Homie</div>
      <div style={{ color: COLORS.inkSoft, fontSize: 15, marginBottom: 36, textAlign: "center" }}>แอปจัดการบ้านสำหรับสองคน</div>

      {!mode && (
        <div style={{ width: "100%", maxWidth: 340 }}>
          <div style={card} onClick={handleCreate}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>✨ สร้างบ้านใหม่</div>
            <div style={{ color: COLORS.inkSoft, fontSize: 14 }}>สร้างรหัสบ้านใหม่ แล้วแชร์ให้อีกคนเข้าร่วม</div>
          </div>
          <div style={{ ...card, marginBottom: 0 }} onClick={() => setMode("join")}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🔑 เข้าร่วมบ้าน</div>
            <div style={{ color: COLORS.inkSoft, fontSize: 14 }}>มีรหัสบ้านจากอีกคนแล้ว กรอกเพื่อเข้าร่วม</div>
          </div>
        </div>
      )}

      {mode === "join" && (
        <div style={{ width: "100%", maxWidth: 340 }}>
          <div style={{ color: COLORS.inkSoft, fontSize: 14, marginBottom: 10 }}>กรอกรหัสบ้านที่ได้รับมา</div>
          <input
            autoFocus
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setErr(""); }}
            placeholder="เช่น  AB12CD"
            style={{ width: "100%", padding: "14px 16px", fontSize: 22, fontWeight: 700, letterSpacing: 4, textAlign: "center", border: `2px solid ${err ? COLORS.owed : COLORS.line}`, borderRadius: 14, outline: "none", background: COLORS.surface, color: COLORS.ink, marginBottom: 8, boxSizing: "border-box" }}
          />
          {err && <div style={{ color: COLORS.owed, fontSize: 13, marginBottom: 8 }}>{err}</div>}
          <button onClick={handleJoin} style={{ width: "100%", padding: "14px 0", background: COLORS.brand, color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>เข้าร่วม</button>
          <button onClick={() => { setMode(null); setCode(""); setErr(""); }} style={{ width: "100%", padding: "12px 0", background: "transparent", color: COLORS.inkSoft, border: "none", fontSize: 14, cursor: "pointer" }}>← ย้อนกลับ</button>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// PROFILE PICKER — shown on a new device when room already has profiles
// =========================================================================

function ProfilePicker({ profiles, onPick }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: FONT_SANS }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>คุณเป็นใคร?</div>
      <div style={{ color: COLORS.inkSoft, fontSize: 15, marginBottom: 32 }}>เลือกโปรไฟล์ของคุณ</div>
      <div style={{ width: "100%", maxWidth: 320 }}>
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => onPick(p.id)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", background: COLORS.surface, border: `2px solid ${COLORS.line}`, borderRadius: 18, marginBottom: 12, cursor: "pointer", boxShadow: COLORS.shadow }}
          >
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
              {p.name.charAt(0)}
            </div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 700, color: COLORS.ink }}>{p.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// MAIN APP
// =========================================================================

export default function App() {
  const [roomCode, setRoomCode] = useState(() => loadJSON(KEYS.roomCode, null));
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState("home");

  const [shopping, setShopping] = useState([]);
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);
  const [moods, setMoods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});

  // Firebase real-time listener — runs whenever roomCode changes
  useEffect(() => {
    if (!roomCode) { setLoading(false); return; }
    _roomCode = roomCode; // enable Firebase writes in saveJSON

    const roomRef = ref(db, `rooms/${roomCode}`);
    onValue(roomRef, (snap) => {
      const data = snap.val() || {};
      setProfiles(data.profiles ?? null);
      // activeProfile stays local (per device)
      setActiveId(prev => prev || loadJSON(KEYS.activeProfile, null) || data.profiles?.[0]?.id || null);
      setShopping(data.shopping ?? []);
      setEvents(data.events ?? []);
      setTodos(data.todos ?? []);
      setMoods(data.moods ?? []);
      setTransactions(data.transactions ?? []);
      setBudgets(data.budgets ?? {});
      setLoading(false);
    }, (err) => { console.error("Firebase error:", err); setLoading(false); });

    return () => off(roomRef);
  }, [roomCode]);

  const handleRoomSetup = (code) => {
    localStorage.setItem(KEYS.roomCode, JSON.stringify(code));
    setRoomCode(code);
    setLoading(true);
  };

  const handleOnboardingComplete = (newProfiles) => {
    setProfiles(newProfiles);
    setActiveId(newProfiles[0].id);
    saveJSON(KEYS.profiles, newProfiles);         // → Firebase + localStorage
    saveJSON(KEYS.activeProfile, newProfiles[0].id); // → localStorage only (not in FB_KEY)
  };

  const switchProfile = (id) => {
    setActiveId(id);
    try { localStorage.setItem(KEYS.activeProfile, JSON.stringify(id)); } catch {}
  };

  // ── Step 1: No room code yet ──────────────────────────────────────────────
  if (!roomCode) {
    return (
      <>
        <FontLoader />
        <RoomSetup onSetup={handleRoomSetup} />
      </>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: FONT_SANS, color: COLORS.inkSoft }}>
        กำลังโหลด...
      </div>
    );
  }

  // ── Step 2: Room exists but no profiles yet → create household ───────────
  if (!profiles || profiles.length < 2) {
    return (
      <>
        <FontLoader />
        <Onboarding onComplete={handleOnboardingComplete} />
      </>
    );
  }

  // ── Step 3: Profiles exist but this device hasn't picked one ────────────
  if (!activeId || !profiles.find(p => p.id === activeId)) {
    return (
      <>
        <FontLoader />
        <ProfilePicker profiles={profiles} onPick={(id) => {
          setActiveId(id);
          try { localStorage.setItem(KEYS.activeProfile, JSON.stringify(id)); } catch {}
        }} />
      </>
    );
  }

  const activeProfile = profiles.find((p) => p.id === activeId) || profiles[0];

  const pendingShoppingCount = shopping.filter((s) => !s.done).length;
  const openTodoCount = todos.filter((t) => !t.done).length;
  const todayEventCount = events.filter((e) => e.date === todayISO()).length;
  const calendarBadge = openTodoCount + todayEventCount;
  const myBalanceForBadge = computeBalances(transactions, profiles)[activeProfile.id] || 0;
  const financeBadge = myBalanceForBadge < 0 ? 1 : 0;

  const NAV_ITEMS = [
    { id: "home", label: "หน้าแรก", icon: HomeIcon },
    { id: "shopping", label: "ของที่ต้องซื้อ", icon: ShoppingCart, badge: pendingShoppingCount },
    { id: "calendar", label: "ปฏิทิน", icon: CalendarIcon, badge: calendarBadge },
    { id: "finance", label: "การเงิน", icon: Wallet, badge: financeBadge },
  ];

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", boxSizing: "border-box" }}>
      <FontLoader />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 96px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: FONT_SERIF, fontSize: 24, fontWeight: 700, color: COLORS.brand, margin: 0 }}>Homie</h1>
            <div style={{ fontSize: 11, color: COLORS.inkFaint, marginTop: 2 }}>🏠 {roomCode}</div>
          </div>
          <ProfileSwitcher profiles={profiles} activeId={activeId} onSwitch={switchProfile} />
        </div>

        {tab === "home" && (
          <HomeTab profiles={profiles} activeProfile={activeProfile} shopping={shopping} events={events} todos={todos} transactions={transactions} onNavigate={setTab} />
        )}
        {tab === "shopping" && (
          <ShoppingTab shopping={shopping} setShopping={setShopping} profiles={profiles} activeProfile={activeProfile} />
        )}
        {tab === "calendar" && (
          <CalendarTab
            events={events} setEvents={setEvents}
            todos={todos} setTodos={setTodos}
            moods={moods} setMoods={setMoods}
            profiles={profiles} activeProfile={activeProfile}
          />
        )}
        {tab === "finance" && (
          <FinanceTab transactions={transactions} setTransactions={setTransactions} profiles={profiles} activeProfile={activeProfile} budgets={budgets} setBudgets={setBudgets} />
        )}
      </div>

      <BottomNav items={NAV_ITEMS} active={tab} onSelect={setTab} />
    </div>
  );
}

function BottomNav({ items, active, onSelect }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
      background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      <div style={{
        maxWidth: 720, margin: "0 auto", display: "flex",
        justifyContent: "space-around", alignItems: "stretch", padding: "6px 4px",
      }}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 3, border: "none", background: "none", cursor: "pointer",
                padding: "6px 10px", flex: 1, minWidth: 0,
              }}
            >
              <div style={{ position: "relative" }}>
                <Icon size={22} color={isActive ? COLORS.brand : COLORS.inkFaint} strokeWidth={isActive ? 2.4 : 1.8} />
                {!!item.badge && (
                  <div style={{
                    position: "absolute", top: -5, right: -8, minWidth: 15, height: 15, borderRadius: 12,
                    background: COLORS.owed, color: "#fff", fontFamily: FONT_SANS, fontSize: 10, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
                    border: `1.5px solid ${COLORS.surface}`,
                  }}>
                    {item.badge > 9 ? "9+" : item.badge}
                  </div>
                )}
              </div>
              <span style={{
                fontFamily: FONT_SANS, fontSize: 10.5, fontWeight: isActive ? 700 : 500,
                color: isActive ? COLORS.brand : COLORS.inkFaint,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FontLoader() {
  return <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" />;
}
