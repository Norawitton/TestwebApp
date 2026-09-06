// Auth service — Supabase Auth
import { supabase } from "@/lib/supabase";

export interface Session {
  userId: string;
  pinVerified: boolean;
}

// Supabase-js throws its raw English error message (e.g. "Invalid login
// credentials") straight from the API response. Map the common ones to
// Thai so the login/signup form never shows an untranslated English
// string to the user; anything unrecognized falls back to a generic Thai
// message instead of leaking a raw technical string.
const AUTH_ERROR_TRANSLATIONS: Record<string, string> = {
  "Invalid login credentials": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "Email not confirmed": "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
  "User already registered": "อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบแทน",
  "Password should be at least 6 characters": "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
  "Unable to validate email address: invalid format": "รูปแบบอีเมลไม่ถูกต้อง",
  "Email rate limit exceeded": "ส่งคำขอบ่อยเกินไป กรุณาลองใหม่อีกครั้งภายหลัง",
};

function translateAuthError(message: string): string {
  if (AUTH_ERROR_TRANSLATIONS[message]) return AUTH_ERROR_TRANSLATIONS[message];
  // เผื่อ Supabase ส่งข้อความที่มีคำเหล่านี้ปนมา (เช่นแนบรายละเอียดเพิ่ม)
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return AUTH_ERROR_TRANSLATIONS["Invalid login credentials"];
  if (lower.includes("already registered")) return AUTH_ERROR_TRANSLATIONS["User already registered"];
  if (lower.includes("email not confirmed")) return AUTH_ERROR_TRANSLATIONS["Email not confirmed"];
  if (lower.includes("network") || lower.includes("fetch")) {
    return "เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่";
  }
  return "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return { userId: session.user.id, pinVerified: true };
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translateAuthError(error.message));
  return { userId: data.user.id, pinVerified: true };
}

export async function signUp(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(translateAuthError(error.message));
  if (!data.user) throw new Error("ไม่สามารถสมัครสมาชิกได้");
  if (!data.session) throw new Error("กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี แล้วลองเข้าสู่ระบบใหม่");
  return { userId: data.user.id, pinVerified: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function verifyPin(pin: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 300));
  return /^\d{6}$/.test(pin);
}
