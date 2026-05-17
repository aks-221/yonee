import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/admin/transactions")({ component: AdminTransactions });

type Pay = { id: string; amount: number; currency: string; method: string; status: string; created_at: string };

function AdminTransactions() {
  const [rows, setRows] = useState<Pay[]>([]);
  useEffect(() => { supabase.from("payments").select("id,amount,currency,method,status,created_at").order("created_at", { ascending: false }).then(({ data }) => setRows((data as Pay[]) ?? [])); }, []);
  return <div className="px-5 py-3 space-y-2">{rows.map((p) => <div key={p.id} className="bg-white border border-border rounded-2xl p-4 flex gap-3"><Receipt className="size-5 text-muted-foreground"/><div><p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>{Number(p.amount).toLocaleString()} {p.currency}</p><p className="text-xs text-muted-foreground">{p.method} · {p.status}</p></div></div>)}</div>;
}
