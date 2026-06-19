import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Supabase client for React Native. Unlike the web app (which keeps the session
 * in cookies via @supabase/ssr), native persists the session in AsyncStorage.
 * autoRefreshToken keeps the access token fresh while the app is open.
 *
 * Same project, same tables, same RLS as the web app — this client just signs
 * in on the device instead of the browser.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
