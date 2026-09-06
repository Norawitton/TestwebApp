"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, List, BarChart3, User, Plus } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";

const NAV_ITEMS = [
  { href: "/home", label: "หน้าหลัก", icon: Home },
  { href: "/history", label: "รายการ", icon: List },
  null, // center FAB slot
  { href: "/analytics", label: "วิเคราะห์", icon: BarChart3 },
  { href: "/profile", label: "โปรไฟล์", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px]">
        <div className="relative flex h-[76px] items-center justify-between bg-white px-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(16,42,58,0.08)]">
          {NAV_ITEMS.map((item) => {
            if (item === null) {
              return (
                <div key="fab" className="relative flex w-16 justify-center">
                  <button
                    aria-label="จดรายการเพิ่ม"
                    onClick={() => setSheetOpen(true)}
                    className="absolute -top-7 flex h-16 w-16 items-center justify-center rounded-full bg-ag-blue text-white shadow-[0_8px_20px_rgba(22,137,245,0.4)] transition-transform active:scale-90"
                  >
                    <Plus size={28} strokeWidth={2.5} />
                  </button>
                </div>
              );
            }
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex w-16 flex-col items-center justify-center gap-1"
              >
                <Icon
                  size={22}
                  strokeWidth={2.3}
                  color={active ? "#1689F5" : "#71818E"}
                />
                <span
                  className={clsx(
                    "text-[11px] font-semibold",
                    active ? "text-ag-blue" : "text-ag-text-secondary"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AddTransactionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onNavigate={(path) => {
          setSheetOpen(false);
          router.push(path);
        }}
      />
    </>
  );
}
