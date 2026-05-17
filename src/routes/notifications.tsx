import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useStore, markAllRead } from "@/lib/store";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/notifications")({ component: Notifs });

function Notifs() {
  const nav = useNavigate();
  const notifications = useStore((s) => s.notifications);
  useEffect(() => { const t = setTimeout(() => markAllRead(), 800); return () => clearTimeout(t); }, []);

  return (
    <MobileFrame>
      <div className="min-h-full bg-background pb-12">
        <div className="bg-gradient-to-br from-brand-navy to-brand-blue text-white px-5 pt-10 pb-6 rounded-b-3xl">
          <button onClick={() => nav({ to: "/home" })} className="mb-3"><ArrowLeft className="size-5"/></button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black">Notifications</h1>
            <button onClick={() => markAllRead()} className="text-xs flex items-center gap-1 bg-white/15 px-3 py-1.5 rounded-full">
              <CheckCheck className="size-3"/> Tout lire
            </button>
          </div>
        </div>
        <div className="px-5 mt-4 space-y-2">
          {notifications.length === 0 && (
            <div className="bg-card rounded-2xl p-8 text-center shadow-[var(--shadow-card)]">
              <Bell className="size-10 mx-auto text-muted-foreground" />
              <p className="font-semibold text-brand-navy mt-3">Aucune notification</p>
            </div>
          )}
          {notifications.map((n) => (
            <div key={n.id} className={`bg-card rounded-2xl p-4 shadow-[var(--shadow-card)] flex gap-3 ${!n.read ? "border-l-4 border-brand-blue" : ""}`}>
              <div className="size-10 rounded-xl bg-brand-blue/10 text-brand-blue grid place-items-center shrink-0">
                <Bell className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-navy text-sm">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.at).toLocaleString("fr-FR")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileFrame>
  );
}
