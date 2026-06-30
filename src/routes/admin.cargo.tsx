import { createFileRoute, Link } from "@tanstack/react-router";
import { addCargoEvent, CARGO_STATUS_FLOW, CARGO_STATUS_LABEL, readCargoRecords, subscribeCargoRecords, updateCargo, type CargoRecord, type CargoStatus } from "@/lib/cargo";
import { CheckCircle2, ClipboardList, FileText, MapPin, PackagePlus, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cargo")({ component: AdminCargo });

function AdminCargo() {
  const [records, setRecords] = useState(readCargoRecords());
  const [selected, setSelected] = useState<CargoRecord | null>(records[0] ?? null);

  useEffect(() => subscribeCargoRecords(() => {
    const next = readCargoRecords();
    setRecords(next);
    setSelected((current) => next.find((cargo) => cargo.id === current?.id) ?? next[0] ?? null);
  }), []);

  return (
    <div className="px-5 py-4 space-y-4">
      <Link to="/cargo" className="w-full rounded-2xl p-3 text-white font-black flex items-center justify-center gap-2" style={{ background: "var(--yonnee-orange)" }}>
        <PackagePlus className="size-4"/> Créer un cargo
      </Link>

      <div className="grid grid-cols-3 gap-2">
        <Tile label="Cargos" value={records.length}/>
        <Tile label="En transit" value={records.filter((c) => c.events.at(-1)?.status === "in_transit").length}/>
        <Tile label="Livrés" value={records.filter((c) => c.events.at(-1)?.status === "delivered").length}/>
      </div>

      {records.length === 0 && (
        <div className="bg-white border border-border rounded-2xl p-8 text-center">
          <PackagePlus className="size-10 mx-auto text-muted-foreground"/>
          <p className="font-black mt-2" style={{ color: "var(--yonnee-navy)" }}>Aucun cargo enregistré</p>
          <p className="text-xs text-muted-foreground mt-1">Les cargos créés depuis Fret Cargo apparaîtront ici.</p>
        </div>
      )}

      {records.length > 0 && (
        <div className="grid gap-3">
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase text-muted-foreground">Gestion Cargo</h2>
            {records.map((cargo) => {
              const active = selected?.id === cargo.id;
              return (
                <button key={cargo.id} type="button" onClick={() => setSelected(cargo)} className={`w-full rounded-2xl p-3 text-left border transition ${active ? "bg-white shadow-sm" : "bg-white/70"}`} style={active ? { borderColor: "var(--yonnee-orange)" } : undefined}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-sm" style={{ color: "var(--yonnee-navy)" }}>{cargo.id}</p>
                      <p className="text-xs text-muted-foreground">{cargo.goods.nature} · {cargo.goods.weight}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase rounded-full bg-secondary px-2 py-1">{cargo.priority}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {selected && <AdminCargoEditor cargo={selected}/>}
        </div>
      )}
    </div>
  );
}

function AdminCargoEditor({ cargo }: { cargo: CargoRecord }) {
  const last = cargo.events.at(-1)?.status ?? "registered";
  const [status, setStatus] = useState<CargoStatus>(last);
  const [gps, setGps] = useState("");
  const [agent, setAgent] = useState("");
  const [comment, setComment] = useState("");
  const [carrier, setCarrier] = useState(cargo.transport.carrier);

  useEffect(() => {
    setStatus(cargo.events.at(-1)?.status ?? "registered");
    setCarrier(cargo.transport.carrier);
  }, [cargo.id]);

  const saveCarrier = () => {
    updateCargo(cargo.id, { transport: { ...cargo.transport, carrier } });
    toast.success("Transporteur affecté");
  };

  const pushStatus = () => {
    const now = new Date();
    addCargoEvent(cargo.id, {
      status,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      gps: gps || "Non renseigné",
      agent: agent || "Admin Yonnee",
      comment,
    });
    toast.success("Statut cargo mis à jour");
    setGps("");
    setAgent("");
    setComment("");
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-4 space-y-4">
      <div>
        <p className="text-[10px] uppercase font-bold text-muted-foreground">Cargo sélectionné</p>
        <h3 className="font-black text-lg" style={{ color: "var(--yonnee-navy)" }}>{cargo.id}</h3>
        <p className="text-xs text-muted-foreground">{cargo.sender.name} → {cargo.receiver.name}</p>
      </div>

      <div className="rounded-xl bg-secondary p-3">
        <p className="text-xs font-black mb-2" style={{ color: "var(--yonnee-navy)" }}>Affecter un transporteur</p>
        <div className="flex gap-2">
          <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Nom du transporteur" className="flex-1 rounded-xl bg-white px-3 py-2 text-sm outline-none"/>
          <button type="button" onClick={saveCarrier} className="rounded-xl px-3 text-white" style={{ background: "var(--yonnee-navy)" }}><Truck className="size-4"/></button>
        </div>
      </div>

      <div className="rounded-xl bg-secondary p-3">
        <p className="text-xs font-black mb-2 flex items-center gap-2" style={{ color: "var(--yonnee-navy)" }}><FileText className="size-4"/> Documents</p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Photos : {cargo.goods.photos.length ? cargo.goods.photos.join(", ") : "Aucune photo"}</p>
          <p>Transport : {cargo.goods.documents.length ? cargo.goods.documents.join(", ") : "Aucun document"}</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-black" style={{ color: "var(--yonnee-navy)" }}>Mettre à jour le statut</p>
        <select value={status} onChange={(e) => setStatus(e.target.value as CargoStatus)} className="w-full rounded-xl border border-border px-3 py-2 text-sm">
          {CARGO_STATUS_FLOW.map((s) => <option key={s} value={s}>{CARGO_STATUS_LABEL[s]}</option>)}
        </select>
        <Input icon={<MapPin className="size-4"/>} label="Position GPS" value={gps} onChange={setGps} placeholder="ex. Port de Dakar"/>
        <Input icon={<ClipboardList className="size-4"/>} label="Agent responsable" value={agent} onChange={setAgent}/>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Commentaire éventuel" rows={3} className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none resize-none"/>
        <button type="button" onClick={pushStatus} className="w-full rounded-2xl py-3 text-white font-black flex items-center justify-center gap-2" style={{ background: "var(--yonnee-orange)" }}>
          <CheckCircle2 className="size-4"/> Ajouter l'étape
        </button>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-3">
      <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
      <p className="text-xl font-black" style={{ color: "var(--yonnee-navy)" }}>{value}</p>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, icon }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">
        <span className="block text-[10px] uppercase font-bold text-muted-foreground">{label}</span>
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm outline-none"/>
      </span>
    </label>
  );
}
