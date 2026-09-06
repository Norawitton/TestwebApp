"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/services/auth";
import { Mascot } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-ag-yellow-soft px-6">
      <div className="ag-animate-slide-up flex w-full flex-col items-center">
        <Mascot pose="wave" size={100} />
        <h1 className="mt-4 text-2xl font-bold text-ag-navy">ออมกัน</h1>
        <p className="mt-1 text-sm text-ag-text-secondary">บันทึกรายจ่าย ออมเงินได้จริง</p>
      </div>

      <div className="mt-8 w-full ag-animate-slide-up">
        {/* Tab switcher */}
        <div className="mb-6 flex rounded-2xl bg-white/60 p-1 shadow-sm">
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
              mode === "login"
                ? "bg-ag-navy text-white shadow"
                : "text-ag-text-secondary"
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
              mode === "signup"
                ? "bg-ag-navy text-white shadow"
                : "text-ag-text-secondary"
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-ag-grayblue bg-white px-4 py-3.5 text-sm text-ag-text outline-none transition-colors focus:border-ag-blue"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ag-text">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full rounded-2xl border border-ag-grayblue bg-white px-4 py-3.5 text-sm text-ag-text outline-none transition-colors focus:border-ag-blue"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-ag-coral/10 px-4 py-3 text-sm text-ag-coral">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="navy"
            size="lg"
            fullWidth
            disabled={loading}
            className="mt-2"
          >
            {loading
              ? "กำลังโหลด..."
              : mode === "login"
              ? "เข้าสู่ระบบ"
              : "สร้างบัญชีใหม่"}
          </Button>
        </form>
      </div>
    </div>
  );
}
