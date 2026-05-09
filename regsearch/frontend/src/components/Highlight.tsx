interface HighlightProps {
  text: string;
  terms: string[];
  color: string;
  // Trim long bodies to a readable snippet around the first match.
  maxLen?: number;
}

// Highlights matched query terms inside a document snippet. Whole-word, case
// insensitive. Pure string work — no dangerouslySetInnerHTML.
export default function Highlight({
  text,
  terms,
  color,
  maxLen = 280,
}: HighlightProps) {
  const cleaned = Array.from(
    new Set(terms.map((t) => t.trim().toLowerCase()).filter(Boolean)),
  );

  let snippet = text;
  if (text.length > maxLen) {
    const firstIdx =
      cleaned.length > 0 ? text.toLowerCase().indexOf(cleaned[0]) : -1;
    const start =
      firstIdx > 80 ? Math.max(0, firstIdx - 60) : 0;
    snippet =
      (start > 0 ? "… " : "") + text.slice(start, start + maxLen).trimEnd() + "…";
  }

  if (cleaned.length === 0) {
    return <span>{snippet}</span>;
  }

  const escaped = cleaned.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = snippet.split(re);

  return (
    <span>
      {parts.map((part, i) =>
        cleaned.includes(part.toLowerCase()) ? (
          <mark
            key={i}
            className="rounded px-0.5 font-medium"
            style={{ backgroundColor: `${color}22`, color: "inherit" }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}
