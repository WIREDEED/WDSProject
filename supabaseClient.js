import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl =
  window.WDS_SUPABASE_URL || "https://hmnsquydtkvgecpgbzyc.supabase.co"; // This is the public API URL
const supabaseAnonKey =
  window.WDS_SUPABASE_ANON_KEY || "sb_publishable_iMEjUAKx-koCRMgDVAIr9g_7wtVagnT"; // This is the public anon key

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project-ref") && // This is the project reference
    !supabaseAnonKey.includes("your-publishable-key") // This is the public anon key
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { // ensures its good
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
