import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, RotateCcw } from "lucide-react";

interface AudioPlayerProps {
  url: string;
}

export default function AudioPlayer({ url }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#94a3b8",
      progressColor: "#0668E1",
      cursorColor: "#1A1A2E",
      barWidth: 2,
      barRadius: 2,
      barGap: 1,
      height: 80,
      url,
    });

    ws.on("ready", () => setReady(true));
    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => setPlaying(false));
    ws.on("finish", () => setPlaying(false));

    wsRef.current = ws;

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [url]);

  const togglePlay = () => wsRef.current?.playPause();
  const restart = () => {
    wsRef.current?.seekTo(0);
    wsRef.current?.play();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div ref={containerRef} className="mb-3" />
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          disabled={!ready}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0668E1] text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? "Pause" : "Play"}
        </button>
        <button
          onClick={restart}
          disabled={!ready}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <RotateCcw size={14} />
          Restart
        </button>
      </div>
    </div>
  );
}
