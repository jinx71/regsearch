import { Search, CornerDownLeft } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  placeholder?: string;
}

// No native <form> (per artifact constraint) — Enter is handled on keydown.
export default function SearchBar({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder = "Describe what you're looking for…",
}: SearchBarProps) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-line-strong bg-panel px-4 py-3 shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 transition">
        <Search size={20} className="text-ink-faint shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink-faint text-base"
          aria-label="Search query"
        />
        <button
          onClick={onSubmit}
          disabled={loading || value.trim().length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-1.5 text-sm font-medium text-paper disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand transition-colors"
        >
          {loading ? "Searching…" : "Search"}
          {!loading && <CornerDownLeft size={14} />}
        </button>
      </div>
    </div>
  );
}
