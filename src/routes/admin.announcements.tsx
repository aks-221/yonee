import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/announcements")({ component: AdminAnnouncements });

type Ann = { id: string; from_city: string; to_city: string; gp_mode: string; status: string; active: boolean; departure_date: string };

function AdminAnnouncements() {
  const [rows, setRows] = useState<Ann[]>([]);
  const load = () => supabase.from("announcements").select("id,from_city,to_city,gp_mode,status,active,departure_date").order("created_at", { ascending: false }).then(({ data }) => setRows((data as Ann[]) ?? []));
  useEffect(() => { load(); }, []);
  const setStatus = async (id: string, status: "validated" | "rejected") => { const { error } = await supabase.from("announcements").update({ status } as never).eq("id", id); if (error) toast.error(error.message); else { toast.success("Annonce mise à jour"); load(); } };
  return <div className="px-5 py-3 space-y-2">{rows.map((a) => <div key={a.id} className="bg-white border border-border rounded-2xl p-4"><div className="flex gap-2"><Megaphone className="size-5 text-muted-foreground"/><div><p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>{a.from_city} → {a.to_city}</p><p className="text-xs text-muted-foreground">{a.gp_mode} · {a.status} · {new Date(a.departure_date).toLocaleDateString("fr-FR")}</p></div></div><div className="grid grid-cols-2 gap-2 mt-3"><button onClick={() => setStatus(a.id, "validated")} className="rounded-xl bg-emerald-100 text-emerald-700 py-2 text-xs font-bold">Publier</button><button onClick={() => setStatus(a.id, "rejected")} className="rounded-xl bg-red-100 text-red-700 py-2 text-xs font-bold">Refuser</button></div></div>)}</div>;
}
