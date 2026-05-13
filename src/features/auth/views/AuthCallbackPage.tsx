import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";

export const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.search).then(() => {
      navigate("/builder", { replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--pk-canvas)]">
      <p className="text-sm text-[var(--pk-text-desc)]">Signing you in…</p>
    </div>
  );
};
