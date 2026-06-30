import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useUserRoles, signOut } from "@/lib/auth";
import { Loader2, ShieldCheck, Users, Receipt, LayoutDashboard, Megaphone, LogOut, AlertTriangle, Boxes } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { session, loading: sl } = useSession();
  const { roles, loading: rl } = useUserRoles();
  const nav = useNavigate();
  const loc = useLocation();
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => { if (!sl && !session) nav({ to: "/login" }); }, [sl, session, nav]);

  if (sl || rl) return <MobileFrame><div className="min-h-full grid place-items-center"><Loader2 className="size-6 animate-spin"/></div></MobileFrame>;
  if (!session) return null;

  const isAdmin = roles.includes("admin");

  if (!isAdmin) {
    return (
      <MobileFrame>
        <div className="min-h-full p-6 grid place-items-center bg-background">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center border border-border">
            <AlertTriangle className="size-10 mx-auto text-amber-500"/>
            <h2 className="font-black mt-2" style={{ color: "var(--yonnee-navy)" }}>Accès réservé aux administrateurs</h2>
            <p className="text-xs text-muted-foreground mt-1">Si vous êtes le premier utilisateur, vous pouvez réclamer le rôle admin maintenant.</p>
            <button
              disabled={bootstrapping}
              onClick={async () => {
                setBootstrapping(true);
                const { data, error } = await supabase.rpc("bootstrap_admin");
                setBootstrapping(false);
                if (error) { toast.error(error.message); return; }
                if (data) { toast.success("Vous êtes maintenant administrateur"); window.location.reload(); }
                else toast.info("Un administrateur existe déjà.");
              }}
              className="mt-4 w-full rounded-xl text-white font-bold py-2.5 disabled:opacity-50"
              style={{ background: "var(--yonnee-navy)" }}
            >{bootstrapping ? "..." : "Devenir administrateur"}</button>
            <Link to="/dashboard" className="text-xs underline block mt-3 text-muted-foreground">Retour au tableau de bord</Link>
          </div>
        </div>
      </MobileFrame>
    );
  }

  const tabs = [
    { to: "/admin", label: "Vue", icon: LayoutDashboard, exact: true },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/gp", label: "GP", icon: ShieldCheck },
    { to: "/admin/cargo", label: "Cargo", icon: Boxes },
    { to: "/admin/announcements", label: "Annonces", icon: Megaphone },
    { to: "/admin/transactions", label: "Tx", icon: Receipt },
  ];

  return (
    <MobileFrame>
      <div className="min-h-full bg-background pb-24">
        <div className="text-white px-5 pt-6 pb-4" style={{ background: "linear-gradient(135deg, #0d1228, var(--yonnee-navy))" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-70">Administration</p>
              <h1 className="text-xl font-black">Dashboard Admin</h1>
            </div>
            <button onClick={signOut} className="size-9 grid place-items-center rounded-full bg-white/20"><LogOut className="size-4"/></button>
          </div>
        </div>
        <div className="px-3 pt-3 sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map((t) => {
              const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
              return (
                <Link key={t.to} to={t.to} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${active ? "text-white" : "bg-white text-muted-foreground border border-border"}`} style={active ? { background: "var(--yonnee-navy)" } : undefined}>
                  <t.icon className="size-3.5"/> {t.label}
                </Link>
              );
            })}
          </div>
        </div>
        <Outlet/>
      </div>
    </MobileFrame>
  );
}
