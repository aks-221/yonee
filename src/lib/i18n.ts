import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./auth";

export type Locale = "fr" | "en";

const DICT: Record<string, { fr: string; en: string }> = {
  "nav.home": { fr: "Accueil", en: "Home" },
  "nav.search": { fr: "Rechercher", en: "Search" },
  "nav.parcels": { fr: "Mes colis", en: "My parcels" },
  "nav.notifs": { fr: "Notifs", en: "Alerts" },
  "nav.wallet": { fr: "Wallet", en: "Wallet" },
  "nav.profile": { fr: "Profil", en: "Profile" },
  "nav.catalog": { fr: "Catalogue", en: "Catalog" },
  "nav.orders": { fr: "Commandes", en: "Orders" },
  "nav.stats": { fr: "Stats", en: "Stats" },
  "nav.stock": { fr: "Stock", en: "Stock" },
  "nav.requests": { fr: "Demandes", en: "Requests" },
  "nav.announces": { fr: "Annonces", en: "Listings" },
  "nav.bookings": { fr: "Réservations", en: "Bookings" },
  "nav.scan": { fr: "Scan", en: "Scan" },
  "nav.live": { fr: "Live", en: "Live" },
  "nav.users": { fr: "Utilisateurs", en: "Users" },
  "nav.gpverif": { fr: "GP à valider", en: "GP review" },
  "nav.tx": { fr: "Transactions", en: "Transactions" },
  "nav.overview": { fr: "Vue d'ensemble", en: "Overview" },
  "auth.forgot": { fr: "Mot de passe oublié ?", en: "Forgot password?" },
  "auth.send_reset": { fr: "Envoyer le lien", en: "Send reset link" },
  "auth.new_password": { fr: "Nouveau mot de passe", en: "New password" },
  "auth.reset_done": { fr: "Mot de passe mis à jour", en: "Password updated" },
  "auth.reset_sent": { fr: "Email de réinitialisation envoyé", en: "Reset email sent" },
  "profile.language": { fr: "Langue", en: "Language" },
  "profile.lang_auto": { fr: "Détectée automatiquement selon votre pays", en: "Auto-detected from your country" },
};

export function t(key: keyof typeof DICT | string, locale: Locale = "fr") {
  const e = DICT[key as string];
  if (!e) return key as string;
  return e[locale] ?? e.fr;
}

const ENGLISH_COUNTRIES = new Set(["US","GB","CA","AU","NZ","IE","NG","GH","KE","ZA"]);
export function detectLocaleFromCountry(code?: string | null): Locale {
  if (!code) return "fr";
  return ENGLISH_COUNTRIES.has(code.toUpperCase()) ? "en" : "fr";
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => Promise<void>; loading: boolean } {
  const { user } = useSession();
  const [locale, setLoc] = useState<Locale>("fr");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("profiles").select("locale").eq("id", user.id).maybeSingle().then(({ data }) => {
      setLoc(((data?.locale as Locale) ?? "fr"));
      setLoading(false);
    });
  }, [user]);
  return {
    locale,
    loading,
    setLocale: async (l) => {
      setLoc(l);
      if (user) await supabase.from("profiles").update({ locale: l }).eq("id", user.id);
    },
  };
}

export function useT() {
  const { locale } = useLocale();
  return (key: string) => t(key, locale);
}