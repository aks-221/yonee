import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useStore } from "@/lib/store";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Package } from "lucide-react";

export const Route = createFileRoute("/confirmation/$reservationId")({ component: Confirmation });

function Confirmation() {
  const { reservationId } = Route.useParams();
  const reservation = useStore((s) => s.reservations.find((r) => r.id === reservationId));
  const nav = useNavigate();
  if (!reservation) {
    return (
      <MobileFrame>
        <div className="p-8 text-center">
          <p>Réservation introuvable.</p>
          <Link to="/home" className="text-brand-blue underline mt-4 block">Accueil</Link>
        </div>
      </MobileFrame>
    );
  }
  return (
    <MobileFrame>
      <div className="min-h-full bg-background pb-28">
        <div className="bg-gradient-to-br from-brand-navy to-brand-blue text-white px-5 pt-10 pb-10 text-center rounded-b-3xl">
          <CheckCircle2 className="size-14 mx-auto" />
          <h1 className="text-2xl font-black mt-2">Réservation confirmée</h1>
          <p className="text-sm text-white/75">Présentez ce QR code à votre GP</p>
        </div>
        <div className="px-5 -mt-6">
          <div className="bg-card rounded-2xl p-6 shadow-[var(--shadow-card)] flex flex-col items-center">
            <div className="bg-white p-3 rounded-xl border-2 border-brand-blue/20">
              <QRCodeSVG value={reservation.id} size={180} />
            </div>
            <p className="mt-4 font-mono font-black text-2xl tracking-widest text-brand-navy">{reservation.id}</p>
            <p className="text-xs text-muted-foreground mt-1">Code de validation</p>
          </div>
          <div className="mt-4 bg-card rounded-2xl p-4 shadow-[var(--shadow-card)] space-y-2 text-sm">
            <Row k="GP" v={reservation.gpName} />
            <Row k="Trajet" v={`${reservation.fromFlag} ${reservation.fromCity} → ${reservation.toFlag} ${reservation.toCity}`} />
            <Row k="Poids" v={`${reservation.weightKg} kg`} />
            <Row k="Total" v={`${reservation.amount.toFixed(2)} ${reservation.currency}`} />
            <Row k="Paiement" v={reservation.paymentMethod} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => nav({ to: "/tracking" })} className="rounded-2xl bg-secondary text-brand-navy font-semibold py-3.5 flex items-center justify-center gap-2"><Package className="size-4"/> Suivre</button>
            <Link to="/home" className="rounded-2xl bg-gradient-to-r from-brand-navy to-brand-blue text-white text-center font-semibold py-3.5">Accueil</Link>
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-semibold text-brand-navy text-right ml-2">{v}</span></div>;
}
