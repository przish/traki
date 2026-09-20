import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

// In Expo, EXPO_PUBLIC_* variables are embedded at build/runtime.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL.trim().length > 0 &&
    typeof SUPABASE_ANON_KEY === "string" &&
    SUPABASE_ANON_KEY.trim().length > 0 &&
    !SUPABASE_URL.includes("your-project-id")
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === "web",
      },
    });
  }

  return clientInstance;
};

export const supabase = getSupabaseClient();
