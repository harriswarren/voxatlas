import { useRef, type ReactNode } from "react";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";

interface ExportableChartProps {
  title: string;
  children: ReactNode;
}

export default function ExportableChart({ title, children }: ExportableChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const exportPNG = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.download = `voxatlas-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button
          onClick={exportPNG}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
        >
          <Download size={14} />
          Export PNG
        </button>
      </div>
      <div ref={chartRef}>{children}</div>
    </div>
  );
}
