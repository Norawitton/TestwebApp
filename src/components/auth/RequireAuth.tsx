"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mascot } from "@/components/mascot/Mascot";

// Client-side route guard for every screen that shows real user data.
//
// Why this exists: pages used to rely on useAppData()'s refresh() catching
// a "ไม่ได้เข้าสู่ระบบ" error from a Supabase query and redirecting *after*
// the fact — which meant a page could render fully (Home showed a live-
// looking ฿0.00 dashboard) before that redirect kicked in, while other
// pages happened to look "more empty" during the same race and so seemed
// to redirect faster. Checking the session up front, before any protected
// content mounts, makes every route behave the same way: splash while
// checking → children once confirmed, or an immediate redirect with no
// dashboard ever rendered.
//
// This is the client-side half of the guard. The other half already
// exists at the database layer: every table's Row Level Security policy
// is `using (auth.uid() = user_id)`, and this app talks to Postgres only
// through Supabase's PostgREST API (no separate custom backend), so an
// unauthenticated or wrong-user request is rejected there regardless of
// what the UI does. A true server-rendered redirect (Next.js middleware)
// would need session cookies (@supabase/ssr) instead of the localStorage
// session this app uses — a bigger migration, out of scope here.
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (!session) {
        router.replace("/login");
        return; // stay unauthed — splash keeps showing until navigation completes
      }
      setAuthed(true);
    });

    // เผื่อถูก sign out ระหว่างที่หน้านี้เปิดอยู่ — เช็คเฉพาะ event "SIGNED_OUT"
    // ตรงๆ เท่านั้น (ไม่ใช่แค่ session ว่าง) เพราะ onAuthStateChange ของ
    // supabase-js อาจยิง callback แรกด้วย session ว่างชั่วคราวระหว่างโหลด
    // session จาก storage แม้ผู้ใช้จะยัง login อยู่จริงก็ตาม
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAuthed(false);
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (!authed) return <AuthSplash />;
  return <>{children}</>;
}

function AuthSplash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ag-offwhite">
      <Mascot pose="wave" size={90} />
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-ag-blue border-t-transparent" />
    </div>
  );
}
