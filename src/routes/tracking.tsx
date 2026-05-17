import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";
import { Package, MapPin, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/tracking")({ component: Tracking });

type Row = {
  id: string; code: string; status: string; gp_id: string; client_id: string;
  from_city: string | null; to_city: string | null; amount: number; currency: string; created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  paid: "bg-blue-100 text-blue-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  picked_up: "bg-amber-100 text-amber-700",
  in_transit: "bg-amber-100 text-amber-700",
  arrived: "bg-violet-100 text-violet-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-orange-100 text-orange-700",
};

function Tracking() {
  const { user } = useSession();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("reservations")
      .select("id,code,status,gp_id,client_id,from_city,to_city,amount,currency,created_at")
      .or(`client_id.eq.${user.id},gp_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, [user]);

  return (
    <MobileFrame>
      <div className="min-h-screen pb-28 bg-background">
        <div className="text-white px-5 pt-10 pb-6 rounded-b-3xl" style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
          <h1 className="text-2xl font-black">Mes colis</h1>
          <p className="text-sm text-white/75">Suivi en temps réel · {rows?.length ?? 0} réservation(s)</p>
        </div>
        <div className="px-5 mt-4 space-y-2">
          {rows && rows.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center border border-border">
              <Package className="size-12 mx-auto text-muted-foreground"/>
              <p className="font-semibold mt-3" style={{ color: "var(--yonnee-navy)" }}>Aucun colis pour l'instant</p>
              <Link to="/search" className="inline-block mt-4 rounded-xl text-white text-sm font-semibold px-4 py-2" style={{ background: "var(--yonnee-navy)" }}>Trouver un GP</Link>
            </div>
          )}
          {rows?.map((r) => (
            <Link key={r.id} to="/tracking/$reservationId" params={{ reservationId: r.id }} className="block bg-white rounded-2xl p-4 border border-border active:scale-[0.99] transition">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-muted-foreground">{r.code}</p>
                  <p className="font-bold truncate" style={{ color: "var(--yonnee-navy)" }}>
                    <MapPin className="size-3 inline mr-1"/>{r.from_city ?? "—"} → {r.to_city ?? "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{Number(r.amount).toLocaleString()} {r.currency} • {new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-full ${STATUS_COLOR[r.status] ?? "bg-gray-100 text-gray-700"}`}>{r.status}</span>
                <ChevronRight className="size-4 text-muted-foreground shrink-0 self-center"/>
              </div>
            </Link>
          ))}
        </div>
        <BottomNav/>
      </div>
    </MobileFrame>
  );
}
