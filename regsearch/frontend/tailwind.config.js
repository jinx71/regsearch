/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surface / structure — a cool "lab paper" + navy-slate ink that
        // keeps continuity with the portfolio brand navy.
        paper: "#F6F7F9",
        panel: "#FFFFFF",
        ink: "#0F2438",
        "ink-soft": "#3B4D5F",
        "ink-faint": "#7A8896",
        line: "#E2E6EB",
        "line-strong": "#CBD2DA",
        brand: "#1B4F72",

        // Per-mode "channel" colors. Used consistently for the same mode
        // across Search, Compare and Benchmark so the eye learns them.
        keyword: "#B45309", // amber  — lexical / BM25
        semantic: "#0E7490", // cyan   — dense vectors
        hybrid: "#6D28D9", // violet — RRF fusion
        rerank: "#BE123C", // rose   — cross-encoder rerank
      },
      fontFamily: {
        display: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"IBM Plex Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        "fade-rise": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "bar-grow": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 0.35s ease-out both",
        "bar-grow": "bar-grow 0.6s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
