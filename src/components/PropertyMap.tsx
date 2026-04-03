"use client";
import { useEffect, useRef, useState } from "react";

interface PropertyMapProps {
  lat: number;
  lng: number;
  label?: string;
  height?: number;
  zoom?: number;
}

export default function PropertyMap({
  lat,
  lng,
  label,
  height = 140,
  zoom = 14,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) { setError(true); return; }

    let map: {
      remove: () => void;
    } | null = null;

    import("maplibre-gl")
      .then((ml) => {
        const maplibre = ml.default ?? ml;
        map = new (maplibre as unknown as {
          Map: new (opts: unknown) => { remove: () => void };
        }).Map({
          container: mapRef.current!,
          style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
          center: [lng, lat],
          zoom,
          interactive: false,
          attributionControl: false,
        });

        // Marker
        const el = document.createElement("div");
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
          background: #8b5cf6; border: 2px solid #fff;
          transform: rotate(-45deg); box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        `;

        new (maplibre as unknown as {
          Marker: new (el: HTMLElement) => { setLngLat: (c: [number, number]) => { addTo: (m: unknown) => void } };
        }).Marker(el).setLngLat([lng, lat]).addTo(map as unknown as object);

        mapInstance.current = map;
        setLoaded(true);
      })
      .catch(() => setError(true));

    return () => {
      if (map) { map.remove(); mapInstance.current = null; }
    };
  }, [lat, lng, zoom]);

  if (error) return null;

  return (
    <div style={{ position: "relative", height, borderRadius: 12, overflow: "hidden" }}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, color: "#a5b4fc", fontSize: 13,
        }}>
          <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
          Loading map…
        </div>
      )}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      {label && loaded && (
        <div style={{
          position: "absolute", bottom: 8, left: 8,
          background: "rgba(0,0,0,0.72)", color: "#fff",
          padding: "3px 8px", borderRadius: 6, fontSize: 11,
          backdropFilter: "blur(4px)", maxWidth: "80%",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          📍 {label}
        </div>
      )}
    </div>
  );
}
