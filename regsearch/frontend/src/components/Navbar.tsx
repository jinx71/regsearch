import { NavLink } from "react-router-dom";
import { ScanSearch } from "lucide-react";
import StatusReadout from "./StatusReadout";

const tabs = [
  { to: "/", label: "Search", end: true },
  { to: "/compare", label: "Compare", end: false },
  { to: "/benchmark", label: "Benchmark", end: false },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center h-9 w-9 rounded-md bg-ink text-paper">
              <ScanSearch size={18} strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-ink text-lg tracking-tight">
                RegSearch
              </div>
              <div className="font-mono text-[11px] text-ink-faint -mt-0.5">
                semantic retrieval engine
              </div>
            </div>
          </div>

          <StatusReadout />
        </div>

        <nav className="flex items-center gap-1 -mb-px">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className="tab-link">
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
