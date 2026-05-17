import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { ArrowLeft, Loader2, Plane, Calendar, Package, User, Phone, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/booking/$gpId")({ component: Booking });

type Ann = {
  id: string;
  gp_id: string;
  from_city: string;
  to_city: string;
  from_flag: string | null;
  to_flag: string | null;
  departure_date: string;
  arrival_date: string | null;
  price_per_kg: number;
  remaining_kg: number;
  capacity_kg: number;
  currency: string;
  gp_mode: "standard" | "express";
  transport: string;
  notes: string | null;
};

type GPProfile = {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

function Booking() {
  const { gpId } = Route.useParams();
  const nav = useNavigate();
  const { user, loading: sl } = useSession();

  const [ann, setAnn] = useState<Ann | null>(null);
  const [gp, setGp] = useState<GPProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [weight, setWeight] = useState(2);
  const [sender, setSender] = useState({ name: "", phone: "", address: "" });
  const [receiver, setReceiver] = useState({ name: "", phone: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState<"wave" | "om" | "card">("wave");

  useEffect(() => {
    if (sl) return;
    if (!user) { nav({ to: "/login" }); return; }

    // gpId peut être soit l'id de l'annonce, soit le gp_id
    // On cherche d'abord par id d'annonce, puis par gp_id
    const loadAnn = async () => {
      setLoading(true);

      // Essai 1 : gpId = id de l'annonce
      let { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", gpId)
        .eq("active", true)
        .maybeSingle();

      // Essai 2 : gpId = user_id du GP → prendre la dernière annonce active
      if (!data) {
        const res = await supabase
          .from("announcements")
          .select("*")
          .eq("gp_id", gpId)
          .eq("active", true)
          .gte("departure_date", new Date().toISOString().slice(0, 10))
          .order("departure_date", { ascending: true })
          .limit(1)
          .maybeSingle();
        data = res.data;
      }

      if (!data) {
        toast.error("Annonce introuvable ou expirée");
        nav({ to: "/search" });
        return;
      }

      setAnn(data as Ann);

      // Charger le profil du GP
      const { data: gpData } = await supabase
        .from("profiles")
        .select("full_name,phone,avatar_url")
        .eq("id", (data as Ann).gp_id)
        .maybeSingle();
      setGp(gpData as GPProfile);

      setLoading(false);
    };

    loadAnn();
  }, [gpId, sl, user?.id]);

  if (sl || loading) {
    return (
      <MobileFrame>
        <div className="min-h-full grid place-items-center" style={{ background: "var(--gradient-yonnee)" }}>
          <Loader2 className="size-8 animate-spin" style={{ color: "var(--yonnee-navy)" }}/>
        </div>
      </MobileFrame>
    );
  }

  if (!ann) return null;

  const total = weight * ann.price_per_kg;
  const maxWeight = ann.remaining_kg;

  const submit = async () => {
    if (!user) { toast.error("Connectez-vous"); return; }
    if (!sender.name || !sender.phone) { toast.error("Infos expéditeur requises"); return; }
    if (!receiver.name || !receiver.phone) { toast.error("Infos destinataire requises"); return; }
    if (weight > maxWeight) { toast.error(`Capacité max : ${maxWeight} kg`); return; }
    if (weight <= 0) { toast.error("Poids invalide"); return; }

    setSubmitting(true);

    const { data, error } = await supabase.rpc("create_reservation_from_announcement", {
      _announcement_id: ann.id,
      _weight_kg: weight,
      _sender_name: sender.name,
      _sender_phone: sender.phone,
      _receiver_name: receiver.name,
      _receiver_phone: receiver.phone,
      _receiver_address: receiver.address,
      _payment_method: paymentMethod,
    });

    setSubmitting(false);

    if (error) {
      console.error("Reservation error:", error);
      toast.error(error.message);
      return;
    }

    toast.success("Réservation créée ! ✅");
    nav({ to: "/tracking/$reservationId", params: { reservationId: data as string } });
  };

  return (
    <MobileFrame>
      <div className="min-h-full bg-background pb-36">

        {/* Header */}
        <div className="text-white px-5 pt-10 pb-6 rounded-b-3xl"
          style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
          <button onClick={() => nav({ to: "/search" })} className="mb-3 opacity-80">
            <ArrowLeft className="size-5"/>
          </button>
          <h1 className="text-2xl font-black">Réserver un colis</h1>
          <p className="text-sm text-white/70 mt-0.5">
            avec {gp?.full_name || "GP Yonnee"}
          </p>
        </div>

        <div className="px-5 mt-4 space-y-4">

          {/* Résumé du trajet */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Trajet</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-lg" style={{ color: "var(--yonnee-navy)" }}>
                  {ann.from_flag} {ann.from_city}
                </p>
                <p className="text-xs text-muted-foreground">Départ</p>
              </div>
              <Plane className="size-5 text-muted-foreground rotate-45"/>
              <div className="text-right">
                <p className="font-black text-lg" style={{ color: "var(--yonnee-navy)" }}>
                  {ann.to_flag} {ann.to_city}
                </p>
                <p className="text-xs text-muted-foreground">Arrivée</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3"/>
                {new Date(ann.departure_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Package className="size-3"/>
                {ann.remaining_kg} kg disponibles
              </span>
              <span>•</span>
              <span className={`font-bold uppercase ${ann.gp_mode === "express" ? "text-orange-600" : "text-emerald-600"}`}>
                {ann.gp_mode}
              </span>
            </div>
            {ann.notes && (
              <p className="mt-2 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">{ann.notes}</p>
            )}
          </div>

          {/* Poids */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3">Poids du colis</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWeight(Math.max(0.5, +(weight - 0.5).toFixed(1)))}
                className="size-11 rounded-xl text-xl font-black border-2 border-border"
                style={{ color: "var(--yonnee-navy)" }}>−</button>
              <div className="flex-1 text-center bg-secondary rounded-xl py-3">
                <span className="font-black text-2xl" style={{ color: "var(--yonnee-navy)" }}>{weight}</span>
                <span className="text-sm text-muted-foreground ml-1">kg</span>
              </div>
              <button
                onClick={() => setWeight(Math.min(maxWeight, +(weight + 0.5).toFixed(1)))}
                className="size-11 rounded-xl text-xl font-black border-2 border-border"
                style={{ color: "var(--yonnee-navy)" }}>+</button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              {ann.price_per_kg.toLocaleString()} {ann.currency}/kg × {weight} kg
            </p>
          </div>

          {/* Expéditeur */}
          <ContactBlock
            title="Expéditeur"
            value={sender}
            onChange={setSender}/>

          {/* Destinataire */}
          <ContactBlock
            title="Destinataire"
            value={receiver}
            onChange={setReceiver}/>

          {/* Mode de paiement */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3">Mode de paiement</p>
            <div className="grid grid-cols-3 gap-2">
              {(["wave", "om", "card"] as const).map((m) => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`py-2.5 rounded-xl text-xs font-bold border-2 transition ${
                    paymentMethod === m ? "text-white border-transparent" : "border-border text-muted-foreground bg-secondary"
                  }`}
                  style={paymentMethod === m ? { background: "var(--yonnee-navy)" } : undefined}>
                  {m === "wave" ? "💙 Wave" : m === "om" ? "🟠 Orange Money" : "💳 Carte"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Barre de total fixe */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[460px] bg-white border-t border-border px-5 py-4 pb-6 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total à payer</span>
            <span className="text-2xl font-black" style={{ color: "var(--yonnee-navy)" }}>
              {total.toLocaleString()} <span className="text-sm">{ann.currency}</span>
            </span>
          </div>
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full rounded-2xl text-white font-bold py-4 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "var(--yonnee-navy)" }}>
            {submitting ? <Loader2 className="size-4 animate-spin"/> : null}
            {submitting ? "Réservation en cours…" : "Confirmer la réservation"}
          </button>
        </div>

      </div>
    </MobileFrame>
  );
}

function ContactBlock({
  title, value, onChange,
}: {
  title: string;
  value: { name: string; phone: string; address: string };
  onChange: (v: { name: string; phone: string; address: string }) => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-2">
      <p className="text-[10px] uppercase font-bold text-muted-foreground">{title}</p>
      <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
        <User className="size-4 text-muted-foreground flex-shrink-0"/>
        <input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Nom complet *"
          className="flex-1 bg-transparent outline-none text-sm"/>
      </div>
      <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
        <Phone className="size-4 text-muted-foreground flex-shrink-0"/>
        <input
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          placeholder="Téléphone *"
          className="flex-1 bg-transparent outline-none text-sm"/>
      </div>
      <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
        <MapPin className="size-4 text-muted-foreground flex-shrink-0"/>
        <input
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="Adresse"
          className="flex-1 bg-transparent outline-none text-sm"/>
      </div>
    </div>
  );
}