import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.search).then(() => {
      setSuccess(true);
      window.setTimeout(() => navigate("/builder", { replace: true }), 1500);
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--pk-canvas)]">
      {success ? (
        <div className="text-center space-y-2">
          <p className="text-lg font-bold text-[var(--pk-text-primary)]">You're in!</p>
          <p className="text-sm text-[var(--pk-text-desc)]">Taking you to the builder…</p>
        </div>
      ) : (
        <p className="text-sm text-[var(--pk-text-desc)]">Signing you in…</p>
      )}
    </div>
  );
};
