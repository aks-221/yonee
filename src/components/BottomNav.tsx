// Legacy BottomNav now delegates to the role-aware RoleNav so every protected
// screen shows the correct menu for the signed-in user (Client, Merchant,
// Supplier, Fret Standard, Fret Express, Admin).
export { RoleNav as BottomNav } from "./RoleNav";
