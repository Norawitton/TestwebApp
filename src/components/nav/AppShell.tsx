import { ReactNode } from "react";
import { BottomNav } from "@/components/nav/BottomNav";

export function AppShell({ children, bg = "#FFFDF7" }: { children: ReactNode; bg?: string }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col" style={{ backgroundColor: bg }}>
      <div className="flex-1" style={{ paddingBottom: "calc(76px + env(safe-area-inset-bottom) + 20px)" }}>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
