import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { findGP } from "@/lib/gp-data";
import { ArrowLeft, CreditCard, Smartphone, Loader2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { createReservation } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/payment/$gpId")({
  component: Payment,
  validateSearch: z.object({ amount: z.number().default(0) }),
});

function Payment() {
  const { gpId } = Route.useParams();
  const { amount } = Route.useSearch();
  const gp = findGP(gpId);
  const nav = useNavigate();
  const [m, setM] = useState<"card"|"wave"|"om">(gp?.to.country === "Sénégal" ? "wave" : "card");
  const [loading, setLoading] = useState(false);
  if (!gp) return null;

  const opts: {k:"card"|"wave"|"om";icon:React.ReactNode;label:string;sub:string}[] = [
    {k:"card",icon:<CreditCard className="size-5"/>,label:"Carte bancaire",sub:"International"},
    {k:"wave",icon:<Smartphone className="size-5"/>,label:"Wave",sub:"Sénégal"},
    {k:"om",icon:<Smartphone className="size-5"/>,label:"Orange Money",sub:"Sénégal"},
  ];

  const pay = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const draftRaw = sessionStorage.getItem(`gpe.draft.${gpId}`);
    const draft = draftRaw ? JSON.parse(draftRaw) : { weightKg: amount / gp.pricePerKg };
    const r = createReservation({
      gpId: gp.id, gpName: gp.name,
      fromCity: gp.from.city, fromFlag: gp.from.flag,
      toCity: gp.to.city, toFlag: gp.to.flag,
      weightKg: draft.weightKg ?? amount / gp.pricePerKg,
      amount, currency: gp.currency,
      paymentMethod: opts.find((o)=>o.k===m)!.label,
      sender: draft.sender, receiver: draft.receiver,
    });
    toast.success("Paiement confirmé");
    nav({ to: "/confirmation/$reservationId", params: { reservationId: r.id } });
  };

  return (
    <MobileFrame>
      <div className="min-h-full bg-background pb-32">
        <div className="px-5 pt-10 pb-4">
          <button onClick={() => nav({ to: "/booking/$gpId", params: { gpId } })} className="text-brand-navy mb-3"><ArrowLeft className="size-5"/></button>
          <h1 className="text-2xl font-black text-brand-navy">Paiement</h1>
        </div>
        <div className="px-5">
          <div className="bg-gradient-to-br from-brand-navy to-brand-blue rounded-2xl p-5 text-white">
            <p className="text-xs opacity-80">Montant à payer</p>
            <p className="text-4xl font-black mt-1">{amount.toFixed(2)} {gp.currency}</p>
          </div>
          <div className="mt-5 space-y-3">
            {opts.map(o => (
              <button key={o.k} onClick={()=>setM(o.k)} className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 ${m===o.k?"border-brand-blue bg-brand-blue/5":"border-border bg-card"}`}>
                <div className={`size-10 rounded-xl grid place-items-center ${m===o.k?"bg-brand-blue text-white":"bg-secondary text-brand-navy"}`}>{o.icon}</div>
                <div className="flex-1 text-left"><p className="font-semibold text-brand-navy">{o.label}</p><p className="text-xs text-muted-foreground">{o.sub}</p></div>
              </button>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-6">
          <button disabled={loading} onClick={pay} className="w-full rounded-2xl bg-gradient-to-r from-brand-navy to-brand-blue text-white font-semibold py-4 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Traitement…" : `Payer ${amount.toFixed(2)} ${gp.currency}`}
          </button>
        </div>
      </div>
    </MobileFrame>
  );
}
