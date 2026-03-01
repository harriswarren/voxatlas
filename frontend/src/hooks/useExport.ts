import { useCallback } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export function useExport() {
  const exportPNG = useCallback(async (element: HTMLElement, filename: string) => {
    const canvas = await html2canvas(element, { scale: 2 });
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const exportSVG = useCallback(async (element: HTMLElement, filename: string) => {
    const svgEl = element.querySelector("svg");
    if (!svgEl) {
      console.warn("No SVG found in element");
      return;
    }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = `${filename}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  const exportPDF = useCallback(async (element: HTMLElement, filename: string) => {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}.pdf`);
  }, []);

  return { exportPNG, exportSVG, exportPDF };
}
