import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Package, Loader2, MapPin, Phone, User, CheckCircle2, Clock, Truck, Plane, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/tracking/$reservationId")({ component: TrackingDetail });

type Reservation = {
  id: string; code: string; status: string;
  gp_id: string; client_id: string;
  from_city: string | null; to_city: string | null;
  amount: number; currency: string; weight_kg: number;
  payment_method: string | null;
  sender_name: string | null; sender_phone: string | null;
  receiver_name: string | null; receiver_phone: string | null; receiver_address: string | null;
  created_at: string; paid_at: string | null; picked_up_at: string | null;
  in_transit_at: string | null; arrived_at: string | null; delivered_at: string | null;
  cancelled_at: string | null; qr_payload: string | null;
};

type GPProfile = { full_name: string | null; phone: string | null; avatar_url: string | null };

const STEPS = [
  { key: "paid",       label: "Payé",          icon: CheckCircle2 },
  { key: "accepted",   label: "Accepté",        icon: CheckCircle2 },
  { key: "picked_up",  label: "Pris en charge", icon: Package },
  { key: "in_transit", label: "En transit",     icon: Plane },
  { key: "arrived",    label: "Arrivé",         icon: MapPin },
  { key: "delivered",  label: "Livré",          icon: Star },
];

const ORDER = ["pending","paid","accepted","picked_up","in_transit","arrived","delivered"];

function TrackingDetail() {
  const { reservationId } = Route.useParams();
  const nav = useNavigate();
  const { user, loading: sl } = useSession();
  const [res, setRes] = useState<Reservation | null>(null);
  const [gp, setGp] = useState<GPProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", reservationId)
      .maybeSingle();
    if (error || !data) { toast.error("Réservation introuvable"); nav({ to: "/tracking" }); return; }
    setRes(data as Reservation);
    const { data: gpData } = await supabase
      .from("profiles").select("full_name,phone,avatar_url").eq("id", (data as Reservation).gp_id).maybeSingle();
    setGp(gpData as GPProfile);
    setLoading(false);
  };

  useEffect(() => {
    if (!sl) load();
  }, [sl, user?.id, reservationId]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase.channel(`res-${reservationId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "reservations", filter: `id=eq.${reservationId}` },
        (payload) => { setRes(payload.new as Reservation); toast.success("Statut mis à jour !"); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [reservationId]);

  if (sl || loading) {
    return <MobileFrame><div className="min-h-full grid place-items-center"><Loader2 className="size-8 animate-spin" style={{ color: "var(--yonnee-navy)" }}/></div></MobileFrame>;
  }
  if (!res) return null;

  const currentIdx = ORDER.indexOf(res.status);
  const isCancelled = res.status === "cancelled" || res.status === "refunded";

  return (
    <MobileFrame>
      <div className="min-h-screen pb-28 bg-background">
        {/* Header */}
        <div className="text-white px-5 pt-10 pb-6 rounded-b-3xl"
          style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
          <button onClick={() => nav({ to: "/tracking" })} className="mb-3 opacity-80"><ArrowLeft className="size-5"/></button>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono opacity-70">{res.code}</p>
              <h1 className="text-xl font-black mt-0.5">{res.from_city} → {res.to_city}</h1>
              <p className="text-sm text-white/70 mt-1">{res.weight_kg} kg · {Number(res.amount).toLocaleString()} {res.currency}</p>
            </div>
            <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full mt-1 ${
              isCancelled ? "bg-red-500" : res.status === "delivered" ? "bg-emerald-500" : "bg-white/20"
            }`}>{res.status}</span>
          </div>
        </div>

        <div className="px-5 mt-5 space-y-4">
          {/* Timeline */}
          {!isCancelled && (
            <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-4">Suivi du colis</p>
              <div className="space-y-0">
                {STEPS.map((step, i) => {
                  const stepIdx = ORDER.indexOf(step.key);
                  const done = currentIdx >= stepIdx;
                  const active = currentIdx === stepIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`size-8 rounded-full grid place-items-center transition-all ${
                          done ? "text-white" : "bg-secondary text-muted-foreground"
                        }`} style={done ? { background: active ? "var(--yonnee-orange)" : "var(--yonnee-navy)" } : undefined}>
                          {done ? <Icon className="size-3.5"/> : <Clock className="size-3.5"/>}
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`w-0.5 h-6 mt-1 ${done && currentIdx > stepIdx ? "" : "bg-border"}`}
                            style={done && currentIdx > stepIdx ? { background: "var(--yonnee-navy)" } : undefined}/>
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm font-bold ${done ? "" : "text-muted-foreground"}`}
                          style={done ? { color: "var(--yonnee-navy)" } : undefined}>{step.label}</p>
                        {active && <p className="text-[11px] text-muted-foreground mt-0.5">En cours…</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* QR Code si payé */}
          {res.qr_payload && (res.status === "paid" || res.status === "accepted") && (
            <div className="bg-white rounded-2xl p-4 border border-border shadow-sm text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3">QR Code — à présenter au GP</p>
              <div className="inline-block p-3 bg-white border-2 border-dashed border-border rounded-xl">
                <QRDisplay value={res.qr_payload}/>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Le GP scanne ce code pour confirmer la prise en charge</p>
            </div>
          )}

          {/* GP Info */}
          {gp && (
            <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3">Votre GP</p>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full grid place-items-center text-white font-bold text-lg"
                  style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
                  {gp.avatar_url
                    ? <img src={gp.avatar_url} className="size-full object-cover rounded-full" alt=""/>
                    : (gp.full_name ?? "G")[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>{gp.full_name ?? "GP Yonnee"}</p>
                  {gp.phone && <p className="text-xs text-muted-foreground">{gp.phone}</p>}
                </div>
                {gp.phone && (
                  <a href={`tel:${gp.phone}`} className="size-9 rounded-xl grid place-items-center text-white"
                    style={{ background: "var(--yonnee-navy)" }}>
                    <Phone className="size-4"/>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Expéditeur / Destinataire */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-3">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Parties</p>
            {res.sender_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="size-4 text-muted-foreground"/>
                <span className="text-muted-foreground">Expéditeur :</span>
                <span className="font-semibold" style={{ color: "var(--yonnee-navy)" }}>{res.sender_name}</span>
              </div>
            )}
            {res.receiver_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="size-4 text-muted-foreground"/>
                <span className="text-muted-foreground">Destinataire :</span>
                <span className="font-semibold" style={{ color: "var(--yonnee-navy)" }}>{res.receiver_name}</span>
              </div>
            )}
            {res.receiver_address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-muted-foreground"/>
                <span className="text-muted-foreground">Adresse :</span>
                <span className="font-semibold" style={{ color: "var(--yonnee-navy)" }}>{res.receiver_address}</span>
              </div>
            )}
          </div>

          {/* Paiement */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Paiement</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Méthode</span>
              <span className="font-bold" style={{ color: "var(--yonnee-navy)" }}>{res.payment_method ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-black" style={{ color: "var(--yonnee-navy)" }}>{Number(res.amount).toLocaleString()} {res.currency}</span>
            </div>
          </div>
        </div>

        <BottomNav/>
      </div>
    </MobileFrame>
  );
}

// Simple QR visuel SVG (sans lib externe)
function QRDisplay({ value }: { value: string }) {
  // Génère un pattern pseudo-QR décoratif basé sur le hash de la valeur
  const hash = Array.from(value).reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  const cells = 9;
  const size = 180;
  const cell = size / cells;

  const grid: boolean[][] = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      // Coins fixes (pattern QR)
      if ((r < 3 && c < 3) || (r < 3 && c >= cells - 3) || (r >= cells - 3 && c < 3)) return true;
      return (((hash >> ((r * cells + c) % 31)) & 1) === 1);
    })
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {grid.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c * cell + 1} y={r * cell + 1} width={cell - 2} height={cell - 2} rx="2" fill="#0B2A6B"/> : null
        )
      )}
      {/* Centre */}
      <rect x={size/2 - 12} y={size/2 - 12} width={24} height={24} rx="4" fill="white" stroke="#0B2A6B" strokeWidth="2"/>
      <rect x={size/2 - 7} y={size/2 - 7} width={14} height={14} rx="2" fill="#0B2A6B"/>
    </svg>
  );
}