import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

let parsedSupabaseUrl;
try {
  parsedSupabaseUrl = new URL(supabaseUrl);
} catch {
  throw new Error("VITE_SUPABASE_URL must be a valid URL.");
}

if (parsedSupabaseUrl.protocol !== "https:") {
  throw new Error("VITE_SUPABASE_URL must use HTTPS.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
