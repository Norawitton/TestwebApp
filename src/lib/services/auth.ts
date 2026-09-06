// Auth service — Supabase Auth
import { supabase } from "@/lib/supabase";

export interface Session {
  userId: string;
  pinVerified: boolean;
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return { userId: session.user.id, pinVerified: true };
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return { userId: data.user.id, pinVerified: true };
}

export async function signUp(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
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
