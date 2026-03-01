import { Lightbulb } from "lucide-react";

interface InsightCardProps {
  title: string;
  content: string;
}

export default function InsightCard({ title, content }: InsightCardProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <Lightbulb size={16} className="text-blue-600" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">{title}</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}
