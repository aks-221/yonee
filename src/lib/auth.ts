import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "client" | "merchant" | "supplier" | "gp_standard" | "gp_express" | "admin";

const ROLE_PRIORITY: AppRole[] = ["client", "supplier", "merchant", "gp_standard", "gp_express", "admin"];
export function pickPrimaryRole(roles: AppRole[]): AppRole {
  if (!roles || roles.length === 0) return "client";
  let best: AppRole = "client";
  let bestIdx = -1;
  for (const r of roles) {
    const i = ROLE_PRIORITY.indexOf(r);
    if (i > bestIdx) { bestIdx = i; best = r; }
  }
  return best;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session first
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    // Then listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []); // ← stable, ne dépend de rien

  return { session, user: session?.user ?? null as User | null, loading };
}

export function useUserRoles() {
  const { user, loading: sessionLoading } = useSession();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attendre que la session soit résolue
    if (sessionLoading) return;

    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (error) {
          console.error("useUserRoles error:", error.message);
          setRoles([]);
        } else {
          setRoles((data ?? []).map((r: { role: AppRole }) => r.role));
        }
        setLoading(false);
      });
  }, [user?.id, sessionLoading]); // ← user?.id (string stable) et pas user (objet)

  return { roles, loading, primary: pickPrimaryRole(roles) };
}

export const ROLE_LABEL: Record<AppRole, string> = {
  client: "Client",
  merchant: "Commerçant",
  supplier: "Fournisseur",
  gp_standard: "Fret Standard",
  gp_express: "Fret Express",
  admin: "Administrateur",
};

export const ROLE_COLOR: Record<AppRole, { solid: string; soft: string; gradient: string; on: string }> = {
  client:      { solid: "#3BA7E8", soft: "#E6F4FD", gradient: "linear-gradient(135deg, #3BA7E8, #1E6FB8)", on: "#ffffff" },
  supplier:    { solid: "#16A34A", soft: "#E7F8EE", gradient: "linear-gradient(135deg, #22C55E, #15803D)", on: "#ffffff" },
  merchant:    { solid: "#E0392B", soft: "#FDECEA", gradient: "linear-gradient(135deg, #F25C4E, #B91C1C)", on: "#ffffff" },
  gp_standard: { solid: "#0B2A6B", soft: "#E5EAF5", gradient: "linear-gradient(135deg, #1E3A8A, #0B1E4F)", on: "#ffffff" },
  gp_express:  { solid: "#7C3AED", soft: "#F1EAFE", gradient: "linear-gradient(135deg, #8B5CF6, #5B21B6)", on: "#ffffff" },
  admin:       { solid: "#0F172A", soft: "#E2E8F0", gradient: "linear-gradient(135deg, #1F2937, #0F172A)", on: "#ffffff" },
};

export async function signOut() {
  localStorage.removeItem("gpe.state.v1");
  await supabase.auth.signOut();
  window.location.href = "/";
}
