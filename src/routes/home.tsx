import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";
import { CountryPicker } from "@/components/CountryPicker";
import { Bell, Plane, Ship, Truck, Zap, Search, ScanLine, Navigation, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/fret-continental-logo.png";
import { useStore, useRequestLocation } from "@/lib/store";
import { ROLE_LABEL, ROLE_COLOR, useUserRoles, pickPrimaryRole, useSession } from "@/lib/auth";

export const Route = createFileRoute("/home")({ component: Home });

function Home() {
  const { session } = useSession(); 
  const email = session?.user?.email ?? "";
  const nav = useNavigate();
  const [from, setFrom] = useState("FR");
  const [to, setTo] = useState("SN");
  const [mode, setMode] = useState<"standard" | "express">("standard");
  useRequestLocation();
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const location = useStore((s) => s.location);
  const profile = useStore((s) => s.profile);
  const { roles } = useUserRoles();
  const role = pickPrimaryRole(roles);
  const isGP = role === "gp_standard" || role === "gp_express";
  const roleColor = ROLE_COLOR[role];
  const swap = () => { const a = from; setFrom(to); setTo(a); };

  return (
    <MobileFrame>
      <div className="min-h-screen pb-28 bg-background">
        <div className="relative text-white px-5 pt-12 pb-10 rounded-b-[32px] overflow-hidden" style={{ background: roleColor.gradient }}>
          <div aria-hidden className="absolute -top-10 -right-10 size-48 rounded-full bg-brand-yellow/30 blur-3xl" />
          <div aria-hidden className="absolute -bottom-10 -left-10 size-48 rounded-full bg-brand-green/30 blur-3xl" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white rounded-xl p-1">
                <img src={logo} alt="" className="size-7 object-contain" />
              </div>
              <div>
                <p className="text-xs text-white/70">Bonjour 👋 {ROLE_LABEL[role]}</p>
                <p className="font-bold">{profile.name?.split(" ")[0] || email?.split("@")[0] || "…"}</p>
              </div>
            </div>
            <button onClick={() => nav({ to: "/notifications" })} className="relative size-10 rounded-full bg-white/15 grid place-items-center">
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold grid place-items-center">{unread}</span>}
            </button>
          </div>

          <div className="mt-6">
            <h2 className="text-2xl font-black tracking-tight">{isGP ? "Espace transporteur" : "Trouvez un GP"}</h2>
            <p className="text-sm text-white/70">{isGP ? "Publiez vos trajets et validez les colis" : "Envoyez vos colis partout dans le monde"}</p>
            <p className="text-[11px] text-white/60 mt-1 inline-flex items-center gap-1">
              <Navigation className="size-3" />
              {location ? "Localisation active — GP triés par proximité" : "Activez la localisation pour les GP proches"}
            </p>
          </div>
        </div>

        {!isGP ? <div className="px-5 -mt-6">
          <div className="bg-card rounded-3xl shadow-[var(--shadow-pop)] p-4 space-y-3 border border-border/40">
            <div className="relative">
              <CountryPicker label="Départ" value={from} onChange={setFrom} />
              <button onClick={swap} aria-label="Inverser" className="absolute right-3 -bottom-4 z-10 size-9 rounded-full bg-gradient-to-br from-brand-orange to-brand-red text-white grid place-items-center shadow-lg active:rotate-180 transition-transform">
                <ArrowRightLeft className="size-4"/>
              </button>
            </div>
            <CountryPicker label="Arrivée" value={to} onChange={setTo} />

            <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl">
              {(["standard", "express"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition ${
                    mode === m
                      ? m === "express"
                        ? "bg-gradient-to-r from-brand-orange to-brand-red text-white shadow"
                        : "bg-white text-brand-navy shadow"
                      : "text-muted-foreground"
                  }`}
                >
                  {m === "express" && <Zap className="size-4" />}
                  {m === "standard" ? "Standard" : "Express"}
                </button>
              ))}
            </div>

            <button
              onClick={() => nav({ to: "/search", search: { from, to, mode } })}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-navy to-brand-blue text-white font-bold py-4 shadow-[var(--shadow-pop)] active:scale-[0.98] transition"
            >
              <Search className="size-4" /> Rechercher un GP
            </button>
          </div>
        </div> : <div className="px-5 -mt-6 grid grid-cols-2 gap-3">
          <Link to="/announcements" className="bg-card rounded-3xl shadow-[var(--shadow-pop)] p-4 border border-border/40">
            <Plane className="size-6 text-brand-orange"/><p className="font-black text-brand-navy mt-2">Publier</p><p className="text-xs text-muted-foreground">Annonce d’itinéraire</p>
          </Link>
          <Link to="/scan" className="bg-card rounded-3xl shadow-[var(--shadow-pop)] p-4 border border-border/40">
            <ScanLine className="size-6 text-brand-blue"/><p className="font-black text-brand-navy mt-2">Scanner</p><p className="text-xs text-muted-foreground">QR de réservation</p>
          </Link>
        </div>}

        <div className="px-5 mt-6">
          <h3 className="font-bold text-brand-navy mb-3">Modes de transport</h3>
          <div className="grid grid-cols-3 gap-3">
            <ModeCard icon={<Plane />} label="Avion" tone="blue" />
            <ModeCard icon={<Ship />} label="Bateau" tone="green" />
            <ModeCard icon={<Truck />} label="Camion" tone="orange" />
          </div>
        </div>

        <div className="px-5 mt-6 grid grid-cols-1 gap-3">
          {!isGP && <Link
            to="/announcements"
            className="relative overflow-hidden block rounded-3xl bg-gradient-to-br from-brand-orange via-brand-red to-brand-red p-5 text-white shadow-[var(--shadow-pop)]"
          >
            <div aria-hidden className="absolute -top-6 -right-6 size-28 rounded-full bg-brand-yellow/40 blur-2xl"/>
            <div className="flex items-center gap-2 text-xs font-bold opacity-90">
              <Zap className="size-4" /> GP EXPRESS
            </div>
            <p className="font-black text-lg mt-1">Besoin d'envoyer vite ?</p>
            <p className="text-xs text-white/90 mt-1">Trouvez un GP express dans votre zone en quelques minutes.</p>
          </Link>}
          {isGP && <Link
            to="/scan"
            className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-[var(--shadow-card)] border border-border/40"
          >
            <div className="size-11 rounded-xl bg-gradient-to-br from-brand-green-deep to-brand-green text-white grid place-items-center"><ScanLine className="size-5"/></div>
            <div className="flex-1">
              <p className="font-bold text-brand-navy text-sm">Espace GP — Scanner un colis</p>
              <p className="text-xs text-muted-foreground">Validez la prise en charge via QR code</p>
            </div>
          </Link>}
        </div>

        <BottomNav />
      </div>
    </MobileFrame>
  );
}

function ModeCard({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: "blue"|"green"|"orange" }) {
  const colors = {
    blue: "from-brand-blue to-brand-blue-light",
    green: "from-brand-green-deep to-brand-green",
    orange: "from-brand-orange to-brand-red",
  } as const;
  return (
    <div className="flex flex-col items-center gap-2 bg-card rounded-2xl p-4 shadow-[var(--shadow-card)] border border-border/40">
      <div className={`size-11 rounded-xl bg-gradient-to-br ${colors[tone]} text-white grid place-items-center shadow-md`}>{icon}</div>
      <span className="text-xs font-bold text-brand-navy">{label}</span>
    </div>
  );
}
