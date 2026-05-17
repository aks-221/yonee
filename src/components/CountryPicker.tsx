import { useState } from "react";
import { COUNTRIES } from "@/lib/gp-data";
import { Search, X, Check } from "lucide-react";

export function CountryPicker({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const c = COUNTRIES.find((x) => x.code === value);
  const filtered = COUNTRIES.filter((co) =>
    co.name.toLowerCase().includes(q.toLowerCase()) || co.code.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-3 bg-secondary hover:bg-secondary/70 rounded-2xl transition active:scale-[0.99] text-left"
      >
        <span className="text-3xl drop-shadow-sm">{c?.flag}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
          <p className="font-bold text-brand-navy text-sm truncate">{c?.name}</p>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{c?.code}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 anim-fadeup" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[460px] bg-card rounded-t-3xl pt-3 pb-6 max-h-[80vh] flex flex-col anim-fadeup shadow-2xl"
          >
            <div className="mx-auto h-1.5 w-12 bg-border rounded-full" />
            <div className="px-5 pt-3 pb-2 flex items-center justify-between">
              <h3 className="font-black text-brand-navy">Choisir un pays</h3>
              <button onClick={() => setOpen(false)} className="size-8 grid place-items-center rounded-full bg-secondary"><X className="size-4"/></button>
            </div>
            <div className="px-5 mt-1">
              <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
                <Search className="size-4 text-muted-foreground"/>
                <input
                  autoFocus
                  value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher un pays…"
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
            </div>
            <ul className="mt-3 px-2 overflow-y-auto no-scrollbar">
              {filtered.map((co) => {
                const sel = co.code === value;
                return (
                  <li key={co.code}>
                    <button
                      onClick={() => { onChange(co.code); setOpen(false); setQ(""); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl ${sel ? "bg-brand-blue/10" : "hover:bg-secondary"}`}
                    >
                      <span className="text-3xl">{co.flag}</span>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-brand-navy text-sm">{co.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{co.code}</p>
                      </div>
                      {sel && <Check className="size-4 text-brand-blue"/>}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="text-center text-sm text-muted-foreground py-6">Aucun pays</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}