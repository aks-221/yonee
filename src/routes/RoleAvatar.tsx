import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/RoleAvatar')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/RoleAvatar"!</div>
}
import type { AppRole } from "@/lib/auth";

// Avatars SVG inline par rôle — couleurs Yonnee exactes
// Client: bleu (#3BA7E8) · Fournisseur: vert (#16A34A) · Commerçant: rouge (#E0392B)
// Fret Standard: navy (#0B2A6B) · Fret Express: violet (#7C3AED) · Admin: dark (#0F172A)

const AVATARS: Record<AppRole, (size: number) => JSX.Element> = {
  client: (s) => (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="#3BA7E8"/>
      <circle cx="40" cy="28" r="12" fill="white" opacity="0.9"/>
      <ellipse cx="40" cy="62" rx="20" ry="14" fill="white" opacity="0.9"/>
      {/* Colis */}
      <rect x="30" y="44" width="20" height="14" rx="3" fill="#3BA7E8" stroke="white" strokeWidth="1.5"/>
      <line x1="40" y1="44" x2="40" y2="58" stroke="white" strokeWidth="1.5"/>
      <line x1="30" y1="51" x2="50" y2="51" stroke="white" strokeWidth="1.5"/>
    </svg>
  ),
  supplier: (s) => (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="#16A34A"/>
      <circle cx="40" cy="28" r="12" fill="white" opacity="0.9"/>
      <ellipse cx="40" cy="62" rx="20" ry="14" fill="white" opacity="0.9"/>
      {/* Boîtes stock */}
      <rect x="26" y="44" width="12" height="10" rx="2" fill="#16A34A" stroke="white" strokeWidth="1.5"/>
      <rect x="42" y="44" width="12" height="10" rx="2" fill="#16A34A" stroke="white" strokeWidth="1.5"/>
      <rect x="33" y="38" width="14" height="8" rx="2" fill="#16A34A" stroke="white" strokeWidth="1.5"/>
    </svg>
  ),
  merchant: (s) => (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="#E0392B"/>
      <circle cx="40" cy="28" r="12" fill="white" opacity="0.9"/>
      <ellipse cx="40" cy="62" rx="20" ry="14" fill="white" opacity="0.9"/>
      {/* Boutique */}
      <rect x="28" y="43" width="24" height="16" rx="2" fill="#E0392B" stroke="white" strokeWidth="1.5"/>
      <rect x="36" y="50" width="8" height="9" rx="1" fill="white" opacity="0.8"/>
      <path d="M26 43 L40 36 L54 43" stroke="white" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  gp_standard: (s) => (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="#0B2A6B"/>
      <circle cx="40" cy="28" r="12" fill="white" opacity="0.9"/>
      <ellipse cx="40" cy="62" rx="20" ry="14" fill="white" opacity="0.9"/>
      {/* Avion */}
      <path d="M22 52 L40 44 L58 52 L48 52 L44 58 L40 58 L42 52 L38 52 L34 58 L30 58 L32 52 Z" fill="#0B2A6B" stroke="white" strokeWidth="1" opacity="0.9"/>
    </svg>
  ),
  gp_express: (s) => (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="#7C3AED"/>
      <circle cx="40" cy="28" r="12" fill="white" opacity="0.9"/>
      <ellipse cx="40" cy="62" rx="20" ry="14" fill="white" opacity="0.9"/>
      {/* Éclair express */}
      <path d="M44 36 L36 48 L41 48 L37 60 L50 45 L44 45 L50 36 Z" fill="#7C3AED" stroke="white" strokeWidth="1.2"/>
    </svg>
  ),
  admin: (s) => (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="#0F172A"/>
      <circle cx="40" cy="28" r="12" fill="white" opacity="0.9"/>
      <ellipse cx="40" cy="62" rx="20" ry="14" fill="white" opacity="0.9"/>
      {/* Bouclier admin */}
      <path d="M40 36 L50 40 L50 50 C50 55 40 59 40 59 C40 59 30 55 30 50 L30 40 Z" fill="#0F172A" stroke="white" strokeWidth="1.5"/>
      <path d="M36 47 L39 50 L44 44" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export function RoleAvatar({
  role, size = 64, className = "",
}: {
  role: AppRole; size?: number; className?: string;
}) {
  const render = AVATARS[role] ?? AVATARS.client;
  return <div className={className} style={{ width: size, height: size, flexShrink: 0 }}>{render(size)}</div>;
}

// Badge rôle compact pour le header dashboard
export function RoleBadge({ role }: { role: AppRole }) {
  const COLORS: Record<AppRole, { bg: string; text: string; label: string }> = {
    client:      { bg: "#E6F4FD", text: "#1E6FB8", label: "Client" },
    supplier:    { bg: "#E7F8EE", text: "#15803D", label: "Fournisseur" },
    merchant:    { bg: "#FDECEA", text: "#B91C1C", label: "Commerçant" },
    gp_standard: { bg: "#E5EAF5", text: "#0B2A6B", label: "Fret Standard" },
    gp_express:  { bg: "#F1EAFE", text: "#5B21B6", label: "Fret Express" },
    admin:       { bg: "#E2E8F0", text: "#0F172A", label: "Admin" },
  };
  const c = COLORS[role] ?? COLORS.client;
  return (
    <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full"
      style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}
