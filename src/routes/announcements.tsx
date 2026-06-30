import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";
import { Zap, Plus, X, Trash2, Calendar, Plane, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useUserRoles } from "@/lib/auth";
import { CountryPicker } from "@/components/CountryPicker";
import { COUNTRIES } from "@/lib/gp-data";
import { toast } from "sonner";

export const Route = createFileRoute("/announcements")({ component: Announcements });

type Ann = {
  id: string;
  gp_id: string;
  from_city: string;
  to_city: string;
  from_flag: string | null;
  to_flag: string | null;
  from_country_code: string | null;
  to_country_code: string | null;
  departure_date: string;
  arrival_date: string | null;
  price_per_kg: number;
  capacity_kg: number;
  remaining_kg: number;
  currency: string;
  gp_mode: "standard" | "express";
  transport: string;
  active: boolean;
  notes: string | null;
};

function Announcements() {
  const { user, loading: sl } = useSession();
  const { roles } = useUserRoles();
  const isGP = roles.includes("gp_standard") || roles.includes("gp_express");
  const isGPExpress = roles.includes("gp_express");

  const [myAnn, setMyAnn] = useState<Ann[]>([]);
  const [allAnn, setAllAnn] = useState<Ann[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const openCreateSheet = () => {
    if (!user) {
      toast.error("Connectez-vous pour publier une annonce");
      return;
    }
    setCreating(true);
  };

  const load = async () => {
    setLoading(true);
    // Toutes les annonces actives
    const { data: all } = await supabase
      .from("announcements")
      .select("*")
      .eq("active", true)
      .gte("departure_date", new Date().toISOString().slice(0, 10))
      .order("departure_date", { ascending: true })
      .limit(50);
    setAllAnn((all as Ann[]) ?? []);

    // Mes annonces si GP
    if (user && isGP) {
      const { data: mine } = await supabase
        .from("announcements")
        .select("*")
        .eq("gp_id", user.id)
        .order("created_at", { ascending: false });
      setMyAnn((mine as Ann[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!sl) load();
  }, [sl, user?.id, isGP]);

  const deleteAnn = async (id: string) => {
    const { error } = await supabase.from("announcements").update({ active: false }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Annonce supprimée");
    load();
  };

  return (
    <MobileFrame>
      <div className="min-h-screen pb-28 bg-background">
        {/* Header */}
        <div className="relative overflow-hidden text-white px-5 pt-12 pb-7 rounded-b-[32px]"
          style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
          <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full opacity-30 blur-3xl" style={{ background: "var(--yonnee-orange)" }}/>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black">Annonces GP</h1>
              <p className="text-sm text-white/75">Tous les départs disponibles</p>
            </div>
            <div className="relative z-10 flex gap-2">
              <button type="button" onClick={load} className="size-10 rounded-full bg-white/20 grid place-items-center">
                <RefreshCw className="size-4"/>
              </button>
              {isGP && (
                <button type="button" onClick={openCreateSheet} aria-label="Ajouter une annonce" className="size-10 rounded-full bg-white grid place-items-center shadow" style={{ color: "var(--yonnee-navy)" }}>
                  <Plus className="size-5"/>
                </button>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center mt-8">
            <Loader2 className="size-6 animate-spin" style={{ color: "var(--yonnee-navy)" }}/>
          </div>
        )}

        {/* Mes annonces (GP seulement) */}
        {!loading && isGP && myAnn.length > 0 && (
          <div className="px-5 mt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Mes annonces</h3>
              <button type="button" onClick={openCreateSheet} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm border border-border active:scale-[0.98] transition" style={{ color: "var(--yonnee-navy)" }}>
                <Plus className="size-3.5"/>
                Nouvelle
              </button>
            </div>
            <div className="space-y-2">
              {myAnn.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl p-3 border border-border flex gap-3">
                  <div className="size-16 rounded-xl text-white grid place-items-center font-bold text-xs"
                    style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
                    {a.gp_mode === "express" ? "⚡ EXP" : "✈ STD"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: "var(--yonnee-navy)" }}>
                      {a.from_flag ?? ""} {a.from_city} → {a.to_flag ?? ""} {a.to_city}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Départ {new Date(a.departure_date).toLocaleDateString("fr-FR")} • {a.remaining_kg}/{a.capacity_kg} kg dispo
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        a.gp_mode === "express"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>{a.gp_mode}</span>
                      <span className="font-black text-sm" style={{ color: "var(--yonnee-navy)" }}>
                        {a.price_per_kg} {a.currency}/kg
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteAnn(a.id)} className="size-8 rounded-lg grid place-items-center self-start bg-red-50 text-red-600">
                    <Trash2 className="size-4"/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && isGP && myAnn.length === 0 && (
          <div className="px-5 mt-4">
            <button type="button" onClick={openCreateSheet} className="w-full rounded-2xl p-4 border-2 border-dashed bg-white text-left flex items-center gap-3 active:scale-[0.99] transition" style={{ borderColor: "color-mix(in oklab, var(--yonnee-orange) 35%, transparent)" }}>
              <span className="size-11 rounded-xl grid place-items-center text-white shrink-0" style={{ background: "var(--yonnee-orange)" }}>
                <Plus className="size-5"/>
              </span>
              <span>
                <span className="block font-black" style={{ color: "var(--yonnee-navy)" }}>Ajouter une annonce</span>
                <span className="block text-xs text-muted-foreground mt-0.5">Publiez un trajet standard ou express.</span>
              </span>
            </button>
          </div>
        )}

        {/* Toutes les annonces */}
        {!loading && (
          <div className="px-5 mt-4">
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">
              Annonces disponibles ({allAnn.length})
            </h3>
            <div className="space-y-3">
              {allAnn.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-border">
                  <Plane className="size-10 mx-auto text-muted-foreground"/>
                  <p className="font-semibold mt-2" style={{ color: "var(--yonnee-navy)" }}>Aucune annonce disponible</p>
                  <p className="text-xs text-muted-foreground mt-1">Revenez plus tard ou publiez la vôtre.</p>
                </div>
              )}
              {allAnn.map((a) => (
                <Link key={a.id} to="/booking/$gpId" params={{ gpId: a.gp_id }}
                  className="block bg-white rounded-2xl p-4 border border-border active:scale-[0.99] transition">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>
                        {a.from_flag ?? ""} {a.from_city} → {a.to_flag ?? ""} {a.to_city}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Départ {new Date(a.departure_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        {a.arrival_date && ` → ${new Date(a.arrival_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black" style={{ color: "var(--yonnee-navy)" }}>
                        {a.price_per_kg} <span className="text-[10px]">{a.currency}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">/ kg</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground inline-flex items-center gap-1">
                      <Plane className="size-3"/> {a.transport} • {a.remaining_kg}/{a.capacity_kg} kg restants
                    </span>
                    {a.gp_mode === "express" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        <Zap className="size-3"/>Express
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {creating && <CreateSheet onClose={() => setCreating(false)} onDone={() => { setCreating(false); load(); }} userId={user?.id ?? ""} isGPExpress={isGPExpress}/>}
        <BottomNav/>
      </div>
    </MobileFrame>
  );
}

function CreateSheet({ onClose, onDone, userId, isGPExpress }: {
  onClose: () => void; onDone: () => void; userId: string; isGPExpress: boolean;
}) {
  const [from, setFrom] = useState("FR");
  const [to, setTo] = useState("SN");
  const [date, setDate] = useState(new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10));
  const [arrivalDate, setArrivalDate] = useState("");
  const [price, setPrice] = useState(8);
  const [capacity, setCapacity] = useState(20);
  const [mode, setMode] = useState<"standard" | "express">(isGPExpress ? "express" : "standard");
  const [transport, setTransport] = useState<"air" | "sea" | "road">("air");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!userId) { toast.error("Vous devez être connecté"); return; }
    const fc = COUNTRIES.find((c) => c.code === from);
    const tc = COUNTRIES.find((c) => c.code === to);
    if (!fc || !tc) { toast.error("Pays invalide"); return; }

    setLoading(true);
    const { error } = await supabase.from("announcements").insert({
      gp_id: userId,
      from_city: fc.name,
      from_country: fc.name,
      from_country_code: fc.code,
      from_flag: fc.flag,
      to_city: tc.name,
      to_country: tc.name,
      to_country_code: tc.code,
      to_flag: tc.flag,
      departure_date: date,
      arrival_date: arrivalDate || null,
      price_per_kg: price,
      capacity_kg: capacity,
      remaining_kg: capacity,
      currency: "XOF",
      gp_mode: mode,
      transport,
      notes: notes || null,
      active: true,
      photo_urls: [],
    });
    setLoading(false);

    if (error) { toast.error(error.message); return; }
    toast.success("Annonce publiée 🎉");
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50"/>
      <div onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[460px] bg-white rounded-t-3xl pt-3 pb-6 max-h-[90vh] overflow-y-auto">
        <div className="mx-auto h-1.5 w-12 bg-border rounded-full"/>
        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          <h3 className="font-black" style={{ color: "var(--yonnee-navy)" }}>Nouvelle annonce</h3>
          <button onClick={onClose} className="size-8 grid place-items-center rounded-full bg-secondary"><X className="size-4"/></button>
        </div>
        <div className="px-5 space-y-3 mt-2">
          <CountryPicker label="Pays de départ" value={from} onChange={setFrom}/>
          <CountryPicker label="Pays d'arrivée" value={to} onChange={setTo}/>

          <label className="flex items-center gap-3 px-3 py-3 bg-secondary rounded-2xl">
            <Calendar className="size-4" style={{ color: "var(--yonnee-sky)" }}/>
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Date de départ</p>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="bg-transparent outline-none w-full font-semibold text-sm" style={{ color: "var(--yonnee-navy)" }}/>
            </div>
          </label>

          <label className="flex items-center gap-3 px-3 py-3 bg-secondary rounded-2xl">
            <Calendar className="size-4 text-muted-foreground"/>
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Date d'arrivée (optionnel)</p>
              <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)}
                className="bg-transparent outline-none w-full font-semibold text-sm" style={{ color: "var(--yonnee-navy)" }}/>
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Prix / kg (XOF)</span>
              <input type="number" min={1} value={price} onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-1 w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none"/>
            </label>
            <label className="block">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Capacité (kg)</span>
              <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))}
                className="mt-1 w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none"/>
            </label>
          </div>

          {/* Transport */}
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Mode de transport</p>
            <div className="grid grid-cols-3 gap-2">
              {(["air", "sea", "road"] as const).map((t) => (
                <button key={t} onClick={() => setTransport(t)}
                  className={`py-2 rounded-xl text-xs font-bold border-2 transition ${
                    transport === t ? "text-white" : "border-border bg-secondary text-muted-foreground"
                  }`}
                  style={transport === t ? { background: "var(--yonnee-navy)", borderColor: "var(--yonnee-navy)" } : undefined}>
                  {t === "air" ? "✈ Avion" : t === "sea" ? "🚢 Bateau" : "🚛 Camion"}
                </button>
              ))}
            </div>
          </div>

          {/* Mode GP */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl">
            {(["standard", "express"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`py-2 rounded-lg text-sm font-semibold transition ${
                  mode === m
                    ? m === "express" ? "text-white" : "bg-white shadow"
                    : "text-muted-foreground"
                }`}
                style={mode === m && m === "express" ? { background: "var(--yonnee-orange)" } : mode === m ? { color: "var(--yonnee-navy)" } : undefined}>
                {m === "express" ? "⚡ Express" : "Standard"}
              </button>
            ))}
          </div>

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (type de colis acceptés, conditions…)"
            rows={3} className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none resize-none"/>

          <button onClick={submit} disabled={loading}
            className="w-full rounded-2xl text-white font-bold py-4 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "var(--yonnee-navy)" }}>
            {loading ? <Loader2 className="size-4 animate-spin"/> : <Plus className="size-4"/>}
            Publier l'annonce
          </button>
        </div>
      </div>
    </div>
  );
}
