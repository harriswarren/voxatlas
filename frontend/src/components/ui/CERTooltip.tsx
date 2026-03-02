import { useState } from "react";
import { Info } from "lucide-react";

const CER_DEFINITION =
  "Character Error Rate — measures ASR transcription accuracy by comparing predicted text to ground truth, character by character. Lower is better (0% = perfect).";

interface CERTooltipProps {
  size?: number;
  className?: string;
}

export default function CERTooltip({ size = 14, className = "" }: CERTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info
        size={size}
        className="text-gray-400 hover:text-blue-500 cursor-help transition-colors"
      />
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 text-xs leading-relaxed text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none">
          <strong>CER (Character Error Rate)</strong>
          <br />
          {CER_DEFINITION}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}

export function CERBadge({ label = "CER" }: { label?: string }) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex items-center gap-1 cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {label}
      <Info size={12} className="text-gray-400" />
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 text-xs leading-relaxed text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none">
          <strong>CER (Character Error Rate)</strong>
          <br />
          {CER_DEFINITION}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
