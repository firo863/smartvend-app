import { createClient } from "@supabase/supabase-js";

// "Angemeldet bleiben": Bevor supabase-js initialisiert wird, lesen wir die
// gespeicherte Präferenz aus dem letzten Login. localStorage = überlebt
// Browser-Neustart, sessionStorage = Session endet, sobald der Tab/das
// Fenster geschlossen wird.
const remember =
  typeof window !== "undefined"
    ? localStorage.getItem("smartvend-remember") !== "false"
    : true;

const authStorage =
  typeof window !== "undefined" ? (remember ? window.localStorage : window.sessionStorage) : undefined;

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  authStorage
    ? {
        auth: {
          storage: authStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    : undefined
);