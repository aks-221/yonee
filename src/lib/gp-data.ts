export type GP = {
  id: string;
  name: string;
  type: "particulier" | "entreprise" | "transporteur";
  avatar: string;
  verified: boolean;
  rating: number;
  from: { country: string; flag: string; city: string; lat: number; lng: number };
  to: { country: string; flag: string; city: string; lat: number; lng: number };
  departureDate: string;
  arrivalDate: string;
  duration: string;
  pricePerKg: number;
  currency: string;
  capacityKg: number;
  mode: "standard" | "express";
  transport: "avion" | "bateau" | "camion";
  // baseLoc = where the GP is currently (used for proximity sort)
  baseLoc: { lat: number; lng: number };
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
};

export const COUNTRIES = [
  { code: "SN", name: "Sénégal", flag: "🇸🇳" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "US", name: "États-Unis", flag: "🇺🇸" },
  { code: "IT", name: "Italie", flag: "🇮🇹" },
  { code: "ES", name: "Espagne", flag: "🇪🇸" },
  { code: "MA", name: "Maroc", flag: "🇲🇦" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "BE", name: "Belgique", flag: "🇧🇪" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧" },
  { code: "AE", name: "Émirats arabes unis", flag: "🇦🇪" },
  { code: "JP", name: "Japon", flag: "🇯🇵" },
  { code: "CN", name: "Chine", flag: "🇨🇳" },
  { code: "IN", name: "Inde", flag: "🇮🇳" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "TR", name: "Turquie", flag: "🇹🇷" },
];

const PARIS = { lat: 48.8566, lng: 2.3522 };
const MARSEILLE = { lat: 43.2965, lng: 5.3698 };
const LE_HAVRE = { lat: 49.4944, lng: 0.1079 };
const DAKAR = { lat: 14.7167, lng: -17.4677 };
const THIES = { lat: 14.7886, lng: -16.9246 };

export const GP_LIST: GP[] = [
  {
    id: "gp-001",
    name: "Aïssatou Diop", type: "particulier", avatar: "AD",
    verified: true, rating: 4.9,
    from: { country: "France", flag: "🇫🇷", city: "Paris", ...PARIS },
    to:   { country: "Sénégal", flag: "🇸🇳", city: "Dakar", ...DAKAR },
    departureDate: "2026-05-20", arrivalDate: "2026-05-20", duration: "6h vol",
    pricePerKg: 8, currency: "€", capacityKg: 25,
    mode: "standard", transport: "avion",
    baseLoc: PARIS,
    phone: "+221 77 123 45 67", whatsapp: "+221 77 123 45 67",
    email: "aissatou@example.com", address: "Plateau, Dakar, Sénégal",
  },
  {
    id: "gp-002",
    name: "GP Express SARL", type: "entreprise", avatar: "GE",
    verified: true, rating: 4.8,
    from: { country: "France", flag: "🇫🇷", city: "Marseille", ...MARSEILLE },
    to:   { country: "Sénégal", flag: "🇸🇳", city: "Dakar", ...DAKAR },
    departureDate: "2026-05-18", arrivalDate: "2026-05-19", duration: "24h express",
    pricePerKg: 15, currency: "€", capacityKg: 200,
    mode: "express", transport: "avion",
    baseLoc: MARSEILLE,
    phone: "+33 6 12 34 56 78", whatsapp: "+33 6 12 34 56 78",
    email: "contact@gpexpress.fr", address: "12 rue de la Liberté, Marseille",
  },
  {
    id: "gp-003",
    name: "Moussa Sarr", type: "particulier", avatar: "MS",
    verified: true, rating: 4.7,
    from: { country: "France", flag: "🇫🇷", city: "Paris", ...PARIS },
    to:   { country: "Sénégal", flag: "🇸🇳", city: "Thiès", ...THIES },
    departureDate: "2026-05-25", arrivalDate: "2026-05-25", duration: "7h",
    pricePerKg: 7, currency: "€", capacityKg: 15,
    mode: "standard", transport: "avion",
    baseLoc: { lat: 48.8744, lng: 2.3526 },
    phone: "+221 78 555 11 22", whatsapp: "+221 78 555 11 22",
    email: "moussa@example.com", address: "Mermoz, Dakar",
  },
  {
    id: "gp-004",
    name: "Cargo Atlantique", type: "transporteur", avatar: "CA",
    verified: true, rating: 4.6,
    from: { country: "France", flag: "🇫🇷", city: "Le Havre", ...LE_HAVRE },
    to:   { country: "Sénégal", flag: "🇸🇳", city: "Dakar", ...DAKAR },
    departureDate: "2026-06-01", arrivalDate: "2026-06-15", duration: "14 jours",
    pricePerKg: 3, currency: "€", capacityKg: 5000,
    mode: "standard", transport: "bateau",
    baseLoc: LE_HAVRE,
    phone: "+33 2 35 00 00 00", whatsapp: "+33 6 99 88 77 66",
    email: "ops@cargoatlantique.fr", address: "Port du Havre, France",
  },
];

export function findGP(id: string) {
  return GP_LIST.find((g) => g.id === id);
}
