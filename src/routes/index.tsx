import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import logo from "@/assets/fret-continental-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const nav = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/dashboard" });
    });
  }, [nav]);
  return (
    <MobileFrame>
      <div
        className="min-h-screen flex flex-col items-center justify-between px-6 py-12 relative overflow-hidden"
        style={{ background: "var(--gradient-yonnee)" }}
      >
        <div className="absolute -top-24 -left-24 size-72 rounded-full opacity-30" style={{ background: "var(--yonnee-orange)" }} />
        <div className="absolute -bottom-24 -right-24 size-80 rounded-full opacity-25" style={{ background: "var(--yonnee-leaf)" }} />
        <div className="absolute top-1/3 -right-10 size-40 rounded-full opacity-20" style={{ background: "var(--yonnee-sun)" }} />

        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 relative z-10">
          <img src={logo} alt="Fret Continental" className="w-64 max-w-full anim-fadeup rounded-2xl bg-white/80 p-2" />
          <p className="text-base font-medium px-4" style={{ color: "var(--yonnee-navy)" }}>
            Envoyez et recevez vos marchandises et colis<br/>en toute simplicité
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-xs">
            {["Clients", "Fournisseurs", "Commerçants", "Fret Standard", "Fret Express", "Fret Cargo"].map((r) => (
              <span key={r} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/80 backdrop-blur" style={{ color: "var(--yonnee-navy)" }}>
                {r}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full space-y-3 relative z-10">
          <Link
            to="/login"
            className="block w-full text-center rounded-2xl text-white font-semibold py-4 shadow-lg active:scale-95 transition"
            style={{ background: "var(--yonnee-navy)" }}
          >
            Se connecter
          </Link>
          <Link
            to="/signup"
            className="block w-full text-center rounded-2xl text-white font-semibold py-4 shadow-lg active:scale-95 transition"
            style={{ background: "var(--yonnee-orange)" }}
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </MobileFrame>
  );
}
