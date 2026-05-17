import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/yonnee-logo.png";

export const Route = createFileRoute("/reset-password")({ component: Reset });

function Reset() {
  const nav = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase recovery flow puts the access token in the URL hash; getSession picks it up.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 6) return toast.error("Mot de passe trop court (6 car. min)");
    if (pwd !== pwd2) return toast.error("Les mots de passe ne correspondent pas");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    toast.success("Mot de passe mis à jour");
    setTimeout(() => nav({ to: "/dashboard" }), 1200);
  };

  return (
    <MobileFrame>
      <div className="min-h-full px-6 py-8" style={{ background: "var(--gradient-yonnee)" }}>
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="Yonnee" className="w-28 mb-2"/>
          <h1 className="text-2xl font-black" style={{ color: "var(--yonnee-navy)" }}>Nouveau mot de passe</h1>
        </div>
        {done ? (
          <div className="bg-white rounded-3xl p-6 text-center shadow-xl">
            <CheckCircle2 className="size-10 mx-auto text-emerald-500 mb-2"/>
            <p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>Mot de passe mis à jour</p>
          </div>
        ) : !ready ? (
          <div className="bg-white rounded-3xl p-6 text-center shadow-xl">
            <Loader2 className="size-6 animate-spin mx-auto" style={{ color: "var(--yonnee-navy)" }}/>
            <p className="text-sm text-muted-foreground mt-2">Validation du lien…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bg-white rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-xl">
              <Lock className="size-4 text-muted-foreground"/>
              <input value={pwd} onChange={(e) => setPwd(e.target.value)} type="password" required minLength={6} placeholder="Nouveau mot de passe" className="flex-1 bg-transparent outline-none text-sm"/>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-xl">
              <Lock className="size-4 text-muted-foreground"/>
              <input value={pwd2} onChange={(e) => setPwd2(e.target.value)} type="password" required minLength={6} placeholder="Confirmer le mot de passe" className="flex-1 bg-transparent outline-none text-sm"/>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl text-white font-semibold py-3.5 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: "var(--yonnee-navy)" }}>
              {loading && <Loader2 className="size-4 animate-spin"/>} Mettre à jour
            </button>
          </form>
        )}
      </div>
    </MobileFrame>
  );
}