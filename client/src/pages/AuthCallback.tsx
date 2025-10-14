// client/src/pages/AuthCallback.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

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
    console.log("[AuthCallback]", msg);
    setLogs((s) => [...s, msg].slice(-60));
  };

  useEffect(() => {
    L("[AuthCallback] starting diagnostics");
    L("window.location.href:", window.location.href);
    L("location.hash:", window.location.hash || "<empty>");
    L("location.search:", window.location.search || "<empty>");

    let unsub: any = null;
    let guardTimeout: any = null;

    const cleanup = () => {
      try {
        (unsub as any)?.data?.subscription?.unsubscribe?.();
      } catch {}
      clearTimeout(guardTimeout);
    };

    (async () => {
      try {
        // 0) If fragment present, try standard supabase extractor first
        if (window.location.hash && window.location.hash.includes("access_token")) {
          L("Hash contains access_token — attempting getSessionFromUrl / manual setSession.");

          if ((supabase.auth as any).getSessionFromUrl) {
            L("Calling supabase.auth.getSessionFromUrl({ storeSession: true })");
            try {
              const r = await (supabase.auth as any).getSessionFromUrl?.({ storeSession: true });
              L("getSessionFromUrl result:", r);
              if (r?.data?.session) {
                L("✅ session obtained via getSessionFromUrl — redirecting to /");
                // clean url
                const u = new URL(window.location.href);
                u.hash = "";
                u.search = "";
                window.history.replaceState({}, document.title, u.pathname);
                navigate("/");
                return;
              }
            } catch (e: any) {
              L("getSessionFromUrl threw:", e && (e.message || e));
            }
          }

          // fallback: manual parse + setSession
          try {
            const h = window.location.hash.replace("#", "");
            const params = Object.fromEntries(h.split("&").map((p) => p.split("=").map(decodeURIComponent)) as any);
            L("Manual parsed hash keys:", Object.keys(params));
            if (params.access_token) {
              const { data, error } = await supabase.auth.setSession({
                access_token: params.access_token,
                refresh_token: params.refresh_token,
              } as any);
              if (error) {
                L("manual setSession error:", error.message || error);
              } else {
                L("manual setSession success:", data);
                // clear url
                const u = new URL(window.location.href);
                u.hash = "";
                u.search = "";
                window.history.replaceState({}, document.title, u.pathname);
                navigate("/");
                return;
              }
            }
          } catch (e: any) {
            L("manual parse/setSession threw:", e && (e.message || e));
          }
        }

        // 1) Try getSessionFromUrl even if no fragment — some libs still handle
        if ((supabase.auth as any).getSessionFromUrl) {
          try {
            L("Attempting getSessionFromUrl({ storeSession: true }) even if no fragment");
            const r = await (supabase.auth as any).getSessionFromUrl?.({ storeSession: true });
            L("getSessionFromUrl result:", r);
            if (r?.data?.session) {
              L("✅ session via getSessionFromUrl — redirecting to /");
              navigate("/");
              return;
            }
          } catch (e: any) {
            L("getSessionFromUrl threw:", e && (e.message || e));
          }
        }

        // 2) Check cookie-based session (supabase may set cookie on /auth/v1/callback proxy)
        try {
          L("Calling supabase.auth.getSession() to check cookie-based session");
          const sess = await supabase.auth.getSession();
          L("getSession() result:", sess);
          if (sess?.data?.session) {
            L("✅ session present via getSession() — redirecting to /");
            navigate("/");
            return;
          }
        } catch (e: any) {
          L("getSession() threw:", e && (e.message || e));
        }

        // 3) Log getUser for extra clue
        try {
          L("Calling supabase.auth.getUser()");
          const user = await supabase.auth.getUser?.();
          L("getUser result:", user);
        } catch (e: any) {
          L("getUser threw:", e && (e.message || e));
        }

        // 4) Print code param if present (auth code flow)
        try {
          const q = new URL(window.location.href).searchParams;
          if (q.has("code")) {
            const code = String(q.get("code"));
            L("Query param 'code' present (first 120 chars):", code.slice(0, 120));
          } else {
            L("No 'code' present in query params.");
          }
        } catch (e: any) {
          L("Failed reading query params:", e && (e.message || e));
        }

        // 5) Subscribe to auth state changes
        try {
          L("Subscribing to onAuthStateChange to detect SIGNED_IN events");
          const sub = supabase.auth.onAuthStateChange((event, session) => {
            L("onAuthStateChange event:", event, "sessionPresent:", !!session);
            if (event === "SIGNED_IN" && session) {
              L("✅ SIGNED_IN detected — redirecting to /");
              cleanup();
              navigate("/");
            }
          });
          unsub = sub;
        } catch (e: any) {
          L("onAuthStateChange subscription threw:", e && (e.message || e));
        }

        // 6) final guard -> invalid link after short wait
        guardTimeout = setTimeout(() => {
          L("❌ No session found after checks — navigating to /auth/invalid-link");
          cleanup();
          navigate("/auth/invalid-link");
        }, 5000);
      } catch (err) {
        L("Unhandled error in AuthCallback run:", err);
        cleanup();
      }
    })();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleManualParse = async () => {
    L("Manual parse button clicked.");
    if (window.location.hash && window.location.hash.includes("access_token")) {
      L("Hash contains access_token. Manual parse:");
      try {
        const h = window.location.hash.replace("#", "");
        const params: any = Object.fromEntries(h.split("&").map((p) => p.split("=").map(decodeURIComponent)) as any);
        L("Parsed hash keys:", Object.keys(params));

        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        } as any);

        if (error) {
          L("Manual setSession error:", error.message || error);
        } else {
          L("Manual setSession success:", data);
          navigate("/");
        }
      } catch (e: any) {
        L("Manual hash parse error:", e && (e.message || e));
      }
    } else {
      L("Hash does NOT contain access_token.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="bg-white p-6 rounded shadow text-left max-w-xl">
        <h3 className="font-semibold mb-2">Finalizing login — diagnostics</h3>
        <p className="text-sm mb-4">Open the browser console for full logs. This box shows the latest logs for easy copy/paste.</p>
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
        <Button onClick={handleManualParse} className="w-full mt-4">
          Manually Parse Hash
        </Button>
      </div>
    </div>
  );
}
