// client/src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/styles/overrides.css"; // ← ensure prod fallback grid is loaded
import { supabase } from "@/lib/supabaseClient";

async function finalizeSupabaseSessionIfPresent() {
  try {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const hasAuthFragment = !!hash && (hash.includes("access_token") || hash.includes("type="));
    if (!hasAuthFragment) return;

    // Supabase JS v2 preferred flow
    if (supabase?.auth && typeof (supabase.auth as any).getSessionFromUrl === "function") {
      const { data, error } = await (supabase.auth as any).getSessionFromUrl({ storeSession: true });
      if (error) {
        console.error("getSessionFromUrl error", error);
      } else if (data?.session) {
        // session stored — redirect to profile (use absolute origin)
        window.location.replace(`${window.location.origin}/profile`);
        return;
      }
    }

    // Fallback: redirect to callback page which will try to finalize session there
    window.location.replace(`${window.location.origin}/auth/callback`);
  } catch (err) {
    console.error("Error finalizing supabase session from URL", err);
    // don't block app render — let app mount so user isn't stuck
  }
}

// run the handler first, then render the app.
// If the handler redirects, the app won't render in this page load.
finalizeSupabaseSessionIfPresent().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
