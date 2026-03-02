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
  const [cerFilter, setCerFilter] = useState<string | null>(null);

  const CER_BUCKETS = [
    { key: "0-5", label: "0-5%", color: "#22C55E", min: 0, max: 5 },
    { key: "5-10", label: "5-10%", color: "#84CC16", min: 5, max: 10 },
    { key: "10-20", label: "10-20%", color: "#F59E0B", min: 10, max: 20 },
    { key: "20-30", label: "20-30%", color: "#F97316", min: 20, max: 30 },
    { key: "30+", label: "30%+", color: "#EF4444", min: 30, max: Infinity },
  ];

  const filteredPoints = cerFilter
    ? points.filter((pt) => {
        const bucket = CER_BUCKETS.find((b) => b.key === cerFilter);
        if (!bucket) return true;
        return pt.cer >= bucket.min && (bucket.max === Infinity ? true : pt.cer < bucket.max);
      })
    : points;

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

    const features = filteredPoints.map((pt) => ({
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
        countries: (pt.countries || []).join(", "),
        family: pt.family || "",
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

      const countryStr = props.countries ? String(props.countries) : "";
      const familyStr = props.family ? String(props.family) : "";

      new maplibregl.Popup({ offset: 10 })
        .setLngLat(coords)
        .setHTML(
          `<div style="font-family:sans-serif;font-size:13px;line-height:1.6">
            <strong style="font-size:14px">${props.language_name}</strong><br/>
            <span style="color:#64748b">${props.lang_code}</span>
            ${countryStr ? ` · <span style="color:#64748b">${countryStr}</span>` : ""}
            ${props.continent ? ` · <span style="color:#94a3b8">${props.continent}</span>` : ""}<br/>
            ${familyStr ? `<span style="color:#64748b">Family:</span> ${familyStr}<br/>` : ""}
            <span style="color:#64748b">CER:</span> <strong style="color:${props.color}">${Number(props.cer).toFixed(1)}%</strong><br/>
            <span style="color:#64748b">Training Data:</span> <strong>${Number(props.training_hours).toFixed(1)} hrs</strong><br/>
            <span style="color:#64748b">Status:</span> ${props.endangerment}
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
  }, [points, filteredPoints, loaded, onSelect]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div ref={mapContainer} className="w-full h-[450px]" />
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <span className="font-medium inline-flex items-center gap-1 mr-2">CER (Character Error Rate): <CERTooltip size={12} /></span>
          {CER_BUCKETS.map((bucket) => (
            <button
              key={bucket.key}
              onClick={() => setCerFilter(cerFilter === bucket.key ? null : bucket.key)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all cursor-pointer border ${
                cerFilter === bucket.key
                  ? "border-gray-400 bg-gray-100 font-semibold shadow-sm"
                  : cerFilter && cerFilter !== bucket.key
                  ? "border-transparent opacity-40 hover:opacity-70"
                  : "border-transparent hover:bg-gray-50"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: bucket.color }}
              />
              {bucket.label}
            </button>
          ))}
          {cerFilter && (
            <button
              onClick={() => setCerFilter(null)}
              className="ml-1 px-2 py-1 text-blue-600 hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <span className="text-gray-400">
          {cerFilter
            ? `${filteredPoints.length.toLocaleString()} of ${stats.withCoords.toLocaleString()} languages`
            : `${stats.withCoords.toLocaleString()} languages mapped`}
        </span>
      </div>
    </div>
  );
}
