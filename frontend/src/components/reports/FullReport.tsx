import { useRef } from "react";
import { Download } from "lucide-react";
import { useExport } from "../../hooks/useExport";

interface FullReportProps {
  children: React.ReactNode;
}

export default function FullReport({ children }: FullReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const { exportPDF } = useExport();

  const handleExport = () => {
    if (reportRef.current) {
      exportPDF(reportRef.current, "voxatlas-full-report");
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0668E1] text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Download size={14} />
          Export Full Report as PDF
        </button>
      </div>
      <div ref={reportRef} className="space-y-6 bg-white p-8 rounded-xl">
        {children}
      </div>
    </div>
  );
}
