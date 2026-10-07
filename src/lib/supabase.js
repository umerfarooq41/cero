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

const onlineOnlyFetch = (input, init = {}) => {
  const method = String(init.method || "GET").toUpperCase();
  const isReadRequest = method === "GET" || method === "HEAD";

  if (!isReadRequest && typeof navigator !== "undefined" && !navigator.onLine) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cero:offline-write-blocked"));
    }
    return Promise.reject(
      new Error("Cero is offline. Reconnect before making changes.")
    );
  }

  return fetch(input, init);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: onlineOnlyFetch,
  },
});
