import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";
import {
  BadgeCheck, LogOut, ScanLine, FileText, Bell, Pencil, Camera,
  Save, X, BellRing, Languages, Check, Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useUserRoles, signOut } from "@/lib/auth";
import { enablePushNotifications, useStore } from "@/lib/store";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/profile")({ component: Profile });

type ProfileData = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
};

function Profile() {
  const { user, loading: sl } = useSession();
  const { roles } = useUserRoles();
  const pushEnabled = useStore((s) => s.pushEnabled);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);

  const isGP = roles.includes("gp_standard") || roles.includes("gp_express");

  // Charger le profil réel depuis Supabase
  useEffect(() => {
    if (sl || !user) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("full_name,email,phone,whatsapp,address,city,country,avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const p: ProfileData = {
          full_name: data?.full_name ?? null,
          email: data?.email ?? user.email ?? null,
          phone: data?.phone ?? null,
          whatsapp: data?.whatsapp ?? null,
          address: data?.address ?? null,
          city: data?.city ?? null,
          country: data?.country ?? null,
          avatar_url: data?.avatar_url ?? null,
        };
        setProfile(p);
        setDraft(p);
        setLoading(false);
      });
  }, [user?.id, sl]);

  const initials = (profile?.full_name ?? profile?.email ?? "?")
    .split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const onAvatar = async (file: File) => {
    if (!user) return;
    const path = `avatars/${user.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Erreur upload avatar"); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setDraft((d) => d ? { ...d, avatar_url: urlData.publicUrl } : d);
    toast.success("Photo chargée, sauvegardez pour confirmer");
  };

  const save = async () => {
    if (!user || !draft) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: draft.full_name,
      phone: draft.phone,
      whatsapp: draft.whatsapp,
      address: draft.address,
      city: draft.city,
      country: draft.country,
      avatar_url: draft.avatar_url,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setProfile(draft);
    setEditing(false);
    toast.success("Profil mis à jour ✅");
  };

  const togglePush = async () => {
    const ok = await enablePushNotifications();
    if (ok) toast.success("Notifications push activées");
    else toast.error("Permission refusée");
  };

  if (sl || loading) {
    return (
      <MobileFrame>
        <div className="min-h-full grid place-items-center" style={{ background: "var(--gradient-yonnee)" }}>
          <Loader2 className="size-8 animate-spin" style={{ color: "var(--yonnee-navy)" }}/>
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      <div className="min-h-screen pb-28 bg-background">
        {/* Header */}
        <div className="relative overflow-hidden text-white px-5 pt-12 pb-14 rounded-b-[32px] text-center"
          style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
          <div aria-hidden className="absolute -top-10 -right-10 size-40 rounded-full opacity-30 blur-3xl" style={{ background: "var(--yonnee-sun)" }}/>
          <div className="relative inline-block">
            <div className="size-24 mx-auto rounded-full bg-white/15 grid place-items-center text-2xl font-black border-4 border-white/30 overflow-hidden">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="size-full object-cover"/>
                : initials}
            </div>
            <button onClick={() => { setDraft(profile); setEditing(true); }} aria-label="Éditer"
              className="absolute -bottom-1 -right-1 size-8 rounded-full text-white grid place-items-center shadow-lg"
              style={{ background: "var(--yonnee-orange)" }}>
              <Pencil className="size-3.5"/>
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <h1 className="font-bold text-lg">{profile?.full_name || profile?.email || "Mon profil"}</h1>
            <BadgeCheck className="size-5"/>
          </div>
          <p className="text-xs text-white/70">{profile?.email || user?.email}</p>
          {profile?.city && (
            <p className="text-xs text-white/60 mt-1">{profile.city}{profile.country ? `, ${profile.country}` : ""}</p>
          )}
        </div>

        <div className="px-5 -mt-7 space-y-3">
          {/* Infos */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm grid grid-cols-2 gap-3 text-xs">
            <Field label="Téléphone" value={profile?.phone}/>
            <Field label="WhatsApp" value={profile?.whatsapp}/>
            <Field label="Adresse" value={profile?.address} className="col-span-2"/>
          </div>

          {/* Push notifications */}
          <button onClick={togglePush} className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border border-border shadow-sm">
            <div className={`size-9 rounded-xl grid place-items-center ${pushEnabled ? "bg-emerald-100 text-emerald-700" : "bg-secondary"}`}
              style={!pushEnabled ? { color: "var(--yonnee-navy)" } : undefined}>
              <BellRing className="size-4"/>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm" style={{ color: "var(--yonnee-navy)" }}>Notifications push</p>
              <p className="text-[11px] text-muted-foreground">{pushEnabled ? "Activées sur cet appareil" : "Recevez les statuts en arrière-plan"}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${pushEnabled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {pushEnabled ? "ON" : "OFF"}
            </span>
          </button>

          {/* Liens */}
          <Link to="/notifications" className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-border shadow-sm text-sm font-medium" style={{ color: "var(--yonnee-navy)" }}>
            <Bell className="size-4" style={{ color: "var(--yonnee-sky)" }}/> Mes notifications
          </Link>

          {isGP && (
            <>
              <Link to="/scan" className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-border shadow-sm text-sm font-medium" style={{ color: "var(--yonnee-navy)" }}>
                <ScanLine className="size-4" style={{ color: "var(--yonnee-sky)" }}/> Scanner un colis
              </Link>
              <Link to="/verification" className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-border shadow-sm text-sm font-medium" style={{ color: "var(--yonnee-navy)" }}>
                <FileText className="size-4" style={{ color: "var(--yonnee-sky)" }}/> Mes documents & vérification
              </Link>
            </>
          )}

          <LanguageCard/>

          <button onClick={signOut} className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl bg-secondary text-destructive font-semibold py-3.5">
            <LogOut className="size-4"/> Se déconnecter
          </button>
          <p className="text-center text-xs text-muted-foreground pt-2 pb-2">Yonnee v1.0 • PWA</p>
        </div>

        {/* Modal édition */}
        {editing && draft && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setEditing(false)}>
            <div className="absolute inset-0 bg-black/50"/>
            <div onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[460px] bg-white rounded-t-3xl pt-3 pb-6 max-h-[88vh] overflow-y-auto">
              <div className="mx-auto h-1.5 w-12 bg-border rounded-full"/>
              <div className="px-5 pt-3 pb-2 flex items-center justify-between">
                <h3 className="font-black" style={{ color: "var(--yonnee-navy)" }}>Modifier le profil</h3>
                <button onClick={() => setEditing(false)} className="size-8 grid place-items-center rounded-full bg-secondary"><X className="size-4"/></button>
              </div>
              <div className="px-5 mt-2 space-y-3">
                {/* Avatar */}
                <div className="flex items-center gap-3">
                  <div className="size-16 rounded-2xl bg-secondary overflow-hidden grid place-items-center font-bold" style={{ color: "var(--yonnee-navy)" }}>
                    {draft.avatar_url ? <img src={draft.avatar_url} alt="" className="size-full object-cover"/> : initials}
                  </div>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-sm font-semibold cursor-pointer">
                    <Camera className="size-4"/> Changer la photo
                    <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onAvatar(f); }}/>
                  </label>
                </div>
                <EditInput label="Nom complet" value={draft.full_name ?? ""} onChange={(v) => setDraft({ ...draft, full_name: v })}/>
                <EditInput label="Téléphone" value={draft.phone ?? ""} onChange={(v) => setDraft({ ...draft, phone: v })}/>
                <EditInput label="WhatsApp" value={draft.whatsapp ?? ""} onChange={(v) => setDraft({ ...draft, whatsapp: v })}/>
                <EditInput label="Ville" value={draft.city ?? ""} onChange={(v) => setDraft({ ...draft, city: v })}/>
                <EditInput label="Pays" value={draft.country ?? ""} onChange={(v) => setDraft({ ...draft, country: v })}/>
                <EditInput label="Adresse" value={draft.address ?? ""} onChange={(v) => setDraft({ ...draft, address: v })}/>
                <button onClick={save} disabled={saving}
                  className="w-full rounded-2xl text-white font-bold py-4 flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                  style={{ background: "var(--yonnee-navy)" }}>
                  {saving ? <Loader2 className="size-4 animate-spin"/> : <Save className="size-4"/>}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        <BottomNav/>
      </div>
    </MobileFrame>
  );
}

function Field({ label, value, className = "" }: { label: string; value: string | null | undefined; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
      <p className="font-semibold mt-0.5 truncate" style={{ color: "var(--yonnee-navy)" }}>{value || "—"}</p>
    </div>
  );
}

function EditInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase font-bold text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none"/>
    </label>
  );
}

function LanguageCard() {
  const { locale, setLocale, loading } = useLocale();
  const opts: { code: "fr" | "en"; label: string; flag: string }[] = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];
  return (
    <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Languages className="size-4" style={{ color: "var(--yonnee-sky)" }}/>
        <p className="text-sm font-bold" style={{ color: "var(--yonnee-navy)" }}>Langue / Language</p>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">Détectée automatiquement selon votre pays</p>
      <div className="grid grid-cols-2 gap-2">
        {opts.map((o) => {
          const sel = locale === o.code;
          return (
            <button key={o.code} onClick={() => setLocale(o.code)} disabled={loading}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                sel ? "bg-white" : "border-border bg-secondary text-muted-foreground"
              }`}
              style={sel ? { borderColor: "var(--yonnee-orange)", color: "var(--yonnee-navy)" } : undefined}>
              <span className="text-lg">{o.flag}</span>
              <span className="flex-1 text-left">{o.label}</span>
              {sel && <Check className="size-4" style={{ color: "var(--yonnee-orange)" }}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}