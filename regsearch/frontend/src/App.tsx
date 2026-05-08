import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "./components/Navbar";
import SearchPage from "./pages/SearchPage";
import ComparePage from "./pages/ComparePage";

// The benchmark page pulls in Recharts (~the bulk of the bundle), so it's
// lazy-loaded and code-split out of the initial download.
const BenchmarkPage = lazy(() => import("./pages/BenchmarkPage"));

function PageFallback() {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-faint py-16 justify-center">
      <Loader2 size={16} className="animate-spin text-brand" />
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/benchmark" element={<BenchmarkPage />} />
            <Route path="*" element={<SearchPage />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="border-t border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-ink-faint">
          <span className="font-mono">
            RegSearch · PRJ · semantic retrieval over GMP documents
          </span>
          <span>
            BM25 · dense vectors · RRF fusion · cross-encoder reranking
          </span>
        </div>
      </footer>
    </div>
  );
}
