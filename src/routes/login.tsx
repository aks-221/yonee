import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { ArrowLeft, Mail, Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/fret-continental-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { pickPrimaryRole, type AppRole } from "@/lib/auth";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }

    // Lire le rôle depuis Supabase pour rediriger vers le bon dashboard
    const userId = data.session?.user.id;
    if (userId) {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      const roles = (rolesData ?? []).map((r: { role: string }) => r.role);
      const primary = pickPrimaryRole(roles as AppRole[]);

      // Redirection selon le rôle
      if (primary === "admin") { nav({ to: "/admin" }); }
      else { nav({ to: "/dashboard" }); }
    } else {
      nav({ to: "/dashboard" });
    }
    setLoading(false);
  };

  const onGoogle = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Erreur connexion Google");
  };

  return (
    <MobileFrame>
      <div className="min-h-full px-6 py-8" style={{ background: "var(--gradient-yonnee)" }}>
        <Link to="/" className="inline-flex items-center gap-2 mb-4" style={{ color: "var(--yonnee-navy)" }}>
          <ArrowLeft className="size-5" /> Retour
        </Link>
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="Fret Continental" className="w-32 mb-2 rounded-2xl bg-white/80 p-1" />
          <h1 className="text-2xl font-black" style={{ color: "var(--yonnee-navy)" }}>Bon retour 👋</h1>
          <p className="text-sm" style={{ color: "var(--yonnee-navy)", opacity: 0.7 }}>Connectez-vous à votre compte Fret Continental</p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-xl space-y-3">
          <button onClick={onGoogle} type="button" className="w-full rounded-2xl border-2 border-border py-3 font-semibold flex items-center justify-center gap-3 hover:bg-secondary transition">
            <svg className="size-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuer avec Google
          </button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="flex-1 h-px bg-border"/>ou<div className="flex-1 h-px bg-border"/></div>
          <form className="space-y-3" onSubmit={onSubmit}>
            <Field icon={<Mail className="size-4" />} placeholder="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field icon={<Lock className="size-4" />} placeholder="Mot de passe" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs font-semibold underline" style={{ color: "var(--yonnee-orange)" }}>
                Mot de passe oublié ?
              </Link>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl text-white font-semibold py-3.5 shadow-lg active:scale-95 transition disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: "var(--yonnee-navy)" }}>
              {loading && <Loader2 className="size-4 animate-spin" />} Se connecter
          </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--yonnee-navy)" }}>
          Pas de compte ?{" "}
          <Link to="/signup" className="font-bold underline" style={{ color: "var(--yonnee-orange)" }}>
            S'inscrire
          </Link>
        </p>
      </div>
    </MobileFrame>
  );
}

function Field({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-xl border border-transparent focus-within:border-[color:var(--yonnee-orange)]">
      <span className="text-muted-foreground">{icon}</span>
      <input
        {...props}
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
      />
    </div>
  );
}
