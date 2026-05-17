import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Wallet as WalletIcon, Plus, ArrowDownToLine, Smartphone, CreditCard, Loader2, CheckCircle2, Clock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

type Wallet = { balance: number; currency: string };
type Payout = { id: string; amount: number; currency: string; destination: string; destination_account: string; status: string; requested_at: string };
type Topup = { id: string; amount: number; currency: string; source: string; reference: string | null; status: string; created_at: string };
type BankInfo = { bank_name: string | null; bank_iban: string | null; bank_holder: string | null; wave_account: string | null; om_account: string | null };

function WalletPage() {
  const nav = useNavigate();
  const { user, loading: sl } = useSession();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [bank, setBank] = useState<BankInfo>({ bank_name: "", bank_iban: "", bank_holder: "", wave_account: "", om_account: "" });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [showPayout, setShowPayout] = useState(false);
  const [showTopup, setShowTopup] = useState(false);

  useEffect(() => {
    if (sl) return;
    if (!user) { nav({ to: "/login" }); return; }
    refresh();
  }, [user, sl]);

  const refresh = async () => {
    if (!user) return;
    const [w, p, b, t] = await Promise.all([
      supabase.from("wallets").select("balance,currency").eq("user_id", user.id).maybeSingle(),
      supabase.from("payouts").select("*").eq("user_id", user.id).order("requested_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("bank_name,bank_iban,bank_holder,wave_account,om_account").eq("id", user.id).maybeSingle(),
      supabase.from("topups").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setWallet((w.data as Wallet) ?? { balance: 0, currency: "XOF" });
    setPayouts((p.data as Payout[]) ?? []);
    if (b.data) setBank(b.data as BankInfo);
    setTopups((t.data as Topup[]) ?? []);
  };

  const saveBank = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(bank).eq("id", user.id);
    if (error) toast.error(error.message); else toast.success("Coordonnées de paiement enregistrées");
  };

  if (sl || !user || !wallet) {
    return <MobileFrame><div className="min-h-full grid place-items-center"><Loader2 className="size-6 animate-spin"/></div></MobileFrame>;
  }

  return (
    <MobileFrame>
      <div className="min-h-screen pb-28 bg-background">
        <div className="text-white px-5 pt-10 pb-8" style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
          <button onClick={() => nav({ to: "/dashboard" })} className="mb-3"><ArrowLeft className="size-5"/></button>
          <p className="text-[10px] uppercase tracking-widest opacity-80">Portefeuille Yonnee</p>
          <p className="text-4xl font-black mt-1">{Number(wallet.balance).toLocaleString()} <span className="text-base opacity-80">{wallet.currency}</span></p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowTopup(true)} className="flex-1 bg-white text-brand-navy rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-1"><Plus className="size-4"/> Recharger</button>
            <button onClick={() => setShowPayout(true)} className="flex-1 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-1 text-white" style={{ background: "var(--yonnee-orange)" }}><ArrowDownToLine className="size-4"/> Retirer</button>
          </div>
        </div>

        <div className="px-5 mt-5">
          <h2 className="font-black text-sm uppercase tracking-wider mb-2" style={{ color: "var(--yonnee-navy)" }}>Coordonnées de paiement</h2>
          <div className="bg-white rounded-2xl p-4 border border-border space-y-3">
            <div className="text-xs font-bold uppercase text-muted-foreground">Compte bancaire</div>
            <Input label="Nom de la banque" value={bank.bank_name ?? ""} onChange={(v) => setBank({ ...bank, bank_name: v })}/>
            <Input label="IBAN / N° de compte" value={bank.bank_iban ?? ""} onChange={(v) => setBank({ ...bank, bank_iban: v })}/>
            <Input label="Titulaire" value={bank.bank_holder ?? ""} onChange={(v) => setBank({ ...bank, bank_holder: v })}/>
            <div className="text-xs font-bold uppercase text-muted-foreground pt-2">Mobile money</div>
            <Input label="Numéro Wave" value={bank.wave_account ?? ""} onChange={(v) => setBank({ ...bank, wave_account: v })} placeholder="+221 ..."/>
            <Input label="Numéro Orange Money" value={bank.om_account ?? ""} onChange={(v) => setBank({ ...bank, om_account: v })} placeholder="+221 ..."/>
            <button onClick={saveBank} className="w-full rounded-xl text-white font-bold py-3 mt-1" style={{ background: "var(--yonnee-navy)" }}>Enregistrer</button>
          </div>
        </div>

        <div className="px-5 mt-5">
          <h2 className="font-black text-sm uppercase tracking-wider mb-2" style={{ color: "var(--yonnee-navy)" }}>Historique</h2>
          {payouts.length === 0 && topups.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center border border-border text-sm text-muted-foreground">Aucune opération pour l'instant</div>
          )}
          <div className="space-y-2">
            {topups.map((t) => (
              <Op key={t.id} title={`Recharge · ${t.source}`} amount={`+${Number(t.amount).toLocaleString()} ${t.currency}`} status={t.status} date={t.created_at} positive/>
            ))}
            {payouts.map((p) => (
              <Op key={p.id} title={`Retrait · ${p.destination}`} amount={`-${Number(p.amount).toLocaleString()} ${p.currency}`} status={p.status} date={p.requested_at}/>
            ))}
          </div>
        </div>

        {showPayout && <PayoutSheet bank={bank} max={Number(wallet.balance)} onClose={() => setShowPayout(false)} onDone={() => { setShowPayout(false); refresh(); }}/>}
        {showTopup && <TopupSheet onClose={() => setShowTopup(false)} onDone={() => { setShowTopup(false); refresh(); }}/>}

        <BottomNav/>
      </div>
    </MobileFrame>
  );
}

function Op({ title, amount, status, date, positive }: { title: string; amount: string; status: string; date: string; positive?: boolean }) {
  const ok = status === "paid" || status === "completed";
  return (
    <div className="bg-white rounded-2xl p-3 border border-border flex items-center gap-3">
      <div className={`size-9 rounded-xl grid place-items-center ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
        {ok ? <CheckCircle2 className="size-4"/> : <Clock className="size-4"/>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "var(--yonnee-navy)" }}>{title}</p>
        <p className="text-[11px] text-muted-foreground">{new Date(date).toLocaleString("fr-FR")} · {status}</p>
      </div>
      <p className={`font-black text-sm ${positive ? "text-emerald-700" : ""}`} style={!positive ? { color: "var(--yonnee-navy)" } : undefined}>{amount}</p>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase font-bold text-muted-foreground">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none"/>
    </label>
  );
}

function PayoutSheet({ bank, max, onClose, onDone }: { bank: BankInfo; max: number; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(Math.min(10000, max));
  const [dest, setDest] = useState<"wave"|"om"|"bank">("wave");
  const [loading, setLoading] = useState(false);
  const account = dest === "wave" ? bank.wave_account ?? "" : dest === "om" ? bank.om_account ?? "" : bank.bank_iban ?? "";
  const submit = async () => {
    if (!account) { toast.error("Renseignez d'abord vos coordonnées"); return; }
    if (amount > max) { toast.error("Solde insuffisant"); return; }
    setLoading(true);
    const { error } = await supabase.rpc("request_payout", { _amount: amount, _destination: dest, _account: account });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Demande envoyée");
    onDone();
  };
  return (
    <Sheet onClose={onClose} title="Retirer mes gains">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {(["wave","om","bank"] as const).map(o => (
            <button key={o} onClick={() => setDest(o)} className={`p-3 rounded-xl border-2 text-xs font-bold ${dest===o ? "border-[var(--yonnee-orange)] bg-[var(--yonnee-orange)]/5" : "border-border bg-white text-muted-foreground"}`}>
              {o === "wave" ? <Smartphone className="size-4 mx-auto mb-1"/> : o === "om" ? <Smartphone className="size-4 mx-auto mb-1"/> : <CreditCard className="size-4 mx-auto mb-1"/>}
              {o === "wave" ? "Wave" : o === "om" ? "OM" : "Banque"}
            </button>
          ))}
        </div>
        <div className="bg-secondary rounded-xl px-3 py-2 text-xs text-muted-foreground">Compte : {account || "non renseigné"}</div>
        <Input label="Montant" value={String(amount)} onChange={(v) => setAmount(Number(v) || 0)}/>
        <p className="text-[11px] text-muted-foreground">Solde disponible : {max.toLocaleString()} XOF</p>
        <button disabled={loading} onClick={submit} className="w-full rounded-xl py-3 font-bold text-white disabled:opacity-50" style={{ background: "var(--yonnee-orange)" }}>{loading ? "..." : "Demander le retrait"}</button>
      </div>
    </Sheet>
  );
}

function TopupSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(5000);
  const [src, setSrc] = useState<"wave"|"om"|"card">("wave");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    const { error } = await supabase.rpc("wallet_topup_request", { _amount: amount, _source: src, _reference: ref || "" });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Demande de recharge envoyée — un admin va la confirmer");
    onDone();
  };
  return (
    <Sheet onClose={onClose} title="Recharger mon portefeuille">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {(["wave","om","card"] as const).map(o => (
            <button key={o} onClick={() => setSrc(o)} className={`p-3 rounded-xl border-2 text-xs font-bold ${src===o ? "border-[var(--yonnee-navy)] bg-[var(--yonnee-navy)]/5" : "border-border bg-white text-muted-foreground"}`}>
              {o === "card" ? "Carte" : o === "wave" ? "Wave" : "OM"}
            </button>
          ))}
        </div>
        <Input label="Montant (XOF)" value={String(amount)} onChange={(v) => setAmount(Number(v) || 0)}/>
        <Input label="Référence (n° transaction)" value={ref} onChange={setRef} placeholder="Optionnel"/>
        <p className="text-[11px] text-muted-foreground leading-relaxed">Effectuez le transfert sur le compte Yonnee correspondant puis créez la demande. L'équipe créditera votre solde après vérification.</p>
        <button disabled={loading} onClick={submit} className="w-full rounded-xl py-3 font-bold text-white disabled:opacity-50" style={{ background: "var(--yonnee-navy)" }}>{loading ? "..." : "Soumettre la recharge"}</button>
      </div>
    </Sheet>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50"/>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[460px] bg-white rounded-t-3xl pt-3 pb-6 max-h-[88vh] overflow-y-auto">
        <div className="mx-auto h-1.5 w-12 bg-border rounded-full"/>
        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          <h3 className="font-black" style={{ color: "var(--yonnee-navy)" }}>{title}</h3>
          <button onClick={onClose} className="size-8 grid place-items-center rounded-full bg-secondary"><X className="size-4"/></button>
        </div>
        <div className="px-5">{children}</div>
      </div>
    </div>
  );
}