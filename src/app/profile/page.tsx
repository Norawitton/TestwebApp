"use client";

import { useState } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { Card } from "@/components/ui/Card";
import { Mascot } from "@/components/mascot/Mascot";
import { useAppData } from "@/hooks/useAppData";
import { exportTransactionsCsv, resetAllData, deleteAccount } from "@/lib/services/database";
import { signOut } from "@/lib/services/auth";
import {
  CreditCard,
  Bell,
  Download,
  RefreshCw,
  Fingerprint,
  ShieldCheck,
  Trash2,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { IllustrationCreditCard } from "@/components/illustrations/Illustrations";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, accounts, saveProfile } = useAppData();
  const [exporting, setExporting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingDeleteAccount, setConfirmingDeleteAccount] = useState(false);

  async function handleExport() {
    setExporting(true);
    const csv = await exportTransactionsCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aomgun-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  async function handleDeleteData() {
    await resetAllData();
    router.push("/onboarding");
  }

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  async function handleDeleteAccount() {
    await deleteAccount();
    router.push("/login");
  }

  if (!profile) return null;

  return (
    <AppShell>
      <div className="rounded-b-[28px] bg-ag-navy px-5 pb-8 pt-8 text-white">
        <div className="flex items-center gap-4">
          <Mascot pose="wave" size={64} />
          <div>
            <p className="text-lg font-bold">{profile.name}</p>
            <p className="text-sm text-white/60">{profile.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-5">
        {/* Accounts and credit cards */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold text-ag-text">บัญชีและบัตรเครดิต</h2>
            <button
              onClick={() => router.push("/accounts")}
              className="text-xs font-semibold text-ag-blue active:opacity-70"
            >
              จัดการ
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto ag-scrollbar-hide pb-1">
            {accounts
              .filter((a) => a.type === "credit_card")
              .map((a) => (
                <div key={a.id} className="shrink-0">
                  <IllustrationCreditCard size={140} colorFrom={a.colorFrom} colorTo={a.colorTo} />
                  <p className="mt-1 text-xs font-semibold text-ag-text">{a.name}</p>
                </div>
              ))}
            {accounts.filter((a) => a.type === "credit_card").length === 0 && (
              <button
                onClick={() => router.push("/accounts")}
                className="flex h-[86px] w-[140px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-ag-grayblue text-ag-text-secondary active:bg-ag-grayblue/30"
              >
                <CreditCard size={20} color="#71818E" />
                <span className="text-[11px] font-semibold">เพิ่มบัตรเครดิต</span>
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {accounts
              .filter((a) => a.type !== "credit_card")
              .map((a) => (
                <Card key={a.id} padded={false} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-semibold text-ag-text">{a.name}</span>
                  <span className="text-xs text-ag-text-secondary">
                    {a.type === "cash" ? "เงินสด" : a.type === "e_wallet" ? "e-Wallet" : "บัญชีธนาคาร"}
                  </span>
                </Card>
              ))}
          </div>
        </div>

        {/* Settings list */}
        <div>
          <h2 className="mb-2 font-bold text-ag-text">การตั้งค่า</h2>
          <Card padded={false} className="divide-y divide-ag-grayblue/60">
            <SettingsRow icon={Bell} label="การแจ้งเตือน" comingSoon />
            <SettingsRow
              icon={Fingerprint}
              label="ตั้งค่า PIN หรือ Biometric"
              trailing={
                <Toggle
                  checked={profile.biometricEnabled}
                  onChange={(v) => saveProfile({ biometricEnabled: v })}
                />
              }
            />
            <button
              onClick={() => router.push("/accounts")}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-ag-grayblue/40"
            >
              <CreditCard size={18} color="#71818E" />
              <span className="flex-1 text-sm font-semibold text-ag-text">จัดการบัญชีและบัตร</span>
              <ChevronRight size={16} color="#71818E" />
            </button>
          </Card>
        </div>

        {/* Data management */}
        <div>
          <h2 className="mb-2 font-bold text-ag-text">ข้อมูลของฉัน</h2>
          <Card padded={false} className="divide-y divide-ag-grayblue/60">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-ag-grayblue/40"
            >
              <Download size={18} color="#71818E" />
              <span className="flex-1 text-sm font-semibold text-ag-text">
                {exporting ? "กำลังส่งออกข้อมูล..." : "ส่งออกข้อมูล CSV"}
              </span>
              <ChevronRight size={16} color="#71818E" />
            </button>
            <SettingsRow icon={RefreshCw} label="สำรองข้อมูล" comingSoon />
            <SettingsRow icon={ShieldCheck} label="นโยบายความเป็นส่วนตัว" comingSoon />
          </Card>
        </div>

        {/* Logout */}
        <Card padded={false}>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-ag-grayblue/40"
          >
            <LogOut size={18} color="#1689F5" />
            <span className="flex-1 text-sm font-semibold text-ag-blue">ออกจากระบบ</span>
          </button>
        </Card>

        {/* Danger zone */}
        <div>
          <h2 className="mb-2 font-bold text-ag-coral">โซนอันตราย</h2>
          <Card padded={false} className="divide-y divide-ag-grayblue/60">
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-ag-grayblue/40"
            >
              <Trash2 size={18} color="#F36B5F" />
              <span className="flex-1 text-sm font-semibold text-ag-coral">ลบข้อมูลทั้งหมด</span>
            </button>
            <button
              onClick={() => setConfirmingDeleteAccount(true)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-ag-grayblue/40"
            >
              <Trash2 size={18} color="#F36B5F" />
              <span className="flex-1 text-sm font-semibold text-ag-coral">ลบบัญชีผู้ใช้</span>
            </button>
          </Card>
        </div>
      </div>

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ag-navy/50 px-8">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 text-center ag-animate-slide-up">
            <Mascot pose="worried" size={72} />
            <h3 className="mt-3 text-lg font-bold text-ag-text">ยืนยันการลบข้อมูล?</h3>
            <p className="mt-1 text-sm text-ag-text-secondary">
              รายการ บัญชี งบประมาณ และเป้าหมายทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้ (บัญชีผู้ใช้ของคุณจะยังอยู่ ไม่ถูกออกจากระบบ)
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmingDelete(false)}
                className="h-12 flex-1 rounded-2xl bg-ag-grayblue text-sm font-bold text-ag-text"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteData}
                className="h-12 flex-1 rounded-2xl bg-ag-coral text-sm font-bold text-white"
              >
                ลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmingDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ag-navy/50 px-8">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 text-center ag-animate-slide-up">
            <Mascot pose="worried" size={72} />
            <h3 className="mt-3 text-lg font-bold text-ag-text">ยืนยันการลบบัญชีผู้ใช้?</h3>
            <p className="mt-1 text-sm text-ag-text-secondary">
              ข้อมูลทั้งหมดของคุณ (รายการ, บัญชี, งบประมาณ, เป้าหมาย) รวมถึงตัวบัญชีผู้ใช้เองจะถูกลบถาวร
              และคุณจะถูกออกจากระบบทันที — กู้คืนไม่ได้
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmingDeleteAccount(false)}
                className="h-12 flex-1 rounded-2xl bg-ag-grayblue text-sm font-bold text-ag-text"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteAccount}
                className="h-12 flex-1 rounded-2xl bg-ag-coral text-sm font-bold text-white"
              >
                ลบบัญชีผู้ใช้
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  trailing,
  comingSoon,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  trailing?: React.ReactNode;
  // ยังไม่มีฟีเจอร์รองรับจริง — โชว์ป้าย "เร็วๆ นี้" แทนลูกศร ">" เพื่อไม่ให้
  // ดูเหมือนกดแล้วไปหน้าอื่นได้ทั้งที่กดไปก็ไม่มีอะไรเกิดขึ้น
  comingSoon?: boolean;
}) {
  return (
    <div className={clsx("flex items-center gap-3 px-4 py-3.5", comingSoon && "opacity-50")}>
      <Icon size={18} color="#71818E" />
      <span className="flex-1 text-sm font-semibold text-ag-text">{label}</span>
      {comingSoon ? (
        <span className="rounded-full bg-ag-grayblue px-2.5 py-1 text-[11px] font-semibold text-ag-text-secondary">
          เร็วๆ นี้
        </span>
      ) : (
        trailing ?? <ChevronRight size={16} color="#71818E" />
      )}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-ag-blue" : "bg-ag-grayblue"}`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
