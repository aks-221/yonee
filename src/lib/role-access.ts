import type { AppRole } from "@/lib/auth";

export type MenuKey = "home" | "search" | "tracking" | "wallet" | "profile" | "announcements" | "scan" | "admin" | "admin_users" | "admin_gp" | "admin_tx";

export const MENU_BY_ROLE: Record<AppRole, MenuKey[]> = {
  client:      ["home", "search", "tracking", "wallet", "profile"],
  merchant:    ["home", "search", "tracking", "wallet", "profile"],
  supplier:    ["home", "search", "tracking", "wallet", "profile"],
  gp_standard: ["announcements", "tracking", "scan", "wallet", "profile"],
  gp_express:  ["announcements", "tracking", "scan", "wallet", "profile"],
  admin:       ["admin", "admin_users", "admin_gp", "admin_tx", "profile"],
};

export function menuFor(role: AppRole): MenuKey[] {
  return MENU_BY_ROLE[role] ?? [];
}

export const SCAN_ALLOWED: AppRole[] = ["gp_standard", "gp_express"];
export const ADMIN_ONLY: AppRole[] = ["admin"];
export const PUBLISH_ANNOUNCEMENT: AppRole[] = ["gp_standard", "gp_express"];
export const CREATE_RESERVATION: AppRole[] = ["client", "merchant", "supplier"];

export function canScan(roles: AppRole[]) { return roles.some((r) => SCAN_ALLOWED.includes(r)); }
export function canAccessAdmin(roles: AppRole[]) { return roles.includes("admin"); }
export function canPublishAnnouncement(roles: AppRole[]) { return roles.some((r) => PUBLISH_ANNOUNCEMENT.includes(r)); }
export function canCreateReservation(roles: AppRole[]) { return roles.some((r) => CREATE_RESERVATION.includes(r)); }

// Reservation business rules (mirror server-side RPCs)
export type ResStatus = "pending" | "accepted" | "paid" | "picked_up" | "in_transit" | "arrived" | "delivered" | "rejected" | "cancelled" | "refunded";

export const NEXT_STATUS: Partial<Record<ResStatus, ResStatus>> = {
  accepted: "picked_up", paid: "picked_up", picked_up: "in_transit", in_transit: "arrived", arrived: "delivered",
};

export const STATUS_TITLE: Record<ResStatus, string> = {
  pending: "Réservation créée", accepted: "Acceptée", paid: "Paiement confirmé",
  picked_up: "Colis pris en charge", in_transit: "Colis en transit", arrived: "Colis arrivé",
  delivered: "Colis livré", rejected: "Réservation rejetée", cancelled: "Réservation annulée", refunded: "Réservation remboursée",
};

export function canCancel(role: "client" | "gp" | "other", status: ResStatus) {
  if (role === "other") return false;
  return status === "pending" || status === "paid";
}

export function canAdvance(isGP: boolean, status: ResStatus) {
  return isGP && NEXT_STATUS[status] !== undefined;
}

export function canConfirmPayment(isGP: boolean, status: ResStatus, unlocked: boolean) {
  return isGP && !unlocked && (status === "pending" || status === "paid");
}
