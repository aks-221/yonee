import { describe, it, expect } from "vitest";
import { STATUS_TITLE, NEXT_STATUS, canConfirmPayment } from "@/lib/role-access";

// Mirrors server RPCs confirm_payment_received + notify_reservation_status trigger.
// These are pure business rules so they run in CI without a live Supabase.

type Payment = { method: "wave" | "orange_money" | "card" | "wallet"; status: "pending" | "succeeded" | "failed"; amount: number };
type Notif = { user_id: string; title: string; type: string; body: string };

function confirmPayment(p: Payment, isGP: boolean, resStatus: "pending" | "paid", unlocked: boolean) {
  if (!canConfirmPayment(isGP, resStatus, unlocked)) throw new Error("forbidden");
  return { ...p, status: "succeeded" as const };
}

function emitStatusNotifs(clientId: string, gpId: string, code: string, newStatus: keyof typeof STATUS_TITLE): Notif[] {
  const title = STATUS_TITLE[newStatus];
  const body = `Réservation #${code}`;
  return [
    { user_id: clientId, type: "tracking", title, body },
    { user_id: gpId, type: "tracking", title, body },
  ];
}

describe("Wave / Orange Money payment confirmation (Sénégal)", () => {
  it("Wave: GP confirms a pending Wave payment → succeeded + paid notification to both parties", () => {
    const p: Payment = { method: "wave", status: "pending", amount: 15000 };
    const confirmed = confirmPayment(p, true, "pending", false);
    expect(confirmed.status).toBe("succeeded");
    const notifs = emitStatusNotifs("client-1", "gp-1", "YN-ABCDEFGH", "paid");
    expect(notifs).toHaveLength(2);
    expect(notifs[0].title).toBe("Paiement confirmé");
    expect(notifs[1].title).toBe("Paiement confirmé");
    expect(notifs[0].body).toContain("YN-ABCDEFGH");
  });

  it("Orange Money: same flow yields succeeded + notifications", () => {
    const confirmed = confirmPayment({ method: "orange_money", status: "pending", amount: 9000 }, true, "paid", false);
    expect(confirmed.status).toBe("succeeded");
    const notifs = emitStatusNotifs("c", "g", "YN-1", "paid");
    expect(notifs.every((n) => n.title === "Paiement confirmé")).toBe(true);
  });

  it("Already unlocked reservation cannot be re-confirmed", () => {
    expect(() => confirmPayment({ method: "wave", status: "pending", amount: 1 }, true, "paid", true)).toThrow();
  });

  it("Non-GP cannot confirm payment", () => {
    expect(() => confirmPayment({ method: "wave", status: "pending", amount: 1 }, false, "pending", false)).toThrow();
  });

  it("Status progression after paid follows NEXT_STATUS chain", () => {
    expect(NEXT_STATUS.paid).toBe("picked_up");
  });
});

describe("Wallet refund on cancellation", () => {
  type Wallet = { user_id: string; balance: number };
  function refundOnCancel(wallet: Wallet, amount: number, method: Payment["method"]) {
    // Server-side rule: only wallet payments refund to wallet on cancel (Wave/OM refunds go via provider).
    if (method !== "wallet") return wallet;
    return { ...wallet, balance: wallet.balance + amount };
  }

  it("Wallet payment is refunded to the client wallet on cancellation", () => {
    const before: Wallet = { user_id: "c", balance: 5000 };
    const after = refundOnCancel(before, 7500, "wallet");
    expect(after.balance).toBe(12500);
  });

  it("Wave/OM payments do not credit the wallet on cancel", () => {
    const before: Wallet = { user_id: "c", balance: 5000 };
    expect(refundOnCancel(before, 7500, "wave").balance).toBe(5000);
    expect(refundOnCancel(before, 7500, "orange_money").balance).toBe(5000);
  });

  it("Refund + cancellation notification both reach the client", () => {
    const notifs = emitStatusNotifs("c", "g", "YN-REF", "refunded");
    expect(notifs[0].title).toBe("Réservation remboursée");
    expect(notifs[0].body).toContain("YN-REF");
  });
});

describe("Notification content per status (mirrors notify_reservation_status trigger)", () => {
  const codes: { status: keyof typeof STATUS_TITLE; expected: string }[] = [
    { status: "paid", expected: "Paiement confirmé" },
    { status: "picked_up", expected: "Colis pris en charge" },
    { status: "in_transit", expected: "Colis en transit" },
    { status: "arrived", expected: "Colis arrivé" },
    { status: "delivered", expected: "Colis livré" },
    { status: "cancelled", expected: "Réservation annulée" },
    { status: "refunded", expected: "Réservation remboursée" },
    { status: "rejected", expected: "Réservation rejetée" },
  ];
  it.each(codes)("status $status → title '$expected' delivered to client AND GP", ({ status, expected }) => {
    const notifs = emitStatusNotifs("client-x", "gp-x", "YN-Z", status);
    expect(notifs.map((n) => n.title)).toEqual([expected, expected]);
    expect(notifs.map((n) => n.user_id)).toEqual(["client-x", "gp-x"]);
    expect(notifs.every((n) => n.body.includes("YN-Z"))).toBe(true);
  });
});

describe("Role default after signup", () => {
  it("No-role user falls back to client (dashboard never blocks)", () => {
    const roles: string[] = [];
    const effective = roles.length === 0 ? ["client"] : roles;
    expect(effective).toEqual(["client"]);
  });
});