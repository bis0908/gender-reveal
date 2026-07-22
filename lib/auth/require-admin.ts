import "server-only";

import { createForbiddenError, createUnauthorizedError } from "@/lib/errors";
import { createServerAuthClient } from "@/lib/supabase/server";

export async function requireAdmin(): Promise<string> {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error || !user) {
    throw createUnauthorizedError();
  }

  if (user.app_metadata?.role !== "admin") {
    throw createForbiddenError();
  }

  return user.id;
}
