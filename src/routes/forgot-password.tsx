import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/yonnee-logo.png";

export const Route = createFileRoute("/forgot-password")({ component: Forgot });

function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Email envoyé");
  };

  return (
    <MobileFrame>
      <div className="min-h-full px-6 py-8" style={{ background: "var(--gradient-yonnee)" }}>
        <Link to="/login" className="inline-flex items-center gap-2 mb-4" style={{ color: "var(--yonnee-navy)" }}>
          <ArrowLeft className="size-5"/> Retour
        </Link>
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="Yonnee" className="w-28 mb-2"/>
          <h1 className="text-2xl font-black" style={{ color: "var(--yonnee-navy)" }}>Mot de passe oublié</h1>
          <p className="text-sm mt-1" style={{ color: "var(--yonnee-navy)", opacity: 0.7 }}>
            Recevez un lien de réinitialisation par email
          </p>
        </div>
        {sent ? (
          <div className="bg-white rounded-3xl p-6 text-center shadow-xl">
            <Mail className="size-10 mx-auto text-emerald-500 mb-2"/>
            <p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>Email envoyé</p>
            <p className="text-sm text-muted-foreground mt-1">Vérifiez votre boîte de réception (et le spam) pour réinitialiser votre mot de passe.</p>
            <Link to="/login" className="block mt-4 font-bold underline" style={{ color: "var(--yonnee-orange)" }}>Retour à la connexion</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bg-white rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-xl">
              <Mail className="size-4 text-muted-foreground"/>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Votre email" className="flex-1 bg-transparent outline-none text-sm"/>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl text-white font-semibold py-3.5 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: "var(--yonnee-navy)" }}>
              {loading && <Loader2 className="size-4 animate-spin"/>} Envoyer le lien
            </button>
          </form>
        )}
      </div>
    </MobileFrame>
  );
}