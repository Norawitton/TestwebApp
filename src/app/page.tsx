"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/services/database";
import { Mascot } from "@/components/mascot/Mascot";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const profile = await getProfile();
      router.replace(profile.onboarded ? "/home" : "/onboarding");
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ag-yellow-soft">
      <Mascot pose="wave" size={96} />
      <p className="font-bold text-ag-navy">กำลังเปิดออมกัน...</p>
    </div>
  );
}
