import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { ArrowLeft, User, Store, Package, Plane, Zap, ChevronRight, Mail, Lock, Phone, MapPin, FileText, CheckCircle2, Loader2, Crosshair } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/fret-continental-logo.png";
import { CountryPicker } from "@/components/CountryPicker";
import { COUNTRIES } from "@/lib/gp-data";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { AppRole } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({ component: Signup });

const ROLES: { id: AppRole; label: string; desc: string; icon: typeof User; color: string }[] = [
  { id: "client",      label: "Client",       desc: "J'envoie ou reçois des colis",               icon: User,    color: "var(--yonnee-navy)" },
  { id: "supplier",    label: "Fournisseur",   desc: "Je vends et expédie des produits",           icon: Package, color: "var(--yonnee-leaf)" },
  { id: "merchant",    label: "Commerçant",    desc: "Boutique avec destinataires fréquents",      icon: Store,   color: "var(--yonnee-sun)" },
  { id: "gp_standard", label: "Fret Standard",  desc: "Livraison économique pour petits colis",     icon: Plane,   color: "var(--yonnee-orange)" },
  { id: "gp_express",  label: "Fret Express",   desc: "Livraison prioritaire pour colis urgents",   icon: Zap,     color: "var(--yonnee-orange)" },
];

const DOC_TYPES = ["Passeport ou CNI", "Visa / titre de séjour", "Justificatif de domicile", "Photo de profil"];

function Signup() {
  const [role, setRole] = useState<AppRole | null>(null);
  if (!role) return <RolePicker onPick={setRole} />;
  return <RoleForm role={role} onBack={() => setRole(null)} />;
}

function RolePicker({ onPick }: { onPick: (r: AppRole) => void }) {
  return (
    <MobileFrame>
      <div className="min-h-full px-6 py-8" style={{ background: "var(--gradient-yonnee)" }}>
        <Link to="/" className="inline-flex items-center gap-2 mb-4" style={{ color: "var(--yonnee-navy)" }}>
          <ArrowLeft className="size-5" /> Retour
        </Link>
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="Fret Continental" className="w-28 mb-2 rounded-2xl bg-white/80 p-1" />
          <h1 className="text-2xl font-black" style={{ color: "var(--yonnee-navy)" }}>Créer mon compte</h1>
          <p className="text-sm mt-1" style={{ color: "var(--yonnee-navy)", opacity: 0.7 }}>Choisissez votre profil</p>
        </div>
        <div className="space-y-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => onPick(r.id)} className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-md hover:shadow-lg active:scale-[0.98] transition text-left">
                <div className="size-12 grid place-items-center rounded-xl text-white shrink-0" style={{ background: r.color }}>
                  <Icon className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black" style={{ color: "var(--yonnee-navy)" }}>{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </button>
            );
          })}
        </div>
        <p className="text-center text-sm mt-6" style={{ color: "var(--yonnee-navy)" }}>
          Déjà inscrit ? <Link to="/login" className="font-bold underline" style={{ color: "var(--yonnee-orange)" }}>Connexion</Link>
        </p>
      </div>
    </MobileFrame>
  );
}

function RoleForm({ role, onBack }: { role: AppRole; onBack: () => void }) {
  const nav = useNavigate();
  const isGP = role === "gp_standard" || role === "gp_express";
  const meta = ROLES.find((r) => r.id === role)!;
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
    country_code: "SN", city: "", address: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [alsoOther, setAlsoOther] = useState(false);
  const [docs, setDocs] = useState<Record<string, File | null>>({});
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const setF = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const useGeo = () => {
    if (!navigator.geolocation) return toast.error("Géolocalisation indisponible");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoLoading(false); toast.success("Position enregistrée"); },
      () => { setGeoLoading(false); toast.error("Impossible d'obtenir votre position"); }
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGP) {
      const missing = DOC_TYPES.filter((d) => !docs[d]);
      if (missing.length) return toast.error("Documents manquants : " + missing.join(", "));
      if (!form.address) return toast.error("Adresse requise pour les GP");
    }
    setLoading(true);

    const country = COUNTRIES.find((c) => c.code === form.country_code);

    // ── 1. Créer le compte auth ──────────────────────────────────────────────
    const { data: signup, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: {
          full_name: form.full_name,
          phone: form.phone,
          country: country?.name,
          country_code: form.country_code,
          city: form.city,
          address: form.address,
          role,
        },
      },
    });

    if (error || !signup.user) {
      setLoading(false);
      toast.error(error?.message || "Erreur lors de la création du compte");
      return;
    }

    const userId = signup.user.id;

    // ── 2. Insérer le rôle dans user_roles ──────────────────────────────────
    // C'est LE fix principal : sans ça le dashboard voit toujours "client"
    const rolesToInsert: AppRole[] = [role];
    if (role === "gp_standard" && alsoOther) rolesToInsert.push("gp_express");
    if (role === "gp_express" && alsoOther) rolesToInsert.push("gp_standard");

    const { error: roleError } = await supabase
      .from("user_roles")
      .insert(rolesToInsert.map((r) => ({ user_id: userId, role: r })));

    if (roleError) {
      console.error("Erreur insertion rôle:", roleError.message);
      // On continue quand même — un trigger Supabase peut gérer ça côté serveur
    }

    // ── 3. Mettre à jour le profil ───────────────────────────────────────────
    await supabase.from("profiles").update({
      full_name: form.full_name,
      phone: form.phone,
      city: form.city,
      country: country?.name ?? null,
      country_code: form.country_code,
      address: form.address,
      ...(coords ? { lat: coords.lat, lng: coords.lng, location_consent: true } : {}),
    }).eq("id", userId);

    // ── 4. Upload documents GP ───────────────────────────────────────────────
    if (isGP) {
      for (const docType of DOC_TYPES) {
        const file = docs[docType];
        if (!file) continue;
        const path = `${userId}/${docType.replace(/[^a-z0-9]/gi, "_")}-${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("gp-documents").upload(path, file);
        if (upErr) continue;
        await supabase.from("gp_documents").insert({ user_id: userId, doc_type: docType, file_path: path });
      }
      // Créer la demande de vérification GP
      await supabase.from("gp_verification").insert({ user_id: userId, status: "pending" });
    }

    setLoading(false);
    toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
    nav({ to: "/dashboard" });
  };

  const onGoogle = async () => {
    sessionStorage.setItem("yonnee_signup_role", role);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Erreur Google");
  };

  return (
    <MobileFrame>
      <div className="min-h-full px-6 py-8" style={{ background: "var(--gradient-yonnee)" }}>
        <button onClick={onBack} className="inline-flex items-center gap-2 mb-4" style={{ color: "var(--yonnee-navy)" }}>
          <ArrowLeft className="size-5" /> Changer de profil
        </button>
        <div className="flex items-center gap-3 mb-5">
          <img src={logo} alt="Fret Continental" className="w-16 rounded-xl bg-white/80 p-1" />
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--yonnee-navy)", opacity: 0.6 }}>Inscription</p>
            <h1 className="text-xl font-black" style={{ color: "var(--yonnee-navy)" }}>{meta.label}</h1>
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-3xl p-5 shadow-xl space-y-3">
          {!isGP && (
            <button onClick={onGoogle} type="button" className="w-full rounded-2xl border-2 border-border py-3 font-semibold flex items-center justify-center gap-3 hover:bg-secondary transition">
              <svg className="size-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              S'inscrire avec Google
            </button>
          )}

          <F icon={<User className="size-4"/>}  placeholder="Nom complet"              required value={form.full_name}    onChange={(e) => setF("full_name", e.target.value)} />
          <F icon={<Mail className="size-4"/>}   placeholder="Email"         type="email" required value={form.email}       onChange={(e) => setF("email", e.target.value)} />
          <F icon={<Phone className="size-4"/>}  placeholder="Téléphone / WhatsApp"    required value={form.phone}        onChange={(e) => setF("phone", e.target.value)} />
          <F icon={<Lock className="size-4"/>}   placeholder="Mot de passe (min. 6 car.)" type="password" required minLength={6} value={form.password} onChange={(e) => setF("password", e.target.value)} />

          <CountryPicker label="Pays" value={form.country_code} onChange={(v) => setF("country_code", v)} />
          <F icon={<MapPin className="size-4"/>} placeholder="Ville"                   required value={form.city}         onChange={(e) => setF("city", e.target.value)} />

          {isGP && (
            <F icon={<MapPin className="size-4"/>} placeholder="Adresse complète"      required value={form.address}      onChange={(e) => setF("address", e.target.value)} />
          )}

          <button type="button" onClick={useGeo} className={`w-full rounded-2xl border-2 py-3 font-semibold flex items-center justify-center gap-2 transition ${coords ? "border-emerald-500 bg-emerald-500/10 text-emerald-700" : "border-dashed border-[color:var(--yonnee-navy)]/30 text-[color:var(--yonnee-navy)] hover:bg-secondary"}`}>
            {geoLoading ? <Loader2 className="size-4 animate-spin"/> : coords ? <CheckCircle2 className="size-4"/> : <Crosshair className="size-4"/>}
            {coords ? "Position enregistrée" : "Activer ma localisation (optionnel)"}
          </button>

          {(role === "gp_standard" || role === "gp_express") && (
            <label className="flex items-center gap-3 p-3 rounded-xl bg-secondary cursor-pointer">
              <input type="checkbox" checked={alsoOther} onChange={(e) => setAlsoOther(e.target.checked)} className="size-4"/>
              <span className="text-xs font-semibold" style={{ color: "var(--yonnee-navy)" }}>
                Je peux faire les deux ({role === "gp_standard" ? "Fret Standard + Fret Express" : "Fret Express + Fret Standard"})
              </span>
            </label>
          )}

          {isGP && (
            <div className="rounded-2xl border-2 border-dashed border-[color:var(--yonnee-orange)]/40 bg-[color:var(--yonnee-orange)]/5 p-4 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--yonnee-navy)" }}>
                <FileText className="size-4"/> Documents de vérification
              </div>
              <p className="text-[11px] text-muted-foreground">Validation sous 24-48h. Compte inactif jusqu'à validation.</p>
              {DOC_TYPES.map((d) => {
                const has = !!docs[d];
                const inputId = `gp-doc-${d.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
                return (
                  <label htmlFor={inputId} key={d} className={`relative block rounded-xl border-2 px-3 py-2.5 text-xs font-semibold cursor-pointer transition overflow-hidden ${has ? "border-emerald-500 bg-emerald-500/5 text-emerald-700" : "border-border bg-card"}`} style={!has ? { color: "var(--yonnee-navy)" } : undefined}>
                    <input
                      id={inputId}
                      type="file"
                      accept="image/*,application/pdf"
                      className="absolute inset-0 size-full opacity-0 cursor-pointer"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setDocs((p) => ({ ...p, [d]: f })); }}
                    />
                    <div className="flex items-center justify-between">
                      <span>{d}</span>
                      {has ? <CheckCircle2 className="size-4 text-emerald-600"/> : <span className="text-muted-foreground">+ Téléverser</span>}
                    </div>
                    {has && <p className="text-[10px] font-normal text-muted-foreground truncate mt-1">{docs[d]!.name}</p>}
                  </label>
                );
              })}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full rounded-2xl text-white font-semibold py-3.5 shadow-lg active:scale-95 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2" style={{ background: "var(--yonnee-navy)" }}>
            {loading && <Loader2 className="size-4 animate-spin"/>}
            {isGP ? "Soumettre pour vérification" : "Créer mon compte"}
          </button>
        </form>
      </div>
    </MobileFrame>
  );
}

function F({ icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-xl border border-transparent focus-within:border-[color:var(--yonnee-orange)]">
      <span className="text-muted-foreground">{icon}</span>
      <input {...props} className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground" />
    </div>
  );
}
