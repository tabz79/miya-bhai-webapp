// client/src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * This component handles the redirect from Supabase after a successful login.
 * It does NOT need to do anything manually with tokens.
 * The supabase-js client automatically handles the session from the URL hash.
 * The global AuthProvider will detect the onAuthStateChange event and update the user state.
 * We just need to wait for the user to be loaded and then redirect.
 */
export default function AuthCallback() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If loading is finished and we have a user, the login was successful.
    if (!loading && user) {
      console.log("[AuthCallback] User found, redirecting to profile.");
      navigate("/profile");
    }

    // If loading is finished and there's still no user, something went wrong.
    if (!loading && !user) {
      console.error("[AuthCallback] AuthProvider finished loading, but no user was found. Redirecting to invalid link page.");
      navigate("/auth/invalid-link");
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold">Finalizing login...</h3>
        <p className="text-sm text-gray-500">Please wait while we securely log you in.</p>
      </div>
    </div>
  );
}