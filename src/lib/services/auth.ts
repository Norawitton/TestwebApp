// Auth service layer.
//
// Prototype implementation keeps a fake session flag in localStorage.
// Swap this file's internals for Supabase Auth / Firebase Auth later;
// callers (hooks/screens) only depend on the exported function signatures.

const SESSION_KEY = "aomgun.session";

export interface Session {
  userId: string;
  pinVerified: boolean;
}

function isBrowser() {
  return typeof window !== "undefined";
}

export async function getSession(): Promise<Session | null> {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function signInMock(): Promise<Session> {
  const session: Session = { userId: "user-1", pinVerified: true };
  if (isBrowser()) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

export async function verifyPin(pin: string): Promise<boolean> {
  // Prototype: any 6-digit PIN is accepted.
  await new Promise((r) => setTimeout(r, 300));
  return /^\d{6}$/.test(pin);
}

export async function signOutMock(): Promise<void> {
  if (isBrowser()) window.localStorage.removeItem(SESSION_KEY);
}
