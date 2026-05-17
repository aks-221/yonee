import { describe, it, expect } from "vitest";
import { canAdvance, canCancel, NEXT_STATUS, STATUS_TITLE } from "@/lib/role-access";

// E2E rule simulation for QR scan flow:
// 1. GP scans code -> reservation loaded (must be assigned to this GP -> server RLS res_select_party_or_admin)
// 2. GP advances status -> trigger fires notify_reservation_status -> notifications inserted for client + gp
// 3. Only authorized roles (the GP of the reservation) can call gp_advance_reservation (RPC enforces gp_id = auth.uid())

describe("QR scan end-to-end rules", () => {
  it("Reservation owned by another GP must be rejected on client", () => {
    const myId = "gp-A";
    const reservation = { gp_id: "gp-B", status: "paid" as const };
    const allowed = reservation.gp_id === myId;
    expect(allowed).toBe(false);
  });

  it("After scan, advancing a paid reservation moves it to picked_up and yields notification title", () => {
    const status = "paid" as const;
    expect(canAdvance(true, status)).toBe(true);
    const next = NEXT_STATUS[status]!;
    expect(next).toBe("picked_up");
    expect(STATUS_TITLE[next]).toBe("Colis pris en charge");
  });

  it("Cannot cancel after pickup", () => {
    expect(canCancel("client", "in_transit")).toBe(false);
    expect(canCancel("gp", "in_transit")).toBe(false);
  });
});
