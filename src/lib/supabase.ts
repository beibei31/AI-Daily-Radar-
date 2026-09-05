import {
  createClient,
  type RealtimeClientOptions,
  type SupabaseClient
} from "@supabase/supabase-js";

let cachedReadClient: SupabaseClient | null = null;
let cachedWriteClient: SupabaseClient | null = null;

class DisabledRealtimeTransport {
  constructor() {
    throw new Error("Supabase Realtime is disabled for server-side pipeline clients.");
  }
}

const disabledRealtimeTransport =
  DisabledRealtimeTransport as unknown as NonNullable<
    RealtimeClientOptions["transport"]
  >;

const serverClientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: disabledRealtimeTransport
  }
};

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
      serverClientOptions
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
      serverClientOptions
    );
  }

  return cachedWriteClient;
}
