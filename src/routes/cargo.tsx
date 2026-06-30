import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";
import { createCargo, readCargoRecords, subscribeCargoRecords, type CargoPriority, type CargoTransport } from "@/lib/cargo";
import { ArrowLeft, Calendar, FileText, Image, PackagePlus, PackageSearch, Plane, Ship, Truck, Zap } from "lucide-react";
import logo from "@/assets/fret-continental-logo.png";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/cargo")({ component: CargoPage });

type FormState = {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  nature: string;
  weight: string;
  volume: string;
  packages: string;
  declaredValue: string;
  shippingDate: string;
  eta: string;
  carrier: string;
};

const emptyForm: FormState = {
  senderName: "",
  senderPhone: "",
  senderEmail: "",
  senderAddress: "",
  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
  nature: "",
  weight: "",
  volume: "",
  packages: "1",
  declaredValue: "",
  shippingDate: new Date().toISOString().slice(0, 10),
  eta: "",
  carrier: "",
};

function CargoPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [priority, setPriority] = useState<CargoPriority>("standard");
  const [transport, setTransport] = useState<CargoTransport>("truck");
  const [photos, setPhotos] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [records, setRecords] = useState(readCargoRecords());
  const latest = useMemo(() => records.slice(0, 3), [records]);

  useEffect(() => subscribeCargoRecords(() => setRecords(readCargoRecords())), []);

  const setF = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    const required = [
      form.senderName,
      form.senderPhone,
      form.senderEmail,
      form.senderAddress,
      form.receiverName,
      form.receiverPhone,
      form.receiverAddress,
      form.nature,
      form.weight,
      form.packages,
      form.shippingDate,
      form.eta,
    ];
    if (required.some((v) => !v.trim())) {
      toast.error("Complétez les informations obligatoires");
      return;
    }

    const cargo = createCargo({
      priority,
      sender: {
        name: form.senderName,
        phone: form.senderPhone,
        email: form.senderEmail,
        address: form.senderAddress,
      },
      receiver: {
        name: form.receiverName,
        phone: form.receiverPhone,
        address: form.receiverAddress,
      },
      goods: {
        nature: form.nature,
        weight: form.weight,
        volume: form.volume,
        packages: form.packages,
        declaredValue: form.declaredValue,
        photos,
        documents,
      },
      transport: {
        mode: transport,
        shippingDate: form.shippingDate,
        eta: form.eta,
        carrier: form.carrier,
      },
    });

    toast.success(`Cargo ${cargo.id} enregistré`);
    setForm(emptyForm);
    setPhotos([]);
    setDocuments([]);
  };

  return (
    <MobileFrame>
      <div className="min-h-screen bg-background pb-28">
        <div className="text-white px-5 pt-8 pb-6 rounded-b-[32px]" style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-white/80 mb-5">
            <ArrowLeft className="size-4"/> Retour
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-80">Fret Cargo</p>
              <h1 className="text-2xl font-black">Enregistrer un Cargo</h1>
              <p className="text-sm text-white/75 mt-1">Gros volumes, palettes, équipements et marchandises industrielles.</p>
            </div>
            <img src={logo} alt="Fret Continental" className="size-16 rounded-2xl bg-white object-contain p-1 shrink-0"/>
          </div>
        </div>

        <div className="px-5 mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Link to="/cargo-tracking" className="rounded-2xl bg-white border border-border p-3 flex items-center gap-2 text-xs font-black" style={{ color: "var(--yonnee-navy)" }}>
              <PackageSearch className="size-4"/> Suivi Cargo
            </Link>
            <Link to="/tracking" className="rounded-2xl bg-white border border-border p-3 flex items-center gap-2 text-xs font-black" style={{ color: "var(--yonnee-navy)" }}>
              <FileText className="size-4"/> Historique
            </Link>
          </div>

          <ServicePicker value={priority} onChange={setPriority}/>

          <Section title="Informations expéditeur">
            <Field label="Nom" value={form.senderName} onChange={(v) => setF("senderName", v)} required/>
            <Field label="Téléphone" value={form.senderPhone} onChange={(v) => setF("senderPhone", v)} required/>
            <Field label="Email" type="email" value={form.senderEmail} onChange={(v) => setF("senderEmail", v)} required/>
            <Field label="Adresse" value={form.senderAddress} onChange={(v) => setF("senderAddress", v)} required/>
          </Section>

          <Section title="Informations destinataire">
            <Field label="Nom" value={form.receiverName} onChange={(v) => setF("receiverName", v)} required/>
            <Field label="Téléphone" value={form.receiverPhone} onChange={(v) => setF("receiverPhone", v)} required/>
            <Field label="Adresse de livraison" value={form.receiverAddress} onChange={(v) => setF("receiverAddress", v)} required/>
          </Section>

          <Section title="Informations cargo">
            <Field label="Nature de la marchandise" value={form.nature} onChange={(v) => setF("nature", v)} required/>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Poids total" value={form.weight} onChange={(v) => setF("weight", v)} placeholder="ex. 250 kg" required/>
              <Field label="Volume" value={form.volume} onChange={(v) => setF("volume", v)} placeholder="ex. 3 m3"/>
              <Field label="Nombre de colis" type="number" value={form.packages} onChange={(v) => setF("packages", v)} required/>
              <Field label="Valeur déclarée" value={form.declaredValue} onChange={(v) => setF("declaredValue", v)} placeholder="ex. 500000 XOF"/>
            </div>
            <UploadField icon={<Image className="size-4"/>} label="Photos du cargo" files={photos} onChange={setPhotos}/>
            <UploadField icon={<FileText className="size-4"/>} label="Documents de transport" files={documents} onChange={setDocuments}/>
          </Section>

          <Section title="Informations transport">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Moyen de transport</p>
              <div className="grid grid-cols-3 gap-2">
                <TransportButton mode="truck" value={transport} onChange={setTransport} label="Camion" icon={Truck}/>
                <TransportButton mode="ship" value={transport} onChange={setTransport} label="Navire" icon={Ship}/>
                <TransportButton mode="plane" value={transport} onChange={setTransport} label="Avion" icon={Plane}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DateField label="Date d'expédition" value={form.shippingDate} onChange={(v) => setF("shippingDate", v)}/>
              <DateField label="Arrivée estimée" value={form.eta} onChange={(v) => setF("eta", v)}/>
            </div>
            <Field label="Transporteur affecté" value={form.carrier} onChange={(v) => setF("carrier", v)} placeholder="Optionnel"/>
          </Section>

          <button type="button" onClick={submit} className="w-full rounded-2xl text-white font-black py-4 shadow-lg flex items-center justify-center gap-2" style={{ background: "var(--yonnee-navy)" }}>
            <PackagePlus className="size-5"/> Enregistrer le cargo
          </button>

          {latest.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase text-muted-foreground">Derniers cargos</h2>
              {latest.map((cargo) => (
                <Link key={cargo.id} to="/cargo-tracking" search={{ q: cargo.id }} className="block bg-white border border-border rounded-2xl p-3">
                  <p className="font-black text-sm" style={{ color: "var(--yonnee-navy)" }}>{cargo.id}</p>
                  <p className="text-xs text-muted-foreground">{cargo.goods.nature} · {cargo.sender.name} → {cargo.receiver.name}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
        <BottomNav/>
      </div>
    </MobileFrame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-border rounded-2xl p-4 space-y-3">
      <h2 className="text-xs font-black uppercase text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase font-bold text-muted-foreground">{label}{required ? " *" : ""}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none"/>
    </label>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
      <Calendar className="size-4 text-muted-foreground"/>
      <span className="flex-1">
        <span className="block text-[10px] uppercase font-bold text-muted-foreground">{label}</span>
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none"/>
      </span>
    </label>
  );
}

function ServicePicker({ value, onChange }: { value: CargoPriority; onChange: (v: CargoPriority) => void }) {
  const services = [
    { id: "standard" as const, title: "Fret Standard", desc: "Économique, petits colis et marchandises légères." },
    { id: "express" as const, title: "Fret Express", desc: "Prioritaire pour colis urgents." },
    { id: "cargo" as const, title: "Fret Cargo", desc: "Service indépendant pour gros volumes." },
  ];
  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {services.map((service) => (
          <button key={service.id} type="button" onClick={() => onChange(service.id)} className={`rounded-2xl border p-3 text-left transition ${value === service.id ? "bg-white shadow-sm" : "bg-secondary text-muted-foreground"}`} style={value === service.id ? { borderColor: "var(--yonnee-orange)" } : undefined}>
            <span className="flex items-center gap-2 font-black text-sm" style={value === service.id ? { color: "var(--yonnee-navy)" } : undefined}>
              {service.id === "express" && <Zap className="size-4 text-orange-500"/>}
              {service.title}
            </span>
            <span className="block text-xs mt-0.5">{service.desc}</span>
          </button>
        ))}
      </div>
      <div className="rounded-2xl bg-white border border-border p-3 text-xs text-muted-foreground">
        <p><strong style={{ color: "var(--yonnee-navy)" }}>Fret Standard</strong> et <strong style={{ color: "var(--yonnee-navy)" }}>Fret Express</strong> couvrent les colis légers ou urgents.</p>
        <p className="mt-1"><strong style={{ color: "var(--yonnee-navy)" }}>Fret Cargo</strong> est un service indépendant pour conteneurs, palettes, équipements et gros volumes.</p>
      </div>
    </div>
  );
}

function TransportButton({ mode, value, onChange, label, icon: Icon }: {
  mode: CargoTransport; value: CargoTransport; onChange: (v: CargoTransport) => void; label: string; icon: typeof Truck;
}) {
  const active = mode === value;
  return (
    <button type="button" onClick={() => onChange(mode)} className={`rounded-xl border-2 py-2 text-xs font-bold flex flex-col items-center gap-1 ${active ? "text-white" : "bg-secondary text-muted-foreground border-border"}`} style={active ? { background: "var(--yonnee-navy)", borderColor: "var(--yonnee-navy)" } : undefined}>
      <Icon className="size-4"/> {label}
    </button>
  );
}

function UploadField({ label, files, onChange, icon }: { label: string; files: string[]; onChange: (v: string[]) => void; icon: React.ReactNode }) {
  return (
    <label className="relative block rounded-xl border-2 border-dashed border-border bg-secondary px-3 py-3 cursor-pointer overflow-hidden">
      <input type="file" multiple className="absolute inset-0 size-full opacity-0 cursor-pointer" onChange={(e) => onChange(Array.from(e.target.files ?? []).map((f) => f.name))}/>
      <span className="flex items-center justify-between gap-3 text-xs font-bold" style={{ color: "var(--yonnee-navy)" }}>
        <span className="inline-flex items-center gap-2">{icon}{label}</span>
        <span className="text-muted-foreground">+ Ajouter</span>
      </span>
      {files.length > 0 && <p className="text-[10px] text-muted-foreground mt-1 truncate">{files.join(", ")}</p>}
    </label>
  );
}
