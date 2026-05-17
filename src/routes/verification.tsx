import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useUserRoles } from "@/lib/auth";
import { Clock, CheckCircle2, XCircle, FileText, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/verification")({ component: Verif });

type Doc = { id: string; doc_type: string; file_path: string; status: string; created_at: string };
type VerifRow = { status: string; notes: string | null };

function Verif() {
  const { user, loading: sLoading } = useSession();
  const { roles, loading: rLoading } = useUserRoles();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [verif, setVerif] = useState<VerifRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [docType, setDocType] = useState("id_card");

  const isGP = roles.includes("gp_standard") || roles.includes("gp_express");

  const load = async () => {
    if (!user) return;
    const [{ data: d }, { data: v }] = await Promise.all([
      supabase.from("gp_documents").select("id,doc_type,file_path,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("gp_verification").select("status,notes").eq("user_id", user.id).maybeSingle(),
    ]);
    setDocs((d as Doc[]) ?? []);
    setVerif((v as VerifRow) ?? { status: "pending", notes: null });
  };

  useEffect(() => { if (!sLoading && !user) nav({ to: "/login" }); }, [sLoading, user, nav]);
  useEffect(() => { load(); }, [user]);

  if (sLoading || rLoading) return <MobileFrame><div className="min-h-full grid place-items-center"><Loader2 className="size-6 animate-spin"/></div></MobileFrame>;
  if (!isGP) return <MobileFrame><div className="p-6 text-center text-sm text-muted-foreground">Réservé aux comptes GP. <Link to="/profile" className="underline">Profil</Link></div></MobileFrame>;

  const upload = async (f: File) => {
    if (!user) return;
    setBusy(true);
    try {
      const ext = f.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${docType}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("gp-documents").upload(path, f, { upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("gp_documents").insert({ user_id: user.id, doc_type: docType, file_path: path } as never);
      if (insErr) throw insErr;
      // Ensure verification row exists & reset to pending
      await supabase.from("gp_verification").upsert({ user_id: user.id, status: "pending" } as never, { onConflict: "user_id" });
      toast.success("Document envoyé — en attente de validation");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const status = verif?.status ?? "pending";
  const tone =
    status === "validated" ? { bg: "bg-emerald-100", fg: "text-emerald-700", Icon: CheckCircle2, title: "Compte GP validé", sub: "Vous pouvez publier des annonces." } :
    status === "rejected" ? { bg: "bg-red-100", fg: "text-red-700", Icon: XCircle, title: "Documents refusés", sub: verif?.notes ?? "Re-soumettez vos documents." } :
    { bg: "bg-amber-100", fg: "text-amber-700", Icon: Clock, title: "Vérification en cours", sub: "Validation sous 24-48h." };
  const Ic = tone.Icon;

  return (
    <MobileFrame>
      <div className="min-h-full bg-background pb-12">
        <div className="text-white px-5 pt-8 pb-6" style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
          <p className="text-[10px] uppercase tracking-widest opacity-80">Vérification GP</p>
          <h1 className="text-2xl font-black">Mes documents</h1>
        </div>

        <div className="px-5 mt-4">
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${tone.bg} ${tone.fg}`}>
            <Ic className="size-6"/>
            <div><p className="font-black">{tone.title}</p><p className="text-xs opacity-80">{tone.sub}</p></div>
          </div>
        </div>

        <div className="px-5 mt-4 bg-white border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Ajouter un document</p>
          <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2 text-sm">
            <option value="id_card">Pièce d'identité</option>
            <option value="passport">Passeport</option>
            <option value="proof_address">Justificatif domicile</option>
            <option value="ticket">Billet de transport</option>
            <option value="other">Autre</option>
          </select>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}/>
          <button disabled={busy} onClick={() => fileRef.current?.click()} className="w-full rounded-xl py-3 text-white font-bold flex items-center justify-center gap-2" style={{ background: "var(--yonnee-orange)" }}>
            {busy ? <Loader2 className="size-4 animate-spin"/> : <Upload className="size-4"/>}
            Téléverser
          </button>
        </div>

        <div className="px-5 mt-4 space-y-2">
          <p className="text-xs font-bold uppercase text-muted-foreground">Documents envoyés ({docs.length})</p>
          {docs.length === 0 && <p className="text-sm text-muted-foreground">Aucun document.</p>}
          {docs.map((d) => (
            <div key={d.id} className="bg-white border border-border rounded-2xl p-3 flex items-center gap-3">
              <div className="size-9 rounded-lg bg-secondary grid place-items-center"><FileText className="size-4"/></div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: "var(--yonnee-navy)" }}>{d.doc_type}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${d.status === "validated" ? "bg-emerald-100 text-emerald-700" : d.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{d.status}</span>
            </div>
          ))}
        </div>
      </div>
    </MobileFrame>
  );
}
