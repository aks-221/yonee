import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { COUNTRIES } from "@/lib/gp-data";
import { useRequestLocation, useStore, haversineKm } from "@/lib/store";
import { ArrowLeft, Plane, Zap, MapPin, Navigation, Filter, Calendar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: z.object({
    from: z.string().default(""),
    to: z.string().default(""),
    mode: z.enum(["standard", "express", "all"]).default("all"),
  }),
});

type Ann = {
  id: string; gp_id: string; from_country_code: string | null; to_country_code: string | null;
  from_city: string; to_city: string; from_flag: string | null; to_flag: string | null;
  from_lat: number | null; from_lng: number | null;
  departure_date: string; arrival_date: string | null; price_per_kg: number; currency: string;
  capacity_kg: number; remaining_kg: number; gp_mode: "standard" | "express"; transport: string; active: boolean;
};

function SearchPage() {
  const { from, to, mode } = Route.useSearch();
  const nav = useNavigate();
  useRequestLocation();
  const location = useStore((s) => s.location);
  const [list, setList] = useState<Ann[]>([]);
  const [filterFrom, setFilterFrom] = useState(from);
  const [filterTo, setFilterTo] = useState(to);
  const [filterMode, setFilterMode] = useState<"all" | "standard" | "express">(mode);

  useEffect(() => {
    let q = supabase.from("announcements").select("*").eq("active", true).gte("departure_date", new Date().toISOString().slice(0, 10));
    if (filterFrom) q = q.eq("from_country_code", filterFrom);
    if (filterTo) q = q.eq("to_country_code", filterTo);
    if (filterMode !== "all") q = q.eq("gp_mode", filterMode);
    q.order("departure_date", { ascending: true }).limit(100).then(({ data }) => setList((data as Ann[]) ?? []));
  }, [filterFrom, filterTo, filterMode]);

  const sorted = useMemo(() => {
    if (!location) return list;
    // departure_date ASC then GPS distance ASC
    return [...list].sort((a, b) => {
      const d = a.departure_date.localeCompare(b.departure_date);
      if (d !== 0) return d;
      const da = a.from_lat && a.from_lng ? haversineKm(location, { lat: a.from_lat, lng: a.from_lng }) : Infinity;
      const db = b.from_lat && b.from_lng ? haversineKm(location, { lat: b.from_lat, lng: b.from_lng }) : Infinity;
      return da - db;
    });
  }, [list, location]);

  return (
    <MobileFrame>
      <div className="min-h-full bg-background pb-12">
        <div className="text-white px-5 pt-8 pb-5" style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
          <button onClick={() => nav({ to: "/home" })} className="mb-2"><ArrowLeft className="size-5"/></button>
          <h1 className="text-xl font-black">Rechercher un GP</h1>
          <p className="text-xs opacity-80 mt-0.5 inline-flex items-center gap-1"><Navigation className="size-3"/> {location ? "Tri par date de départ + proximité GPS" : "Activez la localisation pour trier par proximité"}</p>
        </div>

        <div className="px-5 mt-4 grid grid-cols-3 gap-2">
          <select value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="bg-white border border-border rounded-xl px-2 py-2 text-xs font-semibold">
            <option value="">Pays départ</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
          <select value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="bg-white border border-border rounded-xl px-2 py-2 text-xs font-semibold">
            <option value="">Pays arrivée</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
          <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as any)} className="bg-white border border-border rounded-xl px-2 py-2 text-xs font-semibold">
            <option value="all">Tous modes</option>
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
        </div>

        <div className="px-5 mt-2 text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Filter className="size-3"/> {sorted.length} annonce(s)</div>

        <div className="px-5 mt-2 space-y-2">
          {sorted.map((a) => {
            const dKm = location && a.from_lat && a.from_lng ? haversineKm(location, { lat: a.from_lat, lng: a.from_lng }) : null;
            return (
              <Link key={a.id} to="/booking/$gpId" params={{ gpId: a.gp_id }} className="block bg-white rounded-2xl p-4 border border-border active:scale-[0.99] transition">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>{a.from_flag ?? ""} {a.from_city} → {a.to_flag ?? ""} {a.to_city}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <Calendar className="size-3"/> {new Date(a.departure_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      {dKm != null && <><span>•</span><MapPin className="size-3"/> {dKm < 10 ? dKm.toFixed(1) : Math.round(dKm)} km</>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black" style={{ color: "var(--yonnee-navy)" }}>{a.price_per_kg} <span className="text-[10px]">{a.currency}</span></p>
                    <p className="text-[10px] text-muted-foreground">/ kg</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground inline-flex items-center gap-1"><Plane className="size-3"/> {a.transport} • {a.remaining_kg}/{a.capacity_kg} kg</span>
                  {a.gp_mode === "express" && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "color-mix(in oklab, var(--yonnee-orange) 15%, transparent)", color: "var(--yonnee-orange)" }}><Zap className="size-3"/>Express</span>}
                </div>
              </Link>
            );
          })}
          {sorted.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center border border-border">
              <Plane className="size-10 mx-auto text-muted-foreground"/>
              <p className="font-semibold mt-2" style={{ color: "var(--yonnee-navy)" }}>Aucune annonce</p>
              <p className="text-xs text-muted-foreground mt-1">Essayez d'élargir vos filtres ou revenez plus tard.</p>
            </div>
          )}
        </div>
      </div>
    </MobileFrame>
  );
}
