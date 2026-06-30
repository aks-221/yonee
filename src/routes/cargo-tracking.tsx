import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";
import { CARGO_STATUS_FLOW, CARGO_STATUS_LABEL, findCargo, type CargoRecord } from "@/lib/cargo";
import { ArrowLeft, CheckCircle2, MapPin, PackageSearch, QrCode, Search } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/cargo-tracking")({
  validateSearch: (search: Record<string, unknown>) => ({ q: (search.q as string) ?? "" }),
  component: CargoTrackingPage,
});

function CargoTrackingPage() {
  const { q } = useSearch({ from: "/cargo-tracking" });
  const [query, setQuery] = useState(q);
  const [cargo, setCargo] = useState<CargoRecord | null>(q ? findCargo(q) : null);

  useEffect(() => {
    setQuery(q);
    setCargo(q ? findCargo(q) : null);
  }, [q]);

  const search = () => setCargo(findCargo(query));

  return (
    <MobileFrame>
      <div className="min-h-screen bg-background pb-28">
        <div className="text-white px-5 pt-8 pb-6 rounded-b-[32px]" style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-white/80 mb-5">
            <ArrowLeft className="size-4"/> Retour
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-80">Traçabilité temps réel</p>
              <h1 className="text-2xl font-black">Suivi Cargo</h1>
              <p className="text-sm text-white/75 mt-1">Numéro cargo, commande, QR code ou code de suivi.</p>
            </div>
            <PackageSearch className="size-9"/>
          </div>
        </div>

        <div className="px-5 mt-4 space-y-4">
          <div className="bg-white border border-border rounded-2xl p-3">
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
              <Search className="size-4 text-muted-foreground"/>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="CRG-..., ORD-..., TRK-..." className="flex-1 bg-transparent outline-none text-sm font-semibold uppercase"/>
              <button type="button" onClick={search} className="rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: "var(--yonnee-navy)" }}>OK</button>
            </div>
          </div>

          {!cargo && (
            <div className="bg-white border border-border rounded-2xl p-8 text-center">
              <QrCode className="size-10 mx-auto text-muted-foreground"/>
              <p className="font-black mt-2" style={{ color: "var(--yonnee-navy)" }}>Aucun cargo sélectionné</p>
              <p className="text-xs text-muted-foreground mt-1">Enregistrez un cargo ou recherchez avec son identifiant.</p>
              <Link to="/cargo" className="inline-flex mt-4 rounded-xl px-4 py-2 text-xs font-bold text-white" style={{ background: "var(--yonnee-orange)" }}>Enregistrer un Cargo</Link>
            </div>
          )}

          {cargo && <CargoDetails cargo={cargo}/>}
        </div>
        <BottomNav/>
      </div>
    </MobileFrame>
  );
}

function CargoDetails({ cargo }: { cargo: CargoRecord }) {
  const lastStatus = cargo.events[cargo.events.length - 1]?.status ?? "registered";
  const activeIndex = CARGO_STATUS_FLOW.indexOf(lastStatus);
  return (
    <div className="space-y-4">
      <div className="bg-white border border-border rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Numéro Cargo</p>
            <h2 className="font-black text-lg" style={{ color: "var(--yonnee-navy)" }}>{cargo.id}</h2>
            <p className="text-xs text-muted-foreground">{cargo.orderNumber} · {cargo.trackingCode}</p>
          </div>
          <span className="rounded-full bg-orange-100 text-orange-700 px-2.5 py-1 text-[10px] font-black uppercase">{cargo.priority}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
          <Info label="Marchandise" value={cargo.goods.nature}/>
          <Info label="Poids" value={cargo.goods.weight}/>
          <Info label="Colis" value={cargo.goods.packages}/>
          <Info label="Transport" value={cargo.transport.mode}/>
          <Info label="Expédition" value={cargo.transport.shippingDate}/>
          <Info label="Arrivée estimée" value={cargo.transport.eta}/>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-4">
        <h3 className="text-xs font-black uppercase text-muted-foreground mb-3">Étapes de suivi</h3>
        <div className="space-y-3">
          {CARGO_STATUS_FLOW.map((status, index) => {
            const event = cargo.events.find((e) => e.status === status);
            const done = index <= activeIndex;
            return (
              <div key={status} className="flex gap-3">
                <div className={`size-8 rounded-full grid place-items-center shrink-0 ${done ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"}`}>
                  <CheckCircle2 className="size-4"/>
                </div>
                <div className="flex-1 pb-3 border-b border-border/60 last:border-0">
                  <p className="font-bold text-sm" style={{ color: done ? "var(--yonnee-navy)" : undefined }}>{CARGO_STATUS_LABEL[status]}</p>
                  {event ? (
                    <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                      <p>{event.date} · {event.time}</p>
                      <p className="inline-flex items-center gap-1"><MapPin className="size-3"/>{event.gps}</p>
                      <p>Agent : {event.agent}</p>
                      {event.comment && <p>{event.comment}</p>}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-1">En attente</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
      <p className="font-semibold" style={{ color: "var(--yonnee-navy)" }}>{value || "-"}</p>
    </div>
  );
}
