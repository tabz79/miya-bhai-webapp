// client/src/pages/AuthCallback.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);

  const L = (...args: any[]) => {
    const msg = args
      .map((a) => {
        try {
          if (typeof a === "string") return a;
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(" ");
    // console also for full trace
    console.log("[AuthCallback]", msg);
    setLogs((s) => [...s, msg].slice(-40));
  };

  useEffect(() => {
    let unsub: any = null;
    let timeout: any = null;

    const run = async () => {
      L("Arrived at:", window.location.href);
      L("location.hash:", window.location.hash || "<empty>");
      L("location.search:", window.location.search || "<empty>");

      // 1) Try Supabase helper (getSessionFromUrl) if available
      try {
        if ((supabase.auth as any).getSessionFromUrl) {
          L("Calling getSessionFromUrl({ storeSession: true })");
          const res: any = await (supabase.auth as any)
            .getSessionFromUrl({ storeSession: true })
            .catch((e: any) => {
              L("getSessionFromUrl error:", e && (e.message || e));
              return null;
            });
          L("getSessionFromUrl result:", res);
        } else {
          L("getSessionFromUrl not available on this supabase client");
        }
      } catch (e: any) {
        L("getSessionFromUrl threw:", e && (e.message || e));
      }

      // 2) short wait then check supabase.auth.getSession()
      await new Promise((r) => setTimeout(r, 500));
      try {
        const { data } = await supabase.auth.getSession();
        L("getSession() result:", data);
        if (data?.session) {
          L("✅ session present after getSession(), redirecting to /");
          timeout = setTimeout(() => navigate("/"), 600);
          return;
        }
      } catch (e: any) {
        L("getSession() threw:", e && (e.message || e));
      }

      // 3) Subscribe to auth state changes as fallback
      L("Subscribing to onAuthStateChange to catch SIGNED_IN");
      const sub = supabase.auth.onAuthStateChange((event, session) => {
        L("onAuthStateChange event:", event, "sessionPresent:", !!session);
        if (event === "SIGNED_IN" && session) {
          L("✅ Received SIGNED_IN, redirecting to /");
          timeout = setTimeout(() => navigate("/"), 600);
          try {
            // unsubscribe if possible
            (sub as any)?.data?.subscription?.unsubscribe?.();
          } catch {}
        }
      });
      unsub = sub;

      // 4) Manual parse of hash for diagnostics
      if (window.location.hash && window.location.hash.includes("access_token")) {
        L("Hash contains access_token. Manual parse:");
        try {
          const h = window.location.hash.replace("#", "");
          const params = Object.fromEntries(
            h.split("&").map((p) => p.split("=").map(decodeURIComponent))
          );
          L("Parsed hash keys:", Object.keys(params));
        } catch (e: any) {
          L("Manual hash parse error:", e && (e.message || e));
        }
      } else {
        L("Hash does NOT contain access_token.");
      }

      // 5) Timeout guard -> invalid link
      timeout = setTimeout(() => {
        L("❌ No session found after checks — going to /auth/invalid-link");
        navigate("/auth/invalid-link");
      }, 5000);
    };

    run();

    return () => {
      try {
        (unsub as any)?.data?.subscription?.unsubscribe?.();
      } catch {}
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="bg-white p-6 rounded shadow text-left max-w-xl">
        <h3 className="font-semibold mb-2">Finalizing login — diagnostics</h3>
        <p className="text-sm mb-4">
          Open the browser console for full logs. This box shows the latest logs for easy copy/paste.
        </p>
        <div className="text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500">Waiting for logs…</div>
          ) : (
            logs.map((l, i) => (
              <div key={i} className="mb-1">
                <code>{l}</code>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
