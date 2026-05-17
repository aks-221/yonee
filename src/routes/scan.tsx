import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";
import { QrCode, Loader2, CheckCircle2, X, ArrowRight, Package } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useUserRoles } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/scan")({ component: ScanPage });

type ReservationResult = {
  id: string; code: string; status: string;
  sender_name: string | null; receiver_name: string | null;
  from_city: string | null; to_city: string | null;
  weight_kg: number; amount: number; currency: string;
};

function ScanPage() {
  const nav = useNavigate();
  const { user, loading: sl } = useSession();
  const { roles } = useUserRoles();
  const isGP = roles.includes("gp_standard") || roles.includes("gp_express") || roles.includes("admin");

  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReservationResult | null>(null);
  const [action, setAction] = useState<"picked_up" | "delivered" | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // Démarrer la caméra
  useEffect(() => {
    if (mode !== "scan") { stopCamera(); return; }
    startCamera();
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setCameraError(true);
      setMode("manual");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  const lookup = async (qrCode: string) => {
    const val = qrCode.trim().toUpperCase();
    if (!val) { toast.error("Code vide"); return; }
    setLoading(true);
    setResult(null);

    // Chercher par code ou qr_payload
    const { data, error } = await supabase
      .from("reservations")
      .select("id,code,status,sender_name,receiver_name,from_city,to_city,weight_kg,amount,currency")
      .or(`code.eq.${val},qr_payload.eq.${val}`)
      .maybeSingle();

    setLoading(false);
    if (error || !data) { toast.error("Réservation introuvable"); return; }
    setResult(data as ReservationResult);

    // Déterminer l'action possible pour le GP
    if (isGP) {
      if (data.status === "paid" || data.status === "accepted") setAction("picked_up");
      else if (data.status === "in_transit" || data.status === "arrived") setAction("delivered");
      else setAction(null);
    }
  };

  const advance = async () => {
    if (!result || !action) return;
    setLoading(true);
    const { error } = await supabase.rpc("gp_advance_reservation", {
      _reservation_code: result.code,
      _action: action,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(action === "picked_up" ? "Colis pris en charge ✅" : "Livraison confirmée 🎉");
    nav({ to: "/tracking/$reservationId", params: { reservationId: result.id } });
  };

  return (
    <MobileFrame>
      <div className="min-h-screen pb-28 bg-background">
        {/* Header */}
        <div className="text-white px-5 pt-10 pb-6 rounded-b-3xl"
          style={{ background: "linear-gradient(135deg, var(--yonnee-navy), var(--yonnee-sky))" }}>
          <h1 className="text-2xl font-black">Scanner QR</h1>
          <p className="text-sm text-white/70 mt-0.5">
            {isGP ? "Confirmez la prise en charge ou livraison" : "Vérifiez le statut de votre colis"}
          </p>
          {/* Toggle scan/manuel */}
          <div className="flex gap-2 mt-4 bg-white/15 rounded-xl p-1">
            <button onClick={() => setMode("scan")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mode === "scan" ? "bg-white" : "text-white/70"}`}
              style={mode === "scan" ? { color: "var(--yonnee-navy)" } : undefined}>
              📷 Caméra
            </button>
            <button onClick={() => setMode("manual")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mode === "manual" ? "bg-white" : "text-white/70"}`}
              style={mode === "manual" ? { color: "var(--yonnee-navy)" } : undefined}>
              ⌨️ Code manuel
            </button>
          </div>
        </div>

        <div className="px-5 mt-4 space-y-4">
          {/* Viewfinder caméra */}
          {mode === "scan" && (
            <div className="bg-black rounded-3xl overflow-hidden relative" style={{ height: 260 }}>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted/>
              {/* Viseur */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-40 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"/>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"/>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"/>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"/>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-white/50 animate-pulse"/>
                  </div>
                </div>
              </div>
              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <Loader2 className="size-8 animate-spin text-white"/>
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 p-4 text-center">
                  <QrCode className="size-10 text-white/50"/>
                  <p className="text-white text-sm">Caméra indisponible</p>
                  <button onClick={() => setMode("manual")} className="text-white underline text-xs">Saisir le code manuellement</button>
                </div>
              )}
            </div>
          )}

          {/* Saisie manuelle */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">
              {mode === "scan" ? "Ou saisir le code" : "Code de réservation"}
            </p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && lookup(code)}
                placeholder="GPE-XXXXX"
                className="flex-1 bg-secondary rounded-xl px-3 py-3 text-sm font-mono outline-none uppercase tracking-widest"/>
              <button onClick={() => lookup(code)} disabled={loading}
                className="size-12 rounded-xl text-white grid place-items-center disabled:opacity-50"
                style={{ background: "var(--yonnee-navy)" }}>
                {loading ? <Loader2 className="size-4 animate-spin"/> : <ArrowRight className="size-4"/>}
              </button>
            </div>
          </div>

          {/* Résultat */}
          {result && (
            <div className="bg-white rounded-2xl p-4 border-2 shadow-sm space-y-3"
              style={{ borderColor: "var(--yonnee-navy)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground">{result.code}</p>
                  <p className="font-black text-lg" style={{ color: "var(--yonnee-navy)" }}>
                    {result.from_city} → {result.to_city}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {result.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-muted-foreground">Expéditeur</p>
                  <p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>{result.sender_name ?? "—"}</p>
                </div>
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-muted-foreground">Destinataire</p>
                  <p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>{result.receiver_name ?? "—"}</p>
                </div>
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-muted-foreground">Poids</p>
                  <p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>{result.weight_kg} kg</p>
                </div>
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-muted-foreground">Montant</p>
                  <p className="font-bold" style={{ color: "var(--yonnee-navy)" }}>{Number(result.amount).toLocaleString()} {result.currency}</p>
                </div>
              </div>

              {/* Actions GP */}
              {isGP && action && (
                <button onClick={advance} disabled={loading}
                  className="w-full rounded-xl text-white font-bold py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: action === "delivered" ? "#16A34A" : "var(--yonnee-orange)" }}>
                  {loading ? <Loader2 className="size-4 animate-spin"/> : <CheckCircle2 className="size-4"/>}
                  {action === "picked_up" ? "Confirmer prise en charge" : "Confirmer livraison"}
                </button>
              )}
              {isGP && !action && (
                <div className="rounded-xl bg-secondary p-3 text-center text-sm text-muted-foreground">
                  Aucune action disponible pour ce statut
                </div>
              )}
              {!isGP && (
                <button onClick={() => nav({ to: "/tracking/$reservationId", params: { reservationId: result.id } })}
                  className="w-full rounded-xl text-white font-bold py-3 flex items-center justify-center gap-2"
                  style={{ background: "var(--yonnee-navy)" }}>
                  <Package className="size-4"/> Voir le suivi complet
                </button>
              )}
            </div>
          )}

          {/* Raccourcis récents si GP */}
          {isGP && !result && (
            <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Comment ça marche</p>
              <ol className="space-y-2 text-sm text-muted-foreground list-none">
                <li className="flex items-start gap-2"><span className="size-5 rounded-full bg-secondary text-center text-xs font-bold leading-5 flex-shrink-0" style={{ color: "var(--yonnee-navy)" }}>1</span>Le client vous montre son QR code ou son code de réservation</li>
                <li className="flex items-start gap-2"><span className="size-5 rounded-full bg-secondary text-center text-xs font-bold leading-5 flex-shrink-0" style={{ color: "var(--yonnee-navy)" }}>2</span>Scannez ou saisissez le code pour vérifier</li>
                <li className="flex items-start gap-2"><span className="size-5 rounded-full bg-secondary text-center text-xs font-bold leading-5 flex-shrink-0" style={{ color: "var(--yonnee-navy)" }}>3</span>Confirmez la prise en charge, puis la livraison</li>
              </ol>
            </div>
          )}
        </div>

        <BottomNav/>
      </div>
    </MobileFrame>
  );
}