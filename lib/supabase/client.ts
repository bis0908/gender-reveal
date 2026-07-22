"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAuthConfig } from "./config";

let browserAuthClient: SupabaseClient | null = null;

export function createBrowserAuthClient(): SupabaseClient {
  if (browserAuthClient) {
    return browserAuthClient;
  }

  const { url, publishableKey } = getSupabaseAuthConfig();
  browserAuthClient = createBrowserClient(url, publishableKey);

  return browserAuthClient;
}
