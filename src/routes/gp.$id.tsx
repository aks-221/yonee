import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { findGP } from "@/lib/gp-data";
import { useStore } from "@/lib/store";
import { ArrowLeft, BadgeCheck, Star, Phone, Mail, MapPin, MessageCircle, Plane, Ship, Truck, Lock } from "lucide-react";

export const Route = createFileRoute("/gp/$id")({ component: GPPage });

function GPPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const gp = findGP(id);
  const paid = useStore((s) => s.reservations.some((r) => r.gpId === id && r.status !== "cancelled" && r.status !== "refunded"));
  if (!gp) return <MobileFrame><div className="p-8">GP introuvable</div></MobileFrame>;
  const Ic = gp.transport === "avion" ? Plane : gp.transport === "bateau" ? Ship : Truck;
  return (
    <MobileFrame>
      <div className="min-h-full bg-background pb-32">
        <div className="bg-gradient-to-br from-brand-navy to-brand-blue text-white px-5 pt-10 pb-16">
          <button onClick={() => nav({ to: "/home" })} className="mb-4"><ArrowLeft className="size-5" /></button>
          <p className="text-xs uppercase tracking-wider opacity-70">Profil GP</p>
          <h1 className="text-2xl font-black mt-1">Détails du GP</h1>
        </div>
        <div className="px-5 -mt-10 space-y-4">
          <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-card)] flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-blue text-white font-bold grid place-items-center">{gp.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5"><h2 className="font-bold text-brand-navy">{gp.name}</h2>{gp.verified && <BadgeCheck className="size-4 text-brand-blue" />}</div>
              <p className="text-xs text-muted-foreground capitalize">{gp.type}</p>
              <div className="flex items-center gap-1 mt-1 text-xs"><Star className="size-3 fill-amber-400 text-amber-400" /><span className="font-semibold">{gp.rating}</span><span className="text-muted-foreground">• Vérifié & certifié</span></div>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
            <h3 className="font-bold text-brand-navy mb-3 flex items-center gap-2"><Ic className="size-4 text-brand-blue" /> Itinéraire</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1"><p className="text-2xl">{gp.from.flag}</p><p className="text-sm font-semibold mt-1">{gp.from.city}</p><p className="text-xs text-muted-foreground">{gp.from.country}</p></div>
              <div className="text-brand-blue text-2xl">→</div>
              <div className="flex-1 text-right"><p className="text-2xl">{gp.to.flag}</p><p className="text-sm font-semibold mt-1">{gp.to.city}</p><p className="text-xs text-muted-foreground">{gp.to.country}</p></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-brand-navy to-brand-blue rounded-2xl p-5 text-white">
            <p className="text-xs opacity-80">Tarif au kilogramme</p>
            <p className="text-4xl font-black mt-1">{gp.pricePerKg}<span className="text-base font-normal opacity-80">{gp.currency}/kg</span></p>
            <p className="text-xs opacity-80 mt-1">{gp.duration} • {gp.mode}</p>
          </div>
          <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-card)] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-brand-navy">Contact & adresse</h3>
              {paid ? (
                <span className="text-[10px] font-bold uppercase bg-brand-green/15 text-brand-green-deep px-2 py-1 rounded-full">Débloqué</span>
              ) : (
                <span className="text-[10px] font-bold uppercase bg-brand-yellow/30 text-brand-orange px-2 py-1 rounded-full inline-flex items-center gap-1"><Lock className="size-3"/> Verrouillé</span>
              )}
            </div>
            <div className={paid ? "space-y-3" : "space-y-3 blur-sm select-none pointer-events-none"}>
              <Row icon={<Phone className="size-4" />} text={gp.phone} />
              <Row icon={<MessageCircle className="size-4" />} text={`WhatsApp: ${gp.whatsapp}`} />
              <Row icon={<Mail className="size-4" />} text={gp.email} />
              <Row icon={<MapPin className="size-4" />} text={gp.address} />
            </div>
            {!paid && (
              <p className="text-[11px] text-muted-foreground">
                Pour la sécurité, les coordonnées du GP sont visibles uniquement après le paiement.
              </p>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-6">
          <Link to="/booking/$gpId" params={{ gpId: gp.id }} className="block w-full text-center rounded-2xl bg-gradient-to-r from-brand-navy to-brand-blue text-white font-semibold py-4 shadow-lg active:scale-95 transition">Réserver ce GP</Link>
        </div>
      </div>
    </MobileFrame>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-3 text-sm"><div className="size-8 rounded-lg bg-brand-blue/10 text-brand-blue grid place-items-center">{icon}</div><span>{text}</span></div>;
}