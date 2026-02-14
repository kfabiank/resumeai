"use client";

import { useEffect, useState } from "react";
import { DemoUser, getDemoUser } from "@/lib/demo-auth";

const GUEST_USER: DemoUser = {
  name: "Guest",
  email: "",
  planType: "free",
};

export function useDemoUser() {
  const [user, setUser] = useState<DemoUser>(GUEST_USER);

  useEffect(() => {
    const stored = getDemoUser();
    if (stored) setUser(stored);
  }, []);

  return { user, setUser };
}
