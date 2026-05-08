import { AlertTriangle, Info, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "info" | "error" | "loading";

const toneMap: Record<
  Tone,
  { cls: string; icon: ReactNode }
> = {
  info: {
    cls: "border-line bg-panel text-ink-soft",
    icon: <Info size={16} className="text-brand" />,
  },
  error: {
    cls: "border-rerank/30 bg-rerank/5 text-ink",
    icon: <AlertTriangle size={16} className="text-rerank" />,
  },
  loading: {
    cls: "border-line bg-panel text-ink-soft",
    icon: <Loader2 size={16} className="text-brand animate-spin" />,
  },
};

export default function Banner({
  tone = "info",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const t = toneMap[tone];
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${t.cls}`}
    >
      <span className="mt-0.5 shrink-0">{t.icon}</span>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
