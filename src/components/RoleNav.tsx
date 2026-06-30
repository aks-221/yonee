import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, Package, User, Store, ClipboardList, Boxes, Inbox, Megaphone, Zap, Users, ShieldCheck, Receipt, LayoutDashboard, Wallet, PackagePlus, PackageSearch } from "lucide-react";
import { useUserRoles, pickPrimaryRole, ROLE_COLOR, type AppRole } from "@/lib/auth";
import { useT } from "@/lib/i18n";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

function itemsFor(role: AppRole, t: (k: string) => string): Item[] {
  switch (role) {
    case "client":
      return [
        { to: "/home", label: t("nav.home"), icon: Home },
        { to: "/search", label: t("nav.search"), icon: Search },
        { to: "/tracking", label: t("nav.parcels"), icon: Package },
        { to: "/wallet", label: t("nav.wallet"), icon: Wallet },
        { to: "/profile", label: t("nav.profile"), icon: User },
      ];
    case "merchant":
      return [
        { to: "/home", label: t("nav.home"), icon: Home },
        { to: "/search", label: t("nav.search"), icon: Store },
        { to: "/tracking", label: t("nav.orders"), icon: ClipboardList },
        { to: "/wallet", label: t("nav.wallet"), icon: Wallet },
        { to: "/profile", label: t("nav.profile"), icon: User },
      ];
    case "supplier":
      return [
        { to: "/home", label: t("nav.home"), icon: Home },
        { to: "/search", label: t("nav.stock"), icon: Boxes },
        { to: "/tracking", label: t("nav.requests"), icon: Inbox },
        { to: "/wallet", label: t("nav.wallet"), icon: Wallet },
        { to: "/profile", label: t("nav.profile"), icon: User },
      ];
    case "gp_standard":
      return [
        { to: "/announcements", label: t("nav.freight"), icon: Megaphone },
        { to: "/cargo", label: t("nav.cargo"), icon: PackagePlus },
        { to: "/cargo-tracking", label: t("nav.cargo_tracking"), icon: PackageSearch },
        { to: "/tracking", label: t("nav.history"), icon: ClipboardList },
        { to: "/profile", label: t("nav.profile"), icon: User },
      ];
    case "gp_express":
      return [
        { to: "/announcements", label: t("nav.freight"), icon: Zap },
        { to: "/cargo", label: t("nav.cargo"), icon: PackagePlus },
        { to: "/cargo-tracking", label: t("nav.cargo_tracking"), icon: PackageSearch },
        { to: "/tracking", label: t("nav.history"), icon: ClipboardList },
        { to: "/profile", label: t("nav.profile"), icon: User },
      ];
    case "admin":
      return [
        { to: "/admin", label: t("nav.overview"), icon: LayoutDashboard },
        { to: "/admin/users", label: t("nav.users"), icon: Users },
        { to: "/admin/gp", label: t("nav.gpverif"), icon: ShieldCheck },
        { to: "/admin/cargo", label: t("nav.admin_cargo"), icon: Boxes },
        { to: "/admin/transactions", label: t("nav.tx"), icon: Receipt },
      ];
    default:
      return [];
  }
}

export function RoleNav() {
  const { roles } = useUserRoles();
  const t = useT();
  const loc = useLocation();
  const role: AppRole = pickPrimaryRole(roles);
  const items = itemsFor(role, t);
  const accent = ROLE_COLOR[role].solid;
  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-[460px] bg-white/95 backdrop-blur border border-border/60 shadow-xl rounded-2xl px-1.5 py-1.5 flex justify-around z-50">
      {items.map((it) => {
        const active = loc.pathname === it.to || loc.pathname.startsWith(it.to + "/");
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all min-w-0 ${
              active ? "text-white shadow" : "text-muted-foreground"
            }`}
            style={active ? { background: accent } : undefined}
          >
            <Icon className="size-[18px]" />
            <span className="text-[9px] font-semibold leading-none truncate max-w-[60px]">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
