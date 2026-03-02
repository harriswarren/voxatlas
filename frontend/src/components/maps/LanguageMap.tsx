import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapPoints } from "../../api/languages";
import type { MapPoint } from "../../api/languages";
import { cerToColor, MAP_STYLE } from "../../utils/constants";
import CERTooltip from "../ui/CERTooltip";

interface LanguageMapProps {
  onSelect?: (point: MapPoint) => void;
}

export default function LanguageMap({ onSelect }: LanguageMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [stats, setStats] = useState({ total: 0, withCoords: 0 });

  useEffect(() => {
    getMapPoints()
      .then((data) => {
        setPoints(data);
        setStats({ total: data.length, withCoords: data.length });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [20, 15],
      zoom: 1.8,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      setLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || points.length === 0) return;

    // Remove existing source/layer if present
    if (map.getLayer("language-circles")) map.removeLayer("language-circles");
    if (map.getSource("languages")) map.removeSource("languages");

    const features = points.map((pt) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [pt.longitude, pt.latitude],
      },
      properties: {
        lang_code: pt.lang_code,
        language_name: pt.language_name || pt.lang_code,
        cer: pt.cer,
        color: cerToColor(pt.cer),
        endangerment: pt.endangerment,
        continent: pt.continent,
        training_hours: pt.training_hours,
      },
    }));

    map.addSource("languages", {
      type: "geojson",
      data: { type: "FeatureCollection", features },
    });

    map.addLayer({
      id: "language-circles",
      type: "circle",
      source: "languages",
      paint: {
        "circle-radius": [
          "interpolate", ["linear"], ["zoom"],
          1, 4,
          4, 6,
          8, 10,
        ],
        "circle-color": ["get", "color"],
        "circle-opacity": 0.8,
        "circle-stroke-width": 1,
        "circle-stroke-color": "white",
      },
    });

    // Popup on click
    map.on("click", "language-circles", (e) => {
      const feature = e.features?.[0];
      if (!feature || !feature.properties) return;

      const props = feature.properties;
      const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

      new maplibregl.Popup({ offset: 10 })
        .setLngLat(coords)
        .setHTML(
          `<div style="font-family:sans-serif;font-size:13px;line-height:1.5">
            <strong>${props.language_name}</strong><br/>
            <span style="color:#64748b">${props.lang_code}</span>
            ${props.continent ? ` · <span style="color:#64748b">${props.continent}</span>` : ""}<br/>
            Character Error Rate: <strong style="color:${props.color}">${Number(props.cer).toFixed(1)}%</strong><br/>
            Training: <strong>${Number(props.training_hours).toFixed(1)} hrs</strong><br/>
            Status: ${props.endangerment}
          </div>`
        )
        .addTo(map);

      if (onSelect) {
        const pt = points.find((p) => p.lang_code === props.lang_code);
        if (pt) onSelect(pt);
      }
    });

    map.on("mouseenter", "language-circles", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "language-circles", () => {
      map.getCanvas().style.cursor = "";
    });
  }, [points, loaded, onSelect]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div ref={mapContainer} className="w-full h-[450px]" />
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <span className="font-medium inline-flex items-center gap-1">CER (Character Error Rate): <CERTooltip size={12} /></span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#22C55E] inline-block" /> 0-5%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#84CC16] inline-block" /> 5-10%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block" /> 10-20%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#F97316] inline-block" /> 20-30%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block" /> 30%+</span>
        </div>
        <span className="text-gray-400">{stats.withCoords.toLocaleString()} languages mapped</span>
      </div>
    </div>
  );
}
