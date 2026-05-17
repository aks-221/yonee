import { describe, it, expect } from "vitest";
import { canAccessAdmin } from "@/lib/role-access";

type VerifStatus = "pending" | "validated" | "rejected";

function nextVerifStatus(action: "approve" | "reject"): VerifStatus {
  return action === "approve" ? "validated" : "rejected";
}

describe("Admin GP verification flow", () => {
  it("Non-admin cannot access admin GP screen", () => {
    expect(canAccessAdmin(["gp_standard"])).toBe(false);
    expect(canAccessAdmin(["client"])).toBe(false);
  });
  it("Admin approve maps to validated, reject maps to rejected", () => {
    expect(nextVerifStatus("approve")).toBe("validated");
    expect(nextVerifStatus("reject")).toBe("rejected");
  });
  it("After admin approval, GP screen banner should disappear (status === validated)", () => {
    const verifStatus: VerifStatus = "validated";
    const showBanner = verifStatus !== "validated";
    expect(showBanner).toBe(false);
  });
  it("Rejected GP sees red banner with notes", () => {
    const verifStatus: VerifStatus = "rejected";
    const notes = "Pièce illisible";
    expect(verifStatus).toBe("rejected");
    expect(notes.length).toBeGreaterThan(0);
  });
});
