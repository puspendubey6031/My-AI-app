import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../lib/logger";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

let _supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  _supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  logger.info("Supabase client initialized");
} else {
  logger.warn(
    "Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable real-time features",
  );
}

export const supabase = _supabase;

export function isSupabaseReady(): boolean {
  return _supabase !== null;
}
