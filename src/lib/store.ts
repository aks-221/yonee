import { useEffect, useSyncExternalStore } from "react";

export type ReservationStatus =
  | "paid"          // payment confirmed, awaiting pickup
  | "picked_up"    // GP scanned QR & took the package
  | "in_transit"   // package en route
  | "arrived"      // arrived at destination
  | "delivered"    // delivered to receiver
  | "cancelled"
  | "refunded";

export type Reservation = {
  id: string;          // GPE-XXXX user-visible code
  gpId: string;
  gpName: string;
  fromCity: string; fromFlag: string;
  toCity: string;    toFlag: string;
  weightKg: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: ReservationStatus;
  createdAt: number;
  updatedAt: number;
  history: { status: ReservationStatus; at: number; note?: string }[];
  sender?: { name: string; phone: string; address: string };
  receiver?: { name: string; phone: string; address: string };
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
  reservationId?: string;
  kind: "payment" | "status" | "cancel" | "refund" | "info";
};

export type GPApplication = {
  status: "none" | "pending" | "approved" | "rejected";
  submittedAt?: number;
  documents: string[]; // file names
};

export type UserLocation = { lat: number; lng: number; updatedAt: number } | null;

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  avatarUrl?: string;
  role: "client" | "merchant" | "supplier" | "gp_standard" | "gp_express";
};

export type GPAnnouncement = {
  id: string;
  fromCity: string; fromFlag: string;
  toCity: string; toFlag: string;
  departureDate: string;
  pricePerKg: number;
  capacityKg: number;
  mode: "standard" | "express";
  description: string;
  photoUrl?: string;
  createdAt: number;
};

type State = {
  reservations: Reservation[];
  notifications: AppNotification[];
  gpApplication: GPApplication;
  location: UserLocation;
  profile: UserProfile;
  myAnnouncements: GPAnnouncement[];
  pushEnabled: boolean;
};

const KEY = "gpe.state.v1";
const initial: State = {
  reservations: [],
  notifications: [],
  gpApplication: { status: "none", documents: [] },
  location: null,
  profile: {
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    role: "client",
  },
  myAnnouncements: [],
  pushEnabled: false,
};

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch { return initial; }
}
function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}
function set(updater: (s: State) => State) {
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function getSnapshot() { return state; }
const serverSnap: State = initial;

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()), () => selector(serverSnap));
}

// ---------- Notifications ----------
export function pushNotification(n: Omit<AppNotification, "id" | "at" | "read">) {
  const notif: AppNotification = {
    ...n,
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    at: Date.now(),
    read: false,
  };
  set((s) => ({ ...s, notifications: [notif, ...s.notifications] }));
  // Web Push (works while tab is open; PWA install enables background)
  if (typeof window !== "undefined" && state.pushEnabled && "Notification" in window && Notification.permission === "granted") {
    try { new Notification(n.title, { body: n.body, icon: "/favicon.ico", tag: n.reservationId }); } catch {}
  }
  return notif;
}
export function markAllRead() {
  set((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
}

export async function enablePushNotifications(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  const ok = perm === "granted";
  set((s) => ({ ...s, pushEnabled: ok }));
  return ok;
}

// ---------- Reservations ----------
function genCode() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)];
  return `GPE-${s}`;
}

export function createReservation(input: Omit<Reservation, "id" | "status" | "createdAt" | "updatedAt" | "history">): Reservation {
  const now = Date.now();
  const r: Reservation = {
    ...input,
    id: genCode(),
    status: "paid",
    createdAt: now, updatedAt: now,
    history: [{ status: "paid", at: now, note: "Paiement confirmé" }],
  };
  set((s) => ({ ...s, reservations: [r, ...s.reservations] }));
  pushNotification({
    kind: "payment",
    title: "Paiement confirmé ✅",
    body: `${r.amount.toFixed(2)} ${r.currency} payés via ${r.paymentMethod}. Code: ${r.id}`,
    reservationId: r.id,
  });
  return r;
}

export function findReservation(id: string) {
  return state.reservations.find((r) => r.id === id);
}

export function updateReservationStatus(id: string, status: ReservationStatus, note?: string) {
  set((s) => ({
    ...s,
    reservations: s.reservations.map((r) =>
      r.id === id
        ? {
            ...r,
            status,
            updatedAt: Date.now(),
            history: [...r.history, { status, at: Date.now(), note }],
          }
        : r,
    ),
  }));
  const r = findReservation(id);
  if (!r) return;
  const map: Record<ReservationStatus, { t: string; b: string; k: AppNotification["kind"] }> = {
    paid:       { t: "Réservation confirmée", b: `Code ${id} prêt à être présenté au GP.`, k: "payment" },
    picked_up:  { t: "Colis pris en charge 📦", b: `Le GP a scanné votre QR. Départ imminent.`, k: "status" },
    in_transit: { t: "En transit 🛫", b: `Votre colis ${id} est en route.`, k: "status" },
    arrived:    { t: "Arrivé à destination 🛬", b: `${r.toFlag} ${r.toCity} — en attente de livraison.`, k: "status" },
    delivered:  { t: "Livré ✅", b: `Votre colis a été remis au destinataire.`, k: "status" },
    cancelled:  { t: "Réservation annulée", b: `${id} annulée.`, k: "cancel" },
    refunded:   { t: "Remboursement effectué 💸", b: `${r.amount.toFixed(2)} ${r.currency} remboursés.`, k: "refund" },
  };
  pushNotification({ ...map[status], reservationId: id, title: map[status].t, body: map[status].b, kind: map[status].k });
}

export function cancelReservation(id: string): { ok: boolean; reason?: string } {
  const r = findReservation(id);
  if (!r) return { ok: false, reason: "Réservation introuvable" };
  if (r.status !== "paid") return { ok: false, reason: "Annulation impossible : le colis a déjà été pris en charge." };
  updateReservationStatus(id, "cancelled", "Annulée par le client");
  // Auto-refund immediately
  setTimeout(() => updateReservationStatus(id, "refunded", "Remboursement automatique"), 600);
  return { ok: true };
}

// ---------- GP Application ----------
export function submitGPApplication(documents: string[]) {
  set((s) => ({
    ...s,
    gpApplication: { status: "pending", submittedAt: Date.now(), documents },
  }));
  pushNotification({
    kind: "info",
    title: "Documents reçus",
    body: "Vérification en cours (24-48h). Vous serez notifié dès activation.",
  });
}
export function approveGPApplication() {
  set((s) => ({ ...s, gpApplication: { ...s.gpApplication, status: "approved" } }));
  pushNotification({ kind: "info", title: "Compte GP activé ✅", body: "Vos documents ont été validés." });
}

// ---------- Location ----------
export function setLocation(loc: { lat: number; lng: number }) {
  set((s) => ({ ...s, location: { ...loc, updatedAt: Date.now() } }));
}

// ---------- Profile ----------
export function updateProfile(p: Partial<UserProfile>) {
  set((s) => ({ ...s, profile: { ...s.profile, ...p } }));
}

// ---------- GP Announcements ----------
export function addAnnouncement(a: Omit<GPAnnouncement, "id" | "createdAt">) {
  const ann: GPAnnouncement = { ...a, id: `ann_${Date.now()}`, createdAt: Date.now() };
  set((s) => ({ ...s, myAnnouncements: [ann, ...s.myAnnouncements] }));
  return ann;
}
export function removeAnnouncement(id: string) {
  set((s) => ({ ...s, myAnnouncements: s.myAnnouncements.filter((a) => a.id !== id) }));
}

// ---------- Helpers ----------
export function hasPaidFor(gpId: string): boolean {
  return state.reservations.some((r) => r.gpId === gpId && r.status !== "cancelled" && r.status !== "refunded");
}

/** Estimate progress 0..1 and ETA based on status & timestamps. */
export function reservationProgress(r: Reservation): { progress: number; etaLabel: string } {
  const order: ReservationStatus[] = ["paid", "picked_up", "in_transit", "arrived", "delivered"];
  const idx = Math.max(0, order.indexOf(r.status));
  const progress = idx / (order.length - 1);
  const baseHours = 24; // simulated total transit
  const remaining = Math.max(0, Math.round(baseHours * (1 - progress)));
  if (r.status === "delivered") return { progress: 1, etaLabel: "Livré" };
  if (r.status === "cancelled" || r.status === "refunded") return { progress: 0, etaLabel: "Annulé" };
  return { progress, etaLabel: remaining < 1 ? "Bientôt" : `~${remaining} h` };
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Hook to auto-request geolocation once
export function useRequestLocation() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    if (state.location && Date.now() - state.location.updatedAt < 10 * 60 * 1000) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 },
    );
  }, []);
}
