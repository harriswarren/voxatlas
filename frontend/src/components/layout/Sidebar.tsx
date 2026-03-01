import { NavLink } from "react-router-dom";
import { BarChart3, Globe, Mic, Swords, FileText, Bot } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: BarChart3, label: "Analytics" },
  { to: "/explorer", icon: Globe, label: "Explorer" },
  { to: "/transcribe", icon: Mic, label: "Transcribe" },
  { to: "/compare", icon: Swords, label: "Compare" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/ask", icon: Bot, label: "Ask VoxAtlas" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-[#1A1A2E] text-white flex flex-col min-h-screen">
      <div className="px-5 py-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-[#0668E1]">Vox</span>Atlas
        </h1>
        <p className="text-xs text-gray-400 mt-1">Mapping Every Voice on Earth</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#0668E1] text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[10px] text-gray-500">Powered by Meta AI</p>
        <p className="text-[10px] text-gray-500">Omnilingual ASR + Llama</p>
      </div>
    </aside>
  );
}
