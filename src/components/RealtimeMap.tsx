import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MapPoint = { lat: number; lng: number; label?: string };

/**
 * Realtime tracking map.
 * - Subscribes to public.gp_locations filtered by reservation_id.
 * - Renders the GP marker, the planned route (from -> to) and an animated
 *   live position. Loads Leaflet only on the client to avoid SSR issues.
 */
export function RealtimeMap({
  from, to, reservationId, gpId,
}: {
  from: MapPoint; to: MapPoint; reservationId: string; gpId: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<MapPoint | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const mapApi = useRef<{ map: any; marker: any; L: any } | null>(null);

  // Load Leaflet only client-side
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false })
        .setView([(from.lat + to.lat) / 2, (from.lng + to.lng) / 2], 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      const fromIcon = L.divIcon({ className: "", html: `<div style="background:#0d7a5f;color:#fff;border-radius:9999px;padding:4px 8px;font-size:10px;font-weight:700;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.2)">A</div>` });
      const toIcon = L.divIcon({ className: "", html: `<div style="background:#e85d3a;color:#fff;border-radius:9999px;padding:4px 8px;font-size:10px;font-weight:700;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.2)">B</div>` });
      L.marker([from.lat, from.lng], { icon: fromIcon }).addTo(map);
      L.marker([to.lat, to.lng], { icon: toIcon }).addTo(map);
      L.polyline([[from.lat, from.lng], [to.lat, to.lng]], { color: "#1e3a5f", weight: 2, dashArray: "6,8", opacity: 0.6 }).addTo(map);
      const liveIcon = L.divIcon({ className: "", html: `<div style="position:relative;width:24px;height:24px"><div style="position:absolute;inset:0;background:#f59e0b;border-radius:9999px;border:3px solid white;box-shadow:0 4px 14px rgba(245,158,11,.6)"></div></div>` });
      const marker = L.marker([from.lat, from.lng], { icon: liveIcon, opacity: 0 }).addTo(map);
      mapApi.current = { map, marker, L };
    })();
    return () => { cancelled = true; mapApi.current?.map?.remove(); mapApi.current = null; };
  }, [from.lat, from.lng, to.lat, to.lng]);

  // Initial fetch + realtime subscription on gp_locations
  useEffect(() => {
    let active = true;
    supabase
      .from("gp_locations")
      .select("lat,lng,recorded_at")
      .eq("reservation_id", reservationId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) { setPos({ lat: data.lat, lng: data.lng }); setUpdatedAt(data.recorded_at); }
      });

    const ch = supabase
      .channel(`rt-loc-${reservationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gp_locations", filter: `reservation_id=eq.${reservationId}` },
        (payload) => {
          const row = payload.new as { lat: number; lng: number; recorded_at: string };
          setPos({ lat: row.lat, lng: row.lng });
          setUpdatedAt(row.recorded_at);
        })
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [reservationId]);

  // Update marker when pos changes
  useEffect(() => {
    if (!pos || !mapApi.current) return;
    const { marker, map } = mapApi.current;
    marker.setLatLng([pos.lat, pos.lng]);
    marker.setOpacity(1);
    map.panTo([pos.lat, pos.lng], { animate: true });
  }, [pos]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full h-[320px] rounded-2xl overflow-hidden border border-border bg-secondary"/>
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-bold pointer-events-none">
        <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[var(--yonnee-navy,#1e3a5f)]">
          {pos ? "🟢 Position en direct" : "⚪ En attente position"}
        </span>
        {updatedAt && <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-full">{new Date(updatedAt).toLocaleTimeString("fr-FR")}</span>}
      </div>
    </div>
  );
}

/** Hook used by GP screens to push the device location every 15s while a reservation is active. */
export function useShareLocation(opts: { gpId: string; reservationId: string; enabled: boolean }) {
  const { gpId, reservationId, enabled } = opts;
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;
    let stopped = false;
    const push = (lat: number, lng: number) => {
      if (stopped) return;
      supabase.from("gp_locations").insert({ gp_id: gpId, reservation_id: reservationId, lat, lng });
    };
    const tick = () => navigator.geolocation.getCurrentPosition(
      (p) => push(p.coords.latitude, p.coords.longitude),
      () => {}, { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
    );
    tick();
    const id = setInterval(tick, 15000);
    return () => { stopped = true; clearInterval(id); };
  }, [gpId, reservationId, enabled]);
}