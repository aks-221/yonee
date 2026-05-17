import { describe, it, expect } from "vitest";
import { menuFor, canScan, canAccessAdmin, canPublishAnnouncement, canCreateReservation, canCancel, canAdvance, canConfirmPayment, NEXT_STATUS, STATUS_TITLE } from "@/lib/role-access";

describe("Role-based menu isolation", () => {
  it("Client menu contains home/search/tracking/wallet/profile only", () => {
    expect(menuFor("client")).toEqual(["home", "search", "tracking", "wallet", "profile"]);
  });
  it("Supplier menu does not include scan or admin", () => {
    const m = menuFor("supplier");
    expect(m).not.toContain("scan");
    expect(m).not.toContain("admin");
  });
  it("Merchant menu does not include scan or admin", () => {
    expect(menuFor("merchant")).not.toContain("scan");
    expect(menuFor("merchant")).not.toContain("admin");
  });
  it("GP Standard menu includes announcements & scan, not admin", () => {
    const m = menuFor("gp_standard");
    expect(m).toContain("announcements");
    expect(m).toContain("scan");
    expect(m).not.toContain("admin");
  });
  it("GP Express menu includes announcements & scan", () => {
    const m = menuFor("gp_express");
    expect(m).toContain("announcements");
    expect(m).toContain("scan");
  });
  it("Admin menu only contains admin entries + profile", () => {
    expect(menuFor("admin")).toEqual(["admin", "admin_users", "admin_gp", "admin_tx", "profile"]);
  });
});

describe("Role permissions", () => {
  it("Only GPs can scan QR codes", () => {
    expect(canScan(["client"])).toBe(false);
    expect(canScan(["merchant"])).toBe(false);
    expect(canScan(["supplier"])).toBe(false);
    expect(canScan(["gp_standard"])).toBe(true);
    expect(canScan(["gp_express"])).toBe(true);
    expect(canScan(["client", "gp_standard"])).toBe(true);
  });
  it("Only admins access admin dashboard", () => {
    expect(canAccessAdmin(["client"])).toBe(false);
    expect(canAccessAdmin(["gp_express"])).toBe(false);
    expect(canAccessAdmin(["admin"])).toBe(true);
  });
  it("Only GPs publish announcements", () => {
    expect(canPublishAnnouncement(["client"])).toBe(false);
    expect(canPublishAnnouncement(["gp_standard"])).toBe(true);
    expect(canPublishAnnouncement(["gp_express"])).toBe(true);
  });
  it("Only client/merchant/supplier create reservations", () => {
    expect(canCreateReservation(["client"])).toBe(true);
    expect(canCreateReservation(["merchant"])).toBe(true);
    expect(canCreateReservation(["supplier"])).toBe(true);
    expect(canCreateReservation(["gp_standard"])).toBe(false);
    expect(canCreateReservation(["admin"])).toBe(false);
  });
});

describe("Reservation lifecycle (mirrors server RPCs)", () => {
  it("paid → picked_up → in_transit → arrived → delivered", () => {
    expect(NEXT_STATUS.paid).toBe("picked_up");
    expect(NEXT_STATUS.picked_up).toBe("in_transit");
    expect(NEXT_STATUS.in_transit).toBe("arrived");
    expect(NEXT_STATUS.arrived).toBe("delivered");
    expect(NEXT_STATUS.delivered).toBeUndefined();
  });

  it("Notification title exists for every status", () => {
    (["pending","accepted","paid","picked_up","in_transit","arrived","delivered","rejected","cancelled","refunded"] as const).forEach((s) => {
      expect(STATUS_TITLE[s]).toBeTruthy();
    });
  });

  it("Cancellation only allowed at pending/paid for client or GP", () => {
    expect(canCancel("client", "pending")).toBe(true);
    expect(canCancel("gp", "paid")).toBe(true);
    expect(canCancel("client", "in_transit")).toBe(false);
    expect(canCancel("gp", "delivered")).toBe(false);
    expect(canCancel("other", "pending")).toBe(false);
  });

  it("Only GP can advance and only when next status exists", () => {
    expect(canAdvance(true, "paid")).toBe(true);
    expect(canAdvance(true, "delivered")).toBe(false);
    expect(canAdvance(false, "paid")).toBe(false);
  });

  it("GP can confirm payment only when not yet unlocked and status is pending/paid", () => {
    expect(canConfirmPayment(true, "pending", false)).toBe(true);
    expect(canConfirmPayment(true, "paid", false)).toBe(true);
    expect(canConfirmPayment(true, "paid", true)).toBe(false);
    expect(canConfirmPayment(true, "in_transit", false)).toBe(false);
    expect(canConfirmPayment(false, "pending", false)).toBe(false);
  });
});
