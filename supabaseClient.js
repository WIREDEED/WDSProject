import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl =
  window.WDS_SUPABASE_URL || "https://hmnsquydtkvgecpgbzyc.supabase.co";
const supabaseAnonKey =
  window.WDS_SUPABASE_ANON_KEY || "sb_publishable_iMEjUAKx-koCRMgDVAIr9g_7wtVagnT";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project-ref") &&
    !supabaseAnonKey.includes("your-publishable-key")
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
