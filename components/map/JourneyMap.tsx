"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Journey } from "@/types/models";
import { calculateRouteSplit } from "@/lib/geo/route";
import {
  createTrainMarkerElement,
  animateMarker,
} from "@/lib/geo/markerAnimator";
import { MapControls } from "./MapControls";
import { useUIStore } from "@/store/ui";
import { formatTime } from "@/lib/format/time";

interface JourneyMapProps {
  journey: Journey;
  className?: string;
  onStationClick?: (stationCode: string) => void;
  padding?: { top: number; bottom: number; left: number; right: number };
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

function getMapStyleUrl(style: "light" | "dark" | "terrain") {
  const base = "https://api.maptiler.com/maps";
  if (style === "dark") return `${base}/dataviz-dark/style.json?key=${MAPTILER_KEY}`;
  if (style === "terrain") return `${base}/outdoor-v2/style.json?key=${MAPTILER_KEY}`;
  return `${base}/streets-v2/style.json?key=${MAPTILER_KEY}`;
}

export default function JourneyMap({
  journey,
  className = "",
  onStationClick,
  padding = { top: 40, bottom: 40, left: 40, right: 40 },
}: JourneyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const markerIconRef = useRef<HTMLDivElement | null>(null);
  const cancelAnimationRef = useRef<(() => void) | null>(null);
  const currentPosRef = useRef<[number, number]>([0, 0]);
  const currentBearingRef = useRef<number>(0);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const {
    mapStyle,
    setMapStyle,
    followTrain,
    setFollowTrain,
    myStation,
    setMyStation,
  } = useUIStore();

  // Compute Turf route splits
  const splitRoute = useMemo(() => {
    return calculateRouteSplit(journey.routeCoords, journey.position);
  }, [journey.routeCoords, journey.position]);

  // Fit bounds to full route
  const fitRouteBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map || journey.routeCoords.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    for (const coord of journey.routeCoords) {
      bounds.extend(coord);
    }

    map.fitBounds(bounds, {
      padding,
      maxZoom: 14,
      duration: 1200,
    });
  }, [journey.routeCoords, padding]);

  // Add or update GeoJSON layers
  const updateMapLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const emptyLine: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
      type: "FeatureCollection",
      features: [],
    };

    // 1. Remaining route
    const remainingGeoJSON: GeoJSON.FeatureCollection<GeoJSON.LineString> =
      splitRoute?.remaining
        ? {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: splitRoute.remaining,
              },
            ],
          }
        : emptyLine;

    // 2. Completed route
    const completedGeoJSON: GeoJSON.FeatureCollection<GeoJSON.LineString> =
      splitRoute?.completed
        ? {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: splitRoute.completed,
              },
            ],
          }
        : emptyLine;

    // 3. Stations GeoJSON
    const stationsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features: journey.stops
        .filter((s) => s.station.lat != null && s.station.lng != null)
        .map((s) => ({
          type: "Feature",
          properties: {
            code: s.station.code,
            name: s.station.name,
            isHalt: s.isHalt,
            isCurrent: s.station.code === journey.currentStop,
            status: s.status,
            schArr: s.schArr ? formatTime(s.schArr) : "--",
            schDep: s.schDep ? formatTime(s.schDep) : "--",
            expArr: s.expArr ? formatTime(s.expArr) : "--",
            expDep: s.expDep ? formatTime(s.expDep) : "--",
            delayMin: s.delayMin ?? 0,
            platform: s.platform ?? null,
          },
          geometry: {
            type: "Point",
            coordinates: [s.station.lng!, s.station.lat!],
          },
        })),
    };

    // Update remaining source
    const remSource = map.getSource("route-remaining") as maplibregl.GeoJSONSource;
    if (remSource) {
      remSource.setData(remainingGeoJSON);
    } else {
      map.addSource("route-remaining", {
        type: "geojson",
        data: remainingGeoJSON,
      });
      map.addLayer({
        id: "route-remaining-layer",
        type: "line",
        source: "route-remaining",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": mapStyle === "dark" ? "#64748B" : "#94A3B8",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            2.5,
            12,
            4.5,
          ],
          "line-dasharray": [3, 2.5],
        },
      });
    }

    // Update completed source (glow + line)
    const compSource = map.getSource("route-completed") as maplibregl.GeoJSONSource;
    if (compSource) {
      compSource.setData(completedGeoJSON);
    } else {
      map.addSource("route-completed", {
        type: "geojson",
        data: completedGeoJSON,
      });

      // Glow layer
      map.addLayer({
        id: "route-glow-layer",
        type: "line",
        source: "route-completed",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "rgba(26, 111, 232, 0.35)",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            7,
            12,
            14,
          ],
          "line-blur": 5,
        },
      });

      // Completed solid line
      map.addLayer({
        id: "route-completed-layer",
        type: "line",
        source: "route-completed",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#1A6FE8",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            3.5,
            12,
            5.5,
          ],
        },
      });
    }

    // Update stations source
    const stnSource = map.getSource("stations-source") as maplibregl.GeoJSONSource;
    if (stnSource) {
      stnSource.setData(stationsGeoJSON);
    } else {
      map.addSource("stations-source", {
        type: "geojson",
        data: stationsGeoJSON,
      });

      // Non-halt stations (small dots, zoom >= 8)
      map.addLayer({
        id: "stations-non-halt",
        type: "circle",
        source: "stations-source",
        minzoom: 8,
        filter: ["==", ["get", "isHalt"], false],
        paint: {
          "circle-radius": 3,
          "circle-color": "#FFFFFF",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#1A6FE8",
        },
      });

      // Halt stations (zoom >= 5)
      map.addLayer({
        id: "stations-halt",
        type: "circle",
        source: "stations-source",
        minzoom: 5,
        filter: ["all", ["==", ["get", "isHalt"], true], ["!=", ["get", "isCurrent"], true]],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            4,
            10,
            6,
          ],
          "circle-color": "#FFFFFF",
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#1A6FE8",
        },
      });

      // Current station dot (prominent amber/gold)
      map.addLayer({
        id: "stations-current",
        type: "circle",
        source: "stations-source",
        filter: ["==", ["get", "isCurrent"], true],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            7,
            10,
            9,
          ],
          "circle-color": "#FBBF24",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#92400E",
        },
      });

      // Station Labels (zoom >= 7)
      map.addLayer({
        id: "stations-label",
        type: "symbol",
        source: "stations-source",
        minzoom: 7,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-optional": true,
        },
        paint: {
          "text-color": mapStyle === "dark" ? "#F1F5F9" : "#1E293B",
          "text-halo-color": mapStyle === "dark" ? "#0F172A" : "#FFFFFF",
          "text-halo-width": 1.5,
        },
      });
    }
  }, [journey.stops, journey.currentStop, splitRoute, mapStyle]);

  // Click on station handlers
  const handleStationClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      const map = mapRef.current;
      if (!map) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["stations-halt", "stations-current", "stations-non-halt"],
      });

      if (!features || features.length === 0) return;

      const feat = features[0];
      const props = feat.properties;
      const geom = feat.geometry as GeoJSON.Point;
      if (!props || !geom) return;

      if (onStationClick) {
        onStationClick(props.code);
      }

      if (popupRef.current) popupRef.current.remove();

      const isMyStn = myStation === props.code;

      const popupHtml = `
        <div style="font-family: inherit; min-width: 180px; padding: 4px;">
          <div style="font-size: 13px; font-weight: 800; color: #0F172A;">${props.name}</div>
          <div style="font-size: 11px; font-weight: 700; color: #64748B; letter-spacing: 0.05em; text-transform: uppercase;">${props.code} ${props.platform ? `· Pf ${props.platform}` : ""}</div>
          <div style="margin: 8px 0; height: 1px; background: #E2E8F0;"></div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #475569; margin-bottom: 2px;">
            <span>Arr: <b>${props.expArr !== "--" ? props.expArr : props.schArr}</b></span>
            <span>Dep: <b>${props.expDep !== "--" ? props.expDep : props.schDep}</b></span>
          </div>
          ${props.delayMin > 0 ? `<div style="font-size: 11px; color: #D97706; font-weight: 700; margin-top: 4px;">Delayed +${props.delayMin} min</div>` : ""}
          <button id="set-my-station-btn" style="margin-top: 8px; width: 100%; padding: 4px 8px; font-size: 11px; font-weight: 600; border-radius: 6px; background: ${isMyStn ? '#F1F5F9' : '#1A6FE8'}; color: ${isMyStn ? '#0F172A' : '#FFFFFF'}; border: 1px solid ${isMyStn ? '#CBD5E1' : 'transparent'}; cursor: pointer;">
            ${isMyStn ? '✓ Marked as My Station' : 'Mark as My Station'}
          </button>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 12, closeButton: true })
        .setLngLat(geom.coordinates as [number, number])
        .setHTML(popupHtml)
        .addTo(map);

      popupRef.current = popup;

      // Add event listener to button in popup
      setTimeout(() => {
        const btn = document.getElementById("set-my-station-btn");
        if (btn) {
          btn.onclick = () => {
            setMyStation(isMyStn ? null : props.code);
            popup.remove();
          };
        }
      }, 50);
    },
    [onStationClick, myStation, setMyStation]
  );

  const handleStationClickRef = useRef(handleStationClick);
  useEffect(() => {
    handleStationClickRef.current = handleStationClick;
  }, [handleStationClick]);

  const updateMapLayersRef = useRef(updateMapLayers);
  useEffect(() => {
    updateMapLayersRef.current = updateMapLayers;
  }, [updateMapLayers]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: getMapStyleUrl(mapStyle),
        center: [77.209, 28.6139], // Default Delhi
        zoom: 5,
        attributionControl: { compact: true },
      });

      map.on("load", () => {
        setMapLoaded(true);
        setMapError(null);
      });

      map.on("style.load", () => {
        updateMapLayersRef.current();
      });

      map.on("error", (e) => {
        console.error("[maplibre] Map error:", e);
        if (!mapLoaded) {
          setMapError("Failed to load map style. Please check your network or API key.");
        }
      });

      // Cursor pointer on station hover
      map.on("mouseenter", "stations-halt", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "stations-halt", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "stations-current", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "stations-current", () => {
        map.getCanvas().style.cursor = "";
      });

      // Click stations
      map.on("click", (e) => handleStationClickRef.current(e));

      mapRef.current = map;
    } catch (err) {
      console.error("[map] Map init error:", err);
      setMapError("WebGL / MapLibre failed to initialize.");
    }

    return () => {
      if (cancelAnimationRef.current) cancelAnimationRef.current();
      if (markerRef.current) markerRef.current.remove();
      if (popupRef.current) popupRef.current.remove();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle map style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    map.setStyle(getMapStyleUrl(mapStyle));
  }, [mapStyle, mapLoaded]);

  // Initial fit bounds when map loads
  useEffect(() => {
    if (mapLoaded) {
      updateMapLayers();
      fitRouteBounds();
    }
  }, [mapLoaded, fitRouteBounds, updateMapLayers]);

  // Update train marker with smooth animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const targetPos = splitRoute?.trainPosition;
    const targetBearing = splitRoute?.trainBearing ?? 0;

    if (!targetPos) return;

    // Create marker if it doesn't exist
    if (!markerRef.current) {
      const { container, iconWrapper } = createTrainMarkerElement();
      markerIconRef.current = iconWrapper;

      const marker = new maplibregl.Marker({
        element: container,
        anchor: "center",
      })
        .setLngLat(targetPos)
        .addTo(map);

      markerRef.current = marker;
      currentPosRef.current = targetPos;
      currentBearingRef.current = targetBearing;
      iconWrapper.style.transform = `rotate(${targetBearing}deg)`;
      return;
    }

    // Animate marker tween
    if (cancelAnimationRef.current) {
      cancelAnimationRef.current();
    }

    const fromPos = currentPosRef.current;
    const fromBearing = currentBearingRef.current;

    cancelAnimationRef.current = animateMarker({
      fromLngLat: fromPos,
      toLngLat: targetPos,
      fromBearing,
      toBearing: targetBearing,
      durationMs: 1500,
      onUpdate: (pos, bearing) => {
        markerRef.current?.setLngLat(pos);
        if (markerIconRef.current) {
          markerIconRef.current.style.transform = `rotate(${bearing}deg)`;
        }
        currentPosRef.current = pos;
        currentBearingRef.current = bearing;
      },
    });

    // Follow train camera
    if (followTrain) {
      map.easeTo({
        center: targetPos,
        duration: 1200,
      });
    }
  }, [splitRoute, mapLoaded, followTrain]);

  // User drag unlocks follow mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onDragStart = () => {
      if (followTrain) {
        setFollowTrain(false);
      }
    };

    map.on("dragstart", onDragStart);
    return () => {
      map.off("dragstart", onDragStart);
    };
  }, [followTrain, setFollowTrain]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* MapLibre WebGL Canvas Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full bg-[#E2E8F0]"
        aria-label="Interactive railway journey map"
        role="region"
      />

      {/* Map Error Fallback */}
      {mapError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[--bg]/90 backdrop-blur-sm p-6 text-center">
          <p className="text-2xl mb-2">🗺️</p>
          <p className="text-sm font-bold text-[--text] mb-1">Interactive Map Unavailable</p>
          <p className="text-xs text-[--text-muted] max-w-sm mb-4">{mapError}</p>
          <button
            onClick={() => {
              setMapError(null);
              mapRef.current?.setStyle(getMapStyleUrl(mapStyle));
            }}
            className="px-4 py-2 text-xs font-semibold rounded-[--radius-md] text-white"
            style={{ background: "var(--color-brand)" }}
          >
            Retry Map
          </button>
        </div>
      )}

      {/* Floating Map Controls */}
      <MapControls
        onZoomIn={() => mapRef.current?.zoomIn({ duration: 300 })}
        onZoomOut={() => mapRef.current?.zoomOut({ duration: 300 })}
        onRecenter={fitRouteBounds}
        isFollowing={followTrain}
        onToggleFollow={() => {
          const next = !followTrain;
          setFollowTrain(next);
          if (next && splitRoute?.trainPosition) {
            mapRef.current?.easeTo({
              center: splitRoute.trainPosition,
              zoom: Math.max(mapRef.current.getZoom(), 8),
              duration: 800,
            });
          }
        }}
        mapStyle={mapStyle}
        onToggleStyle={() => {
          setMapStyle(mapStyle === "light" ? "dark" : "light");
        }}
        className="absolute top-4 right-4 z-20"
      />
    </div>
  );
}
