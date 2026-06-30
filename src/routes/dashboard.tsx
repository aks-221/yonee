import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useUserRoles, pickPrimaryRole, ROLE_LABEL, ROLE_COLOR, signOut, type AppRole } from "@/lib/auth";
import { Loader2, LogOut, Search, Bell, Plus, Wallet, Package, Plane, Zap, Store, ShieldCheck, ClipboardList, MapPin, FileText, Truck, PackagePlus, PackageSearch, Boxes } from "lucide-react";
import logo from "@/assets/fret-continental-logo.png";
import { BottomNav } from "@/components/BottomNav";
import { RoleAvatar, RoleBadge } from "@/components/RoleAvatar";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const nav = useNavigate();
  const { session, loading: sl } = useSession();
  const { roles, loading: rl } = useUserRoles();

  useEffect(() => {
    if (!sl && !session) nav({ to: "/login" });
  }, [sl, session, nav]);

  if (sl || rl || !session) {
    return <MobileFrame><div className="min-h-full grid place-items-center" style={{ background: "var(--gradient-yonnee)" }}><Loader2 className="size-8 animate-spin" style={{ color: "var(--yonnee-navy)" }}/></div></MobileFrame>;
  }
  // Never block access after email verification — fall back to "client" if no role row exists yet,
  // and best-effort backfill in the background.
  if (roles.length === 0 && session) {
    supabase.from("user_roles").insert({ user_id: session.user.id, role: "client" } as never).then(() => { /* ignore */ });
  }
  const effectiveRoles: AppRole[] = roles.length === 0 ? ["client"] : roles;
  const primary: AppRole = pickPrimaryRole(effectiveRoles);
  return <RoleDashboard role={primary} extraRoles={effectiveRoles.filter(r => r !== primary)} userId={session.user.id} email={session.user.email ?? ""}/>;
}

function RoleDashboard({ role, extraRoles, userId, email }: { role: AppRole; extraRoles: AppRole[]; userId: string; email: string }) {
  const [profile, setProfile] = useState<{ full_name: string | null; city: string | null; country: string | null } | null>(null);
  const [stats, setStats] = useState({ res: 0, ann: 0, balance: 0 });
  const [verif, setVerif] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("full_name,city,country").eq("id", userId).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("wallets").select("balance").eq("user_id", userId).maybeSingle().then(({ data }) => setStats((s) => ({ ...s, balance: Number(data?.balance ?? 0) })));
    supabase.from("reservations").select("id", { count: "exact", head: true }).or(`client_id.eq.${userId},gp_id.eq.${userId}`).then(({ count }) => setStats((s) => ({ ...s, res: count ?? 0 })));
    if (role === "gp_standard" || role === "gp_express") {
      supabase.from("announcements").select("id", { count: "exact", head: true }).eq("gp_id", userId).then(({ count }) => setStats((s) => ({ ...s, ann: count ?? 0 })));
      supabase.from("gp_verification").select("status").eq("user_id", userId).maybeSingle().then(({ data }) => setVerif(data?.status ?? null));
    }
  }, [userId, role]);

  const meta = ROLE_META[role];
  const roleColor = ROLE_COLOR[role];

  return (
    <MobileFrame>
      <div className="min-h-full pb-24" style={{ background: "var(--background)" }}>
        {/* Header gradient */}
        <div className="px-5 pt-6 pb-8 text-white relative" style={{ background: roleColor.gradient }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Fret Continental" className="w-9 h-9 rounded-xl bg-white p-1 object-contain"/>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-80">{ROLE_LABEL[role]}</p>
                <p className="text-sm font-bold">{profile?.full_name || email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/notifications" className="size-9 grid place-items-center rounded-full bg-white/20 backdrop-blur"><Bell className="size-4"/></Link>
              <button onClick={signOut} className="size-9 grid place-items-center rounded-full bg-white/20 backdrop-blur"><LogOut className="size-4"/></button>
            </div>
          </div>
          {profile?.city && (
            <p className="text-xs mt-2 opacity-80 flex items-center gap-1"><MapPin className="size-3"/> {profile.city}, {profile.country}</p>
          )}
          {extraRoles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {extraRoles.map((r) => <span key={r} className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/20 backdrop-blur">+ {ROLE_LABEL[r]}</span>)}
            </div>
          )}
        </div>

        {/* Verification banner for GP */}
        {(role === "gp_standard" || role === "gp_express") && verif && verif !== "validated" && (
          <div className="mx-5 -mt-4 rounded-2xl p-3 shadow-lg flex items-center gap-3" style={{ background: verif === "rejected" ? "#fef2f2" : "#fffbeb", border: verif === "rejected" ? "1px solid #fecaca" : "1px solid #fde68a" }}>
            <ShieldCheck className={`size-5 ${verif === "rejected" ? "text-red-600" : "text-amber-600"}`}/>
            <div className="flex-1 text-xs">
              <p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>{verif === "rejected" ? "Vérification rejetée" : "Vérification en attente"}</p>
              <p className="text-muted-foreground">{verif === "rejected" ? "Re-soumettez vos documents." : "Compte limité tant que la validation n'est pas terminée."}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="px-5 mt-5 grid grid-cols-3 gap-3">
          <Stat icon={<Package className="size-4"/>} label="Colis" value={stats.res}/>
          {(role === "gp_standard" || role === "gp_express") ? (
            <Stat icon={<Plane className="size-4"/>} label="Annonces" value={stats.ann}/>
          ) : (
            <Stat icon={<ClipboardList className="size-4"/>} label="En cours" value={stats.res}/>
          )}
          <Stat icon={<Wallet className="size-4"/>} label="Solde" value={`${stats.balance.toLocaleString()}`} suffix="XOF"/>
        </div>

        {/* Quick actions per role */}
        <div className="px-5 mt-6">
          <h2 className="font-black text-sm uppercase tracking-wider mb-3" style={{ color: "var(--yonnee-navy)" }}>Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            {meta.actions.map((a) => (
              <Link key={a.label} to={a.to} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition flex flex-col gap-2 border border-border">
                <div className="size-9 grid place-items-center rounded-lg text-white" style={{ background: a.color }}><a.icon className="size-4"/></div>
                <p className="font-bold text-sm" style={{ color: "var(--yonnee-navy)" }}>{a.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{a.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Tips per role */}
        <div className="px-5 mt-6">
          <div className="rounded-2xl p-4 text-white" style={{ background: meta.gradient }}>
            <p className="text-[10px] uppercase tracking-widest opacity-80 font-bold">{meta.tipTitle}</p>
            <p className="text-sm mt-1 leading-snug">{meta.tip}</p>
          </div>
        </div>

        <BottomNav/>
      </div>
    </MobileFrame>
  );
}

function Stat({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string | number; suffix?: string }) {
  return (
    <div className="bg-white rounded-2xl p-3 border border-border">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-[10px] uppercase font-bold">{label}</span></div>
      <p className="text-lg font-black mt-1" style={{ color: "var(--yonnee-navy)" }}>{value}{suffix && <span className="text-[10px] ml-1 text-muted-foreground">{suffix}</span>}</p>
    </div>
  );
}

const ROLE_META: Record<AppRole, { gradient: string; tipTitle: string; tip: string; actions: { label: string; desc: string; to: string; icon: typeof Package; color: string }[] }> = {
  client: {
    gradient: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))",
    tipTitle: "Conseil",
    tip: "Comparez les GP par date de départ et tarif par kg pour économiser.",
    actions: [
      { label: "Chercher un GP", desc: "Trouver un transporteur", to: "/search", icon: Search, color: "var(--yonnee-navy)" },
      { label: "Mes colis", desc: "Suivi en temps réel", to: "/tracking", icon: Package, color: "var(--yonnee-orange)" },
      { label: "Notifications", desc: "Alertes & statuts", to: "/notifications", icon: Bell, color: "var(--yonnee-leaf)" },
      { label: "Portefeuille", desc: "Wave / OM / banque", to: "/wallet", icon: Wallet, color: "var(--yonnee-sun)" },
    ],
  },
  supplier: {
    gradient: "linear-gradient(135deg, var(--yonnee-leaf), #2d8a5e)",
    tipTitle: "Astuce fournisseur",
    tip: "Ajoutez votre compte Wave/OM pour recevoir vos paiements directement.",
    actions: [
      { label: "Expédier stock", desc: "Trouver un GP", to: "/search", icon: Truck, color: "var(--yonnee-leaf)" },
      { label: "Trouver un GP", desc: "Expédier un produit", to: "/search", icon: Search, color: "var(--yonnee-navy)" },
      { label: "Portefeuille", desc: "Solde & retraits", to: "/wallet", icon: Wallet, color: "var(--yonnee-orange)" },
      { label: "Notifications", desc: "Mises à jour", to: "/notifications", icon: Bell, color: "var(--yonnee-sun)" },
    ],
  },
  merchant: {
    gradient: "linear-gradient(135deg, var(--yonnee-sun), var(--yonnee-orange))",
    tipTitle: "Boutique",
    tip: "Gérez vos destinataires fréquents pour des envois ultra rapides.",
    actions: [
      { label: "Nouveau colis", desc: "Réserver un GP", to: "/search", icon: Plus, color: "var(--yonnee-orange)" },
      { label: "Mes envois", desc: "Suivi & historique", to: "/tracking", icon: Package, color: "var(--yonnee-navy)" },
      { label: "Clients", desc: "Suivre commandes", to: "/tracking", icon: Store, color: "var(--yonnee-leaf)" },
      { label: "Portefeuille", desc: "Solde & paiement", to: "/wallet", icon: Wallet, color: "var(--yonnee-sun)" },
    ],
  },
  gp_standard: {
    gradient: "linear-gradient(135deg, var(--yonnee-orange), #d63d1a)",
    tipTitle: "Fret Standard",
    tip: "Fret Standard reste le service économique pour petits colis. Fret Cargo est séparé et réservé aux gros volumes.",
    actions: [
      { label: "Nouvelle expédition", desc: "Réserver un fret", to: "/announcements", icon: Plus, color: "var(--yonnee-orange)" },
      { label: "Enregistrer un Cargo", desc: "Cargo depuis Fret Standard", to: "/cargo", icon: PackagePlus, color: "var(--yonnee-navy)" },
      { label: "Suivi Cargo", desc: "Numéro, QR ou code de suivi", to: "/cargo-tracking", icon: PackageSearch, color: "var(--yonnee-leaf)" },
      { label: "Historique", desc: "Expéditions et réservations", to: "/tracking", icon: ClipboardList, color: "var(--yonnee-sun)" },
    ],
  },
  gp_express: {
    gradient: "linear-gradient(135deg, #d63d1a, var(--yonnee-orange))",
    tipTitle: "Fret Express",
    tip: "Fret Express gère les colis urgents. Fret Cargo reste un service indépendant pour gros volumes.",
    actions: [
      { label: "Nouvelle expédition", desc: "Réserver un fret urgent", to: "/announcements", icon: Zap, color: "var(--yonnee-orange)" },
      { label: "Enregistrer Cargo urgent", desc: "Cargo depuis Fret Express", to: "/cargo", icon: PackagePlus, color: "var(--yonnee-navy)" },
      { label: "Suivi temps réel", desc: "Cargo express en direct", to: "/cargo-tracking", icon: PackageSearch, color: "var(--yonnee-leaf)" },
      { label: "Historique", desc: "Expéditions express", to: "/tracking", icon: ClipboardList, color: "var(--yonnee-sun)" },
    ],
  },
  admin: {
    gradient: "linear-gradient(135deg, #1a1a2e, var(--yonnee-navy))",
    tipTitle: "Administration",
    tip: "Accédez au dashboard admin pour valider les GP, modérer annonces et paiements.",
    actions: [
      { label: "Dashboard admin", desc: "KPIs & vue globale", to: "/admin", icon: ShieldCheck, color: "var(--yonnee-navy)" },
      { label: "Gestion Cargo", desc: "Statuts, documents, transporteurs", to: "/admin/cargo", icon: Boxes, color: "var(--yonnee-orange)" },
      { label: "Transactions", desc: "Paiements", to: "/admin/transactions", icon: Package, color: "var(--yonnee-leaf)" },
      { label: "Annonces", desc: "Modération", to: "/admin/announcements", icon: Plane, color: "var(--yonnee-sun)" },
    ],
  },
};
