import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRound } from "lucide-react";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

type Profile = { id: string; full_name: string | null; email: string | null; phone: string | null; country: string | null; city: string | null; is_banned: boolean };

function AdminUsers() {
  const [rows, setRows] = useState<Profile[]>([]);
  useEffect(() => { supabase.from("profiles").select("id,full_name,email,phone,country,city,is_banned").order("created_at", { ascending: false }).then(({ data }) => setRows((data as Profile[]) ?? [])); }, []);
  return <div className="px-5 py-3 space-y-2">{rows.map((u) => <div key={u.id} className="bg-white border border-border rounded-2xl p-4 flex gap-3"><UserRound className="size-5 text-muted-foreground"/><div className="min-w-0"><p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>{u.full_name || u.email || "Utilisateur"}</p><p className="text-xs text-muted-foreground truncate">{u.phone || "—"} · {u.city || "—"}, {u.country || "—"}</p></div></div>)}</div>;
}
