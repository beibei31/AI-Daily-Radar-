import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedReadClient: SupabaseClient | null = null;
let cachedWriteClient: SupabaseClient | null = null;

export function hasSupabaseReadEnv() {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY)
  );
}

export function hasSupabaseWriteEnv() {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      process.env.SUPABASE_SECRET_KEY
  );
}

export function getSupabaseReadClient() {
  if (!hasSupabaseReadEnv()) {
    throw new Error("Supabase read environment variables are missing.");
  }

  if (!cachedReadClient) {
    cachedReadClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.SUPABASE_SECRET_KEY ||
        "",
      {
        auth: {
          persistSession: false
        }
      }
    );
  }

  return cachedReadClient;
}

export function getSupabaseWriteClient() {
  if (!hasSupabaseWriteEnv()) {
    throw new Error("Supabase write environment variables are missing.");
  }

  if (!cachedWriteClient) {
    cachedWriteClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || "",
      {
        auth: {
          persistSession: false
        }
      }
    );
  }

  return cachedWriteClient;
}
