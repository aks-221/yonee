export type CargoStatus =
  | "registered"
  | "validated"
  | "loaded"
  | "in_transit"
  | "arrived"
  | "customs"
  | "delivery"
  | "delivered";

export type CargoTransport = "truck" | "ship" | "plane";
export type CargoPriority = "standard" | "express" | "cargo";

export type CargoEvent = {
  status: CargoStatus;
  date: string;
  time: string;
  gps: string;
  agent: string;
  comment: string;
};

export type CargoRecord = {
  id: string;
  orderNumber: string;
  trackingCode: string;
  qrCode: string;
  priority: CargoPriority;
  sender: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  receiver: {
    name: string;
    phone: string;
    address: string;
  };
  goods: {
    nature: string;
    weight: string;
    volume: string;
    packages: string;
    declaredValue: string;
    photos: string[];
    documents: string[];
  };
  transport: {
    mode: CargoTransport;
    shippingDate: string;
    eta: string;
    carrier: string;
  };
  events: CargoEvent[];
  createdAt: string;
};

export const CARGO_STATUS_LABEL: Record<CargoStatus, string> = {
  registered: "Cargo enregistré",
  validated: "Cargo validé",
  loaded: "Cargo chargé",
  in_transit: "En transit",
  arrived: "Arrivé au port / aéroport",
  customs: "En cours de dédouanement",
  delivery: "En cours de livraison",
  delivered: "Livré",
};

export const CARGO_STATUS_FLOW: CargoStatus[] = [
  "registered",
  "validated",
  "loaded",
  "in_transit",
  "arrived",
  "customs",
  "delivery",
  "delivered",
];

const STORAGE_KEY = "yonnee.cargo.v1";
const CHANGE_EVENT = "yonnee:cargo-change";

function todayParts() {
  const now = new Date();
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
  };
}

export function generateCargoNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const code = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CRG-${stamp}-${code}`;
}

export function readCargoRecords(): CargoRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CargoRecord[];
  } catch {
    return [];
  }
}

export function writeCargoRecords(records: CargoRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function createCargo(input: Omit<CargoRecord, "id" | "orderNumber" | "trackingCode" | "qrCode" | "events" | "createdAt">) {
  const id = generateCargoNumber();
  const parts = todayParts();
  const cargo: CargoRecord = {
    ...input,
    id,
    orderNumber: `ORD-${id.replace("CRG-", "")}`,
    trackingCode: `TRK-${id.replace("CRG-", "")}`,
    qrCode: id,
    createdAt: new Date().toISOString(),
    events: [
      {
        status: "registered",
        date: parts.date,
        time: parts.time,
        gps: "Non renseigné",
        agent: "Système Yonnee",
        comment: "Cargo enregistré dans l'application.",
      },
    ],
  };
  writeCargoRecords([cargo, ...readCargoRecords()]);
  return cargo;
}

export function findCargo(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return readCargoRecords().find((cargo) =>
    [cargo.id, cargo.orderNumber, cargo.trackingCode, cargo.qrCode].some((v) => v.toLowerCase() === q)
  ) ?? null;
}

export function updateCargo(id: string, patch: Partial<CargoRecord>) {
  writeCargoRecords(readCargoRecords().map((cargo) => (cargo.id === id ? { ...cargo, ...patch } : cargo)));
}

export function addCargoEvent(id: string, event: CargoEvent) {
  writeCargoRecords(
    readCargoRecords().map((cargo) =>
      cargo.id === id ? { ...cargo, events: [...cargo.events, event] } : cargo
    )
  );
}

export function subscribeCargoRecords(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
}
