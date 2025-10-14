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
    const handleAuthCallback = async () => {
      L("Component mounted. Checking for auth hash...");

      // Restore any saved hash (inline script may have stashed it)
      let hash = sessionStorage.getItem("supabase_oauth_hash") || window.location.hash || "";
      if (hash && !hash.startsWith("#")) hash = `#${hash}"`;

      if (hash) {
        L("Found hash (short):", (hash || "").slice(0, 200) + (hash.length > 200 ? "…" : ""));
        // clear the storage early so we don't re-process it accidentally
        sessionStorage.removeItem("supabase_oauth_hash");

        // Manual parse & setSession approach (robust against SDK helper failures)
        try {
          const raw = hash.startsWith("#") ? hash.slice(1) : hash;
          const params = Object.fromEntries(
            raw.split("&").map((p) => {
              const [k, v] = p.split("=");
              return [k, decodeURIComponent(v || "")];
            })
          ) as Record<string, string>;

          L("Parsed keys:", Object.keys(params));

          if (params.access_token) {
            L("Using supabase.auth.setSession to apply tokens...");
            const { data, error } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            } as any);

            if (error) {
              L("setSession error:", error.message || error);
              // fallback: try getSessionFromUrl guarded
            } else {
              L("Manual setSession success:", data);
              // cleanup url & redirect home
              try {
                history.replaceState(null, "", window.location.pathname + window.location.search);
              } catch {}
              navigate("/");
              return;
            }
          } else {
            L("Parsed hash contains no access_token — falling back to SDK helper.");
          }
        } catch (e: any) {
          L("Manual parse/setSession threw:", e && (e.message || e));
          // continue to try SDK helper below
        }

        // Guarded attempt using SDK helper as a last resort
        if ((supabase.auth as any).getSessionFromUrl) {
          try {
            L("Attempting getSessionFromUrl as fallback (guarded)");
            const res = await (supabase.auth as any).getSessionFromUrl?.({
              url: `${window.location.origin}${window.location.pathname}${hash}`,
              storeSession: true,
            });
            L("getSessionFromUrl result:", res);
            if (res?.data?.session) {
              L("getSessionFromUrl succeeded — redirecting to /");
              try {
                sessionStorage.removeItem("supabase_oauth_hash");
                history.replaceState(null, "", window.location.pathname + window.location.search);
              } catch {}
              navigate("/");
              return;
            }
          } catch (err: any) {
            L("getSessionFromUrl error (caught):", err && (err.message || err));
            navigate("/auth/invalid-link");
            return;
          }
        }

        // If we reached here, nothing worked
        L("❌ Unable to establish session from hash — navigating to /auth/invalid-link");
        navigate("/auth/invalid-link");
        return;
      }

      L("No auth hash found in sessionStorage or current URL. This may be an invalid callback.");
      navigate("/auth/invalid-link");
    };

    handleAuthCallback();
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
