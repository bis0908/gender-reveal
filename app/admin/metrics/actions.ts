"use server";

import { unstable_noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/server";

/**
 * 관리자 로그아웃 Server Action.
 * signOut 실패(이미 만료된 세션 등)에도 로그인 페이지로 리다이렉트한다.
 * 로그아웃은 멱등 — 세션 상태와 무관하게 항상 로그인 화면으로 이동한다.
 */
export async function logoutAdminAction(): Promise<void> {
  unstable_noStore();

  try {
    const supabase = await createServerAuthClient();
    await supabase.auth.signOut();
  } catch {
    // signOut 실패(네트워크 오류, 만료 세션 등)는 무시한다.
    // 로그아웃은 멱등하므로 세션 상태와 무관하게 로그인 페이지로 이동한다.
  }

  redirect("/admin/login");
}
