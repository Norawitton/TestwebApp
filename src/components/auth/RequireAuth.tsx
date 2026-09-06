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
  const [checkError, setCheckError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active) return;
        if (!session) {
          router.replace("/login");
          return; // stay unauthed — splash keeps showing until navigation completes
        }
        setAuthed(true);
      })
      .catch((err) => {
        // เดิมไม่มี .catch() เลย ถ้า getSession() reject (เช่น เน็ตหลุดตอน
        // ติดต่อ Supabase) จะไม่มี callback ไหนทำงานเลย authed จะไม่มีวันเป็น
        // true และไม่ redirect ด้วย ผู้ใช้ค้างอยู่หน้า splash วนตลอดไปไม่มี
        // ทางออกนอกจากรีเฟรชเอง — โชว์ error พร้อมปุ่มลองใหม่แทน
        console.error("ตรวจสอบสิทธิ์เข้าใช้งานไม่สำเร็จ:", err);
        if (!active) return;
        setCheckError(true);
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
    // retryKey เปลี่ยนเพื่อสั่งให้ effect รันเช็ค session ใหม่ตอนกด "ลองใหม่"
  }, [router, retryKey]);

  if (checkError) {
    return (
      <AuthSplash
        error
        onRetry={() => {
          setCheckError(false);
          setRetryKey((k) => k + 1);
        }}
      />
    );
  }
  if (!authed) return <AuthSplash />;
  return <>{children}</>;
}

function AuthSplash({ error, onRetry }: { error?: boolean; onRetry?: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ag-offwhite px-8 text-center">
      <Mascot pose={error ? "worried" : "wave"} size={90} />
      {error ? (
        <>
          <p className="text-sm text-ag-text-secondary">ตรวจสอบสิทธิ์เข้าใช้งานไม่สำเร็จ ลองตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</p>
          <button
            onClick={onRetry}
            className="rounded-2xl bg-ag-blue px-5 py-2.5 text-sm font-bold text-white active:opacity-80"
          >
            ลองใหม่
          </button>
        </>
      ) : (
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ag-blue border-t-transparent" />
      )}
    </div>
  );
}
