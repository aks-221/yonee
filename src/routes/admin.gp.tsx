import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, FileText, CheckCircle2, XCircle, Clock, ExternalLink, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/gp")({ component: AdminGP });

type Verif = { user_id: string; status: string; notes: string | null; created_at: string };
type Profile = { id: string; full_name: string | null; email: string | null; phone: string | null; country: string | null; city: string | null };
type Doc = { id: string; doc_type: string; file_path: string; status: string; created_at: string };

function AdminGP() {
  const [rows, setRows] = useState<Verif[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [filter, setFilter] = useState<"pending" | "validated" | "rejected" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<string, Doc[]>>({});
  const [signed, setSigned] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const q = supabase.from("gp_verification").select("user_id,status,notes,created_at").order("created_at", { ascending: false });
    const { data } = filter === "all" ? await q : await q.eq("status", filter);
    const list = (data as Verif[]) ?? [];
    setRows(list);
    if (list.length) {
      const ids = list.map((r) => r.user_id);
      const { data: p } = await supabase.from("profiles").select("id,full_name,email,phone,country,city").in("id", ids);
      const map: Record<string, Profile> = {};
      (p as Profile[] | null)?.forEach((x) => { map[x.id] = x; });
      setProfiles(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const toggle = async (uid: string) => {
    if (open === uid) { setOpen(null); return; }
    setOpen(uid);
    if (!docs[uid]) {
      const { data } = await supabase.from("gp_documents").select("id,doc_type,file_path,status,created_at").eq("user_id", uid).order("created_at", { ascending: false });
      setDocs((d) => ({ ...d, [uid]: (data as Doc[]) ?? [] }));
    }
  };

  const view = async (path: string) => {
    if (signed[path]) { window.open(signed[path], "_blank"); return; }
    const { data, error } = await supabase.storage.from("gp-documents").createSignedUrl(path, 300);
    if (error || !data) { toast.error("Document inaccessible"); return; }
    setSigned((s) => ({ ...s, [path]: data.signedUrl }));
    window.open(data.signedUrl, "_blank");
  };

  const review = async (uid: string, status: "validated" | "rejected") => {
    const notes = status === "rejected" ? (prompt("Motif du rejet ?") ?? "") : null;
    const { error } = await supabase.from("gp_verification").update({ status, notes, reviewed_at: new Date().toISOString() } as never).eq("user_id", uid);
    if (error) { toast.error(error.message); return; }
    if (docs[uid]?.length) {
      const ids = docs[uid].map((d) => d.id);
      await supabase.from("gp_documents").update({ status, reviewed_at: new Date().toISOString(), rejection_reason: notes } as never).in("id", ids);
    }
    await supabase.from("notifications").insert({
      user_id: uid,
      type: "verification",
      title: status === "validated" ? "Compte GP validé ✅" : "Documents refusés",
      body: status === "validated" ? "Vous pouvez maintenant publier vos annonces." : (notes || "Re-soumettez vos documents."),
    } as never);
    toast.success(status === "validated" ? "GP validé" : "GP rejeté");
    load();
  };

  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(["pending", "validated", "rejected", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${filter === f ? "text-white" : "bg-white border border-border text-muted-foreground"}`} style={filter === f ? { background: "var(--yonnee-navy)" } : undefined}>{f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "validated" ? "Validés" : "Rejetés"}</button>
        ))}
      </div>

      {loading && <div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground"/></div>}
      {!loading && rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">Aucune demande {filter !== "all" ? filter : ""}.</p>}

      {rows.map((r) => {
        const p = profiles[r.user_id];
        const isOpen = open === r.user_id;
        const Ico = r.status === "validated" ? CheckCircle2 : r.status === "rejected" ? XCircle : Clock;
        const tone = r.status === "validated" ? "text-emerald-700 bg-emerald-100" : r.status === "rejected" ? "text-red-700 bg-red-100" : "text-amber-700 bg-amber-100";
        return (
          <div key={r.user_id} className="bg-white border border-border rounded-2xl overflow-hidden">
            <button onClick={() => toggle(r.user_id)} className="w-full p-4 flex items-center gap-3 text-left">
              <div className="size-10 rounded-full bg-secondary grid place-items-center"><ShieldCheck className="size-5 text-muted-foreground"/></div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate" style={{ color: "var(--yonnee-navy)" }}>{p?.full_name || r.user_id.slice(0, 8)}</p>
                <p className="text-[11px] text-muted-foreground truncate">{p?.email} {p?.city ? `• ${p.city}, ${p.country}` : ""}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full inline-flex items-center gap-1 ${tone}`}><Ico className="size-3"/>{r.status}</span>
              {isOpen ? <ChevronUp className="size-4 text-muted-foreground"/> : <ChevronDown className="size-4 text-muted-foreground"/>}
            </button>
            {isOpen && (
              <div className="border-t border-border p-4 space-y-3 bg-secondary/30">
                {p?.phone && <p className="text-xs"><span className="text-muted-foreground">Téléphone : </span>{p.phone}</p>}
                {r.notes && <p className="text-xs text-red-700">Note : {r.notes}</p>}
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Documents ({docs[r.user_id]?.length ?? 0})</p>
                  {(docs[r.user_id] ?? []).length === 0 && <p className="text-xs text-muted-foreground">Aucun document soumis.</p>}
                  {(docs[r.user_id] ?? []).map((d) => (
                    <button key={d.id} onClick={() => view(d.file_path)} className="w-full bg-white border border-border rounded-xl p-2.5 flex items-center gap-2 text-left hover:bg-secondary">
                      <FileText className="size-4 text-muted-foreground"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{d.doc_type}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                      </div>
                      <ExternalLink className="size-3.5 text-muted-foreground"/>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button onClick={() => review(r.user_id, "validated")} className="rounded-xl bg-emerald-600 text-white py-2.5 text-xs font-bold flex items-center justify-center gap-1"><CheckCircle2 className="size-3.5"/>Valider GP</button>
                  <button onClick={() => review(r.user_id, "rejected")} className="rounded-xl bg-red-600 text-white py-2.5 text-xs font-bold flex items-center justify-center gap-1"><XCircle className="size-3.5"/>Rejeter</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
