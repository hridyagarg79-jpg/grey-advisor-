"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin, SquareDashed, RotateCcw, ChevronRight, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPropertyImage } from "@/lib/images";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Property {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  area: string;
  city: string;
  type: string;
  status: string;
  bedrooms?: number;
  sqft?: number;
  lat?: number;
  lng?: number;
}

// ─── City centres ───────────────────────────────────────────────────────────
const CITY_BOUNDS: Record<string, { center: [number, number]; zoom: number }> = {
  Mumbai:      { center: [72.8777, 19.076],  zoom: 11 },
  Pune:        { center: [73.856,  18.5204], zoom: 11 },
  Bangalore:   { center: [77.5946, 12.9716], zoom: 11 },
  Hyderabad:   { center: [78.4867, 17.385],  zoom: 11 },
  "Delhi NCR": { center: [77.209,  28.6139], zoom: 10 },
};

// Deterministic (seeded) jitter
function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function assignCoords(props: Property[]): Property[] {
  const bases: Record<string, [number, number][]> = {
    Mumbai:      [[72.83, 19.12], [72.87, 19.07], [72.91, 18.98], [72.85, 19.05]],
    Pune:        [[73.81, 18.56], [73.88, 18.52], [73.92, 18.49], [73.84, 18.53]],
    Bangalore:   [[77.55, 12.99], [77.60, 12.97], [77.65, 12.93], [77.57, 12.96]],
    Hyderabad:   [[78.44, 17.42], [78.50, 17.37], [78.55, 17.35], [78.47, 17.39]],
    "Delhi NCR": [[77.18, 28.65], [77.25, 28.60], [77.32, 28.55], [77.21, 28.62]],
  };
  return props.map((p, i) => {
    const pool = bases[p.city] ?? bases["Mumbai"];
    const [lng, lat] = pool[i % pool.length];
    return {
      ...p,
      lng: lng + (seededRand(i * 13) - 0.5) * 0.05,
      lat: lat + (seededRand(i * 17) - 0.5) * 0.05,
    };
  });
}

// Ray-casting point-in-polygon
function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ─── Component ──────────────────────────────────────────────────────────────
function MapSearchInner() {
  const searchParams = useSearchParams();

  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const markersRef = useRef<unknown[]>([]);
  const drawPolygonPoints = useRef<[number, number][]>([]);
  const tempLineSource = useRef<string | null>(null);
  const isInitialized = useRef(false);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProps, setFilteredProps] = useState<Property[]>([]);
  const [polygon, setPolygon] = useState<[number, number][] | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Read URL params ──────────────────────────────────────────────────────
  const urlCity = searchParams.get("city") ?? "";
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  const urlBedrooms = searchParams.get("bedrooms");
  const urlBudget = searchParams.get("budget");
  const urlAreaKeyword = searchParams.get("areaKeyword");

  // Resolve initial city: try exact match, then title-case match, else default
  function resolveCity(raw: string): string {
    if (!raw) return "Mumbai";
    const found = Object.keys(CITY_BOUNDS).find(
      (c) => c.toLowerCase() === raw.toLowerCase()
    );
    return found ?? "Mumbai";
  }
  const [selectedCity, setSelectedCity] = useState(() => resolveCity(urlCity));

  // ── Fetch properties ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Build API query params from URL filters
        const params = new URLSearchParams({ limit: "100" });
        if (urlCity) params.set("city", resolveCity(urlCity));
        if (urlBedrooms) params.set("bedrooms", urlBedrooms);
        if (urlBudget) params.set("budget", urlBudget);
        if (urlAreaKeyword) params.set("areaKeyword", urlAreaKeyword);

        const res = await fetch(`/api/properties?${params.toString()}`);
        if (!res.ok) throw new Error("fail");
        const data = await res.json();
        const withCoords = assignCoords(data.properties ?? []);
        setAllProperties(withCoords);
        setFilteredProps(withCoords);
        
        // If city param present, use it
        if (urlCity) setSelectedCity(resolveCity(urlCity));
      } catch {
        // show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Init MapLibre GL ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialized.current) return;

    // Wait for container to be in the DOM
    const initMap = () => {
      if (!mapContainer.current) return;
      isInitialized.current = true;

      import("maplibre-gl").then((ml) => {
        if (!mapContainer.current) return;

        const initialCity = resolveCity(urlCity);
        const { center, zoom } = CITY_BOUNDS[initialCity];

        const map = new ml.default.Map({
          container: mapContainer.current,
          style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
          center: urlLng && urlLat
            ? [parseFloat(urlLng), parseFloat(urlLat)]
            : center,
          zoom: urlLng && urlLat ? 14 : zoom,
          // attributionControl defaults to enabled — no need to set
        });

        map.addControl(new ml.default.NavigationControl({ showCompass: false }), "bottom-right");

        map.on("load", () => {
          // ── Force English map labels ────────────────────────────────────
          const style = map.getStyle();
          if (style?.layers) {
            style.layers.forEach((layer) => {
              if (
                layer.type === "symbol" &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (layer as any).layout?.["text-field"] !== undefined
              ) {
                try {
                  map.setLayoutProperty(
                    layer.id,
                    "text-field",
                    ["coalesce", ["get", "name_en"], ["get", "name"]]
                  );
                } catch {
                  // Some layers may not support this — ignore
                }
              }
            });
          }

          setMapLoaded(true);

          // Add polygon draw source + layers
          map.addSource("draw-poly", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
          map.addLayer({
            id: "draw-poly-fill",
            type: "fill",
            source: "draw-poly",
            paint: { "fill-color": "#B45309", "fill-opacity": 0.12 },
          });
          map.addLayer({
            id: "draw-poly-line",
            type: "line",
            source: "draw-poly",
            paint: { "line-color": "#B45309", "line-width": 2, "line-dasharray": [4, 2] },
          });
        });

        map.on("error", (e) => {
          console.warn("MapLibre error:", e.error?.message ?? e);
        });

        mapRef.current = map;
      });
    };

    // Small RAF delay ensures the container div is painted
    const raf = requestAnimationFrame(initMap);

    return () => {
      cancelAnimationFrame(raf);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        isInitialized.current = false;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fly to city ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const { center, zoom } = CITY_BOUNDS[selectedCity];
    mapRef.current.flyTo({ center, zoom, duration: 1400 });
  }, [selectedCity, mapLoaded]);

  // ── Place markers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    import("maplibre-gl").then((ml) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (markersRef.current as any[]).forEach((m: any) => m.remove());
      markersRef.current = [];

      allProperties.forEach((prop) => {
        if (prop.lat == null || prop.lng == null) return;
        const el = document.createElement("div");
        el.className = "map-marker";
        el.innerHTML = `<div class="marker-pin">₹${prop.priceLabel}</div>`;

        const popup = new ml.default.Popup({ offset: 25, closeButton: false }).setHTML(`
          <div style="font-family:system-ui;padding:4px;min-width:140px">
            <p style="font-weight:700;font-size:13px;margin:0 0 2px">${prop.name}</p>
            <p style="font-size:11px;color:#78716c;margin:0">${prop.area}, ${prop.city}</p>
            <p style="font-weight:700;font-size:12px;color:#B45309;margin:4px 0 0">₹${prop.priceLabel}</p>
          </div>
        `);

        const marker = new ml.default.Marker({ element: el, anchor: "bottom" })
          .setLngLat([prop.lng!, prop.lat!])
          .setPopup(popup)
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      });
    });
  }, [allProperties, mapLoaded]);

  // ── Draw polygon ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    function onClick(e: { lngLat: { lng: number; lat: number } }) {
      if (!drawMode) return;
      const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      drawPolygonPoints.current.push(pt);
      updateDrawLayer(drawPolygonPoints.current, false);
    }

    function onDblClick(e: { lngLat: { lng: number; lat: number }; preventDefault: () => void }) {
      if (!drawMode) return;
      e.preventDefault();
      const pts = drawPolygonPoints.current;
      if (pts.length >= 3) {
        const closed = [...pts, pts[0]];
        updateDrawLayer(closed, true);
        setPolygon(pts);
        setDrawMode(false);
      }
    }

    map.on("click", onClick);
    map.on("dblclick", onDblClick);

    return () => { map.off("click", onClick); map.off("dblclick", onDblClick); };
  }, [mapLoaded, drawMode]);

  function updateDrawLayer(pts: [number, number][], closed: boolean) {
    const map = mapRef.current;
    if (!map || !map.getSource("draw-poly")) return;

    const feature = closed
      ? { type: "Feature" as const, geometry: { type: "Polygon" as const, coordinates: [pts] }, properties: {} }
      : { type: "Feature" as const, geometry: { type: "LineString" as const, coordinates: pts }, properties: {} };

    (map.getSource("draw-poly") as { setData: (d: unknown) => void }).setData({
      type: "FeatureCollection",
      features: [feature],
    });
    tempLineSource.current = "active";
  }

  // ── Filter by polygon ────────────────────────────────────────────────────
  useEffect(() => {
    if (!polygon) { setFilteredProps(allProperties); return; }
    const inside = allProperties.filter(
      (p) => p.lat != null && p.lng != null && pointInPolygon([p.lng!, p.lat!], polygon)
    );
    setFilteredProps(inside);
  }, [polygon, allProperties]);

  // ── Draw mode start ──────────────────────────────────────────────────────
  const startDraw = useCallback(() => {
    drawPolygonPoints.current = [];
    if (mapRef.current?.getSource("draw-poly")) {
      (mapRef.current.getSource("draw-poly") as { setData: (d: unknown) => void }).setData({
        type: "FeatureCollection", features: [],
      });
    }
    setPolygon(null);
    setFilteredProps(allProperties);
    setDrawMode(true);
  }, [allProperties]);

  const clearDraw = useCallback(() => {
    drawPolygonPoints.current = [];
    if (mapRef.current?.getSource("draw-poly")) {
      (mapRef.current.getSource("draw-poly") as { setData: (d: unknown) => void }).setData({
        type: "FeatureCollection", features: [],
      });
    }
    setPolygon(null);
    setFilteredProps(allProperties);
    setDrawMode(false);
  }, [allProperties]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Marker + MapLibre styles */}
      <style>{`
        .map-marker { cursor: pointer; }
        .marker-pin {
          background: #B45309;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 20px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(180,83,9,0.35);
          transition: transform 0.15s;
        }
        .marker-pin:hover { transform: scale(1.1); }
        .maplibregl-popup-content { border-radius: 12px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important; padding: 12px !important; }
        .maplibregl-ctrl-group { border-radius: 12px !important; }
        .maplibregl-ctrl-logo { display: none !important; }
        .maplibregl-map { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .maplibregl-canvas { width: 100% !important; height: 100% !important; }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col overflow-hidden z-10 shadow-md">
        <div className="p-5 border-b border-stone-100">
          <p className="text-xs font-semibold tracking-widest text-amber-700 uppercase mb-1">Map Search</p>
          <h1 className="text-xl font-bold text-stone-900 mb-3">Find by Location</h1>
          {/* URL query indicator */}
          {searchParams.get("q") && (
            <div className="mb-3 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 font-medium truncate">
                🔍 {decodeURIComponent(searchParams.get("q")!)}
              </p>
            </div>
          )}
          <div className="flex gap-1 flex-wrap">
            {Object.keys(CITY_BOUNDS).map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                  selectedCity === city
                    ? "bg-amber-700 text-white border-amber-700"
                    : "border-stone-200 text-stone-600 hover:border-amber-300"
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Draw controls */}
        <div className="p-4 border-b border-stone-100 flex gap-2">
          <button
            onClick={startDraw}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border",
              drawMode || polygon
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-amber-700 text-white border-amber-700 hover:bg-amber-800"
            )}
          >
            <SquareDashed size={15} />
            {polygon ? "Redraw Boundary" : drawMode ? "Click map to add points…" : "Draw Boundary"}
          </button>
          {(drawMode || polygon) && (
            <button
              onClick={clearDraw}
              className="w-10 h-10 rounded-xl border border-stone-200 flex items-center justify-center text-stone-500 hover:text-red-500 hover:border-red-200 transition-all"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>

        {polygon && (
          <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
            <Layers size={13} className="text-amber-700 flex-shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              {filteredProps.length} properties in your boundary
            </p>
          </div>
        )}

        {/* Property list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl shimmer" />)
          ) : filteredProps.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <MapPin size={18} className="text-stone-400" />
              </div>
              <p className="text-sm text-stone-500">No properties found.</p>
              <p className="text-xs text-stone-400 mt-1">Try a different city or draw a larger boundary.</p>
            </div>
          ) : (
            filteredProps.slice(0, 20).map((prop, i) => (
              <div
                key={prop.id}
                className="bg-stone-50 rounded-xl p-3 hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-all cursor-pointer group"
                onClick={() => {
                  if (mapRef.current && prop.lat && prop.lng) {
                    mapRef.current.flyTo({ center: [prop.lng, prop.lat], zoom: 14, duration: 800 });
                  }
                }}
              >
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-stone-200">
                    <img src={getPropertyImage(prop.city, prop.type, i)} alt={prop.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900 line-clamp-1">{prop.name}</p>
                    <p className="text-[10px] text-stone-500 flex items-center gap-0.5 mt-0.5">
                      <MapPin size={9} /> {prop.area}, {prop.city}
                    </p>
                    <p className="text-xs font-bold text-amber-700 mt-1">₹{prop.priceLabel}</p>
                  </div>
                  <Link
                    href={`/property/${prop.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-stone-400 group-hover:text-amber-700 border border-stone-200 group-hover:border-amber-300 transition-all flex-shrink-0"
                  >
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-stone-100 text-center">
          <p className="text-[10px] text-stone-400">
            Click <strong>Draw Boundary</strong>, then click on the map to place vertices. Double-click to finish.
          </p>
        </div>
      </aside>

      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative" style={{ minHeight: 0, height: "100%" }}>
        <div ref={mapContainer} style={{ width: "100%", height: "100%", minHeight: "400px" }} />

        {!mapLoaded && (
          <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full border-2 border-amber-700 border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-sm text-stone-500">Loading map…</p>
            </div>
          </div>
        )}

        {drawMode && !polygon && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-stone-900/90 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg backdrop-blur flex items-center gap-2 animate-pulse">
            <SquareDashed size={13} />
            Click to add points · Double-click to complete polygon
          </div>
        )}

        {polygon && (
          <div className="absolute top-4 right-4 bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
            {filteredProps.length} in boundary
          </div>
        )}
      </div>
    </div>
  );
}

export default function MapSearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-amber-700 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-500">Loading map…</p>
        </div>
      </div>
    }>
      <MapSearchInner />
    </Suspense>
  );
}
