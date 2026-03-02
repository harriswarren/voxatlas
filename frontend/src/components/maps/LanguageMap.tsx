import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Language } from "../../api/languages";
import { cerToColor, MAP_STYLE } from "../../utils/constants";
import CERTooltip from "../ui/CERTooltip";

interface LanguageMapProps {
  languages: Language[];
  onSelect?: (lang: Language) => void;
}

export default function LanguageMap({ languages, onSelect }: LanguageMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

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
    if (!map || !loaded) return;

    // Remove existing source/layer if present
    if (map.getLayer("language-circles")) map.removeLayer("language-circles");
    if (map.getSource("languages")) map.removeSource("languages");

    const features = languages
      .filter((l) => l.latitude !== 0 || l.longitude !== 0)
      .map((lang) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [lang.longitude, lang.latitude],
        },
        properties: {
          lang_code: lang.lang_code,
          language_name: lang.language_name || lang.lang_code,
          cer: lang.cer_7b_llm,
          color: cerToColor(lang.cer_7b_llm),
          endangerment: lang.endangerment,
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
        "circle-radius": 6,
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
          `<div style="font-family:sans-serif;font-size:13px">
            <strong>${props.language_name}</strong><br/>
            <span style="color:#64748b">${props.lang_code}</span><br/>
            Character Error Rate: <strong>${Number(props.cer).toFixed(1)}%</strong><br/>
            Status: ${props.endangerment}
          </div>`
        )
        .addTo(map);

      if (onSelect) {
        const lang = languages.find((l) => l.lang_code === props.lang_code);
        if (lang) onSelect(lang);
      }
    });

    map.on("mouseenter", "language-circles", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "language-circles", () => {
      map.getCanvas().style.cursor = "";
    });
  }, [languages, loaded, onSelect]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div ref={mapContainer} className="w-full h-[450px]" />
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
        <span className="font-medium inline-flex items-center gap-1">CER (Character Error Rate): <CERTooltip size={12} /></span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#22C55E] inline-block" /> 0-5%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#84CC16] inline-block" /> 5-10%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block" /> 10-20%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#F97316] inline-block" /> 20-30%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block" /> 30%+</span>
      </div>
    </div>
  );
}
