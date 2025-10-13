// client/src/pages/AuthCallback.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finalizing login... Please wait.");

  useEffect(() => {
    let timeout: any;

    const finalize = async () => {
      console.log("[AuthCallback] Arrived at:", window.location.href);

      try {
        // First try built-in helper
        const { data: sessionData, error: urlError } =
          (await (supabase.auth as any).getSessionFromUrl?.({
            storeSession: true,
          })) || {};

        if (urlError) console.warn("[AuthCallback] getSessionFromUrl error:", urlError);
        if (sessionData?.session) {
          console.log("[AuthCallback] ✅ Session obtained via getSessionFromUrl");
          setMessage("Login successful — redirecting...");
          timeout = setTimeout(() => navigate("/"), 700);
          return;
        }

        // Wait a short bit, then check session directly
        await new Promise((r) => setTimeout(r, 800));
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log("[AuthCallback] ✅ Session found via getSession()");
          setMessage("Login successful — redirecting...");
          timeout = setTimeout(() => navigate("/"), 700);
          return;
        }

        // Subscribe to auth changes as fallback
        console.log("[AuthCallback] Waiting for SIGNED_IN event...");
        const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log("[AuthCallback] Event:", event, !!newSession);
          if (event === "SIGNED_IN" && newSession) {
            console.log("[AuthCallback] ✅ SIGNED_IN received");
            setMessage("Login successful — redirecting...");
            timeout = setTimeout(() => navigate("/"), 700);
            data.subscription.unsubscribe();
          }
        });

        // Timeout guard: redirect to invalid-link if nothing happens
        timeout = setTimeout(() => {
          console.warn("[AuthCallback] ❌ No session found — invalid link");
          setMessage("Login failed or link expired — redirecting...");
          navigate("/auth/invalid-link");
        }, 5000);
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        setMessage("Unexpected error — redirecting...");
        timeout = setTimeout(() => navigate("/auth/invalid-link"), 1500);
      }
    };

    finalize();
    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="bg-white p-6 rounded shadow text-center">
        <h3 className="font-medium mb-2">Finalizing login...</h3>
        <pre className="text-sm whitespace-pre-wrap">{message}</pre>
      </div>
    </div>
  );
}
