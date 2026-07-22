"use server";

import { unstable_noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/server";
import type { AdminLoginState } from "./login-state";

export async function loginAdminAction(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  unstable_noStore();

  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!isValidLoginInput(email, password)) {
    return { error: "invalid_credentials" };
  }

  let isAdmin = false;

  try {
    const supabase = await createServerAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { error: "invalid_credentials" };
    }

    isAdmin = data.user.app_metadata?.role === "admin";
    if (!isAdmin) {
      try {
        await supabase.auth.signOut();
      } catch {
        // 비관리자 세션은 공통 가드에서도 차단되며 오류 원문은 노출하지 않는다.
      }

      return { error: "forbidden" };
    }
  } catch {
    return { error: "generic" };
  }

  if (isAdmin) {
    redirect("/admin/metrics");
  }

  return { error: "generic" };
}

function isValidLoginInput(email: string, password: string): boolean {
  if (!email || !password || email.length > 254 || password.length > 4096) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
