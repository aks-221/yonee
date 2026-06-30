import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plane, ShieldAlert, Package, Wallet, Clock, Megaphone } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

type Kpis = {
  users_count: number; gp_count: number; gp_pending: number;
  reservations_count: number; gmv: number; payments_pending: number; active_announcements: number;
};

function AdminOverview() {
  const [k, setK] = useState<Kpis | null>(null);
  useEffect(() => {
    supabase.from("admin_kpis").select("*").maybeSingle().then(({ data }) => setK(data as Kpis | null));
  }, []);
  return (
    <div className="px-5 pt-2 pb-6">
      <div className="grid grid-cols-2 gap-3">
        <Tile label="Utilisateurs" value={k?.users_count} icon={<Users className="size-4"/>}/>
        <Tile label="Fret inscrits" value={k?.gp_count} icon={<Plane className="size-4"/>}/>
        <Tile label="Fret à valider" value={k?.gp_pending} accent={(k?.gp_pending ?? 0) > 0} icon={<ShieldAlert className="size-4"/>}/>
        <Tile label="Réservations" value={k?.reservations_count} icon={<Package className="size-4"/>}/>
        <Tile label="Annonces actives" value={k?.active_announcements} icon={<Megaphone className="size-4"/>}/>
        <Tile label="Paiements en attente" value={k?.payments_pending} icon={<Clock className="size-4"/>}/>
      </div>
      <div className="mt-3 rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, var(--yonnee-orange), #d63d1a)" }}>
        <div className="flex items-center gap-2 text-[10px] uppercase font-bold opacity-90"><Wallet className="size-4"/> GMV total</div>
        <p className="text-3xl font-black mt-1">{Number(k?.gmv ?? 0).toLocaleString()} <span className="text-sm">XOF</span></p>
      </div>
    </div>
  );
}

function Tile({ label, value, icon, accent }: { label: string; value: number | undefined; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl p-4 border ${accent ? "border-amber-400" : "border-border"}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-[10px] font-bold uppercase">{label}</span></div>
      <p className="text-2xl font-black mt-1" style={{ color: "var(--yonnee-navy)" }}>{value ?? "—"}</p>
    </div>
  );
}
