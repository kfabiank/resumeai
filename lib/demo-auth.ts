"use client";

export type DemoPlanType = "free" | "pro" | "premium";

export type DemoUser = {
  name: string;
  email: string;
  planType: DemoPlanType;
};

const STORAGE_KEY = "resumeai_demo_user";

export function getDemoUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DemoUser;
    if (!parsed?.name || !parsed?.email || !parsed?.planType) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setDemoUser(user: DemoUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearDemoUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
