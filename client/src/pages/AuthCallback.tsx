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
      const hash = sessionStorage.getItem('supabase_oauth_hash');

      if (hash) {
        L("Found hash in sessionStorage:", hash);
        // Clear the hash from storage so we don't re-process it
        sessionStorage.removeItem('supabase_oauth_hash');

        // Use the stored hash to get the session
        const { error } = await supabase.auth.getSessionFromUrl({ 
          url: `${window.location.origin}${window.location.pathname}${hash}`
        });

        if (error) {
          L("Error getting session from stored hash:", error.message);
          navigate("/auth/invalid-link");
        } else {
          L("Successfully got session from stored hash. Navigating to home.");
          // On success, Supabase redirects, but we can navigate just in case.
          navigate("/");
        }
      } else {
        L("No auth hash found in sessionStorage or current URL. This may be an invalid callback.");
        // If there's no hash, it's an invalid visit to this page.
        navigate("/auth/invalid-link");
      }
    };

    handleAuthCallback();
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
