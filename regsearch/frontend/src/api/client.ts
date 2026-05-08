import axios from "axios";
import type {
  BenchmarkData,
  CompareData,
  Document,
  Envelope,
  HealthData,
  SearchData,
  SearchMode,
} from "../types";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const http = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 60_000, // first dense query can be slow while the model warms up
});

// Unwrap the { success, data, message } envelope and throw on logical failure
// so callers only deal with the payload (or an Error).
function unwrap<T>(env: Envelope<T>): T {
  if (!env.success || env.data === null) {
    throw new Error(env.message || "Request failed");
  }
  return env.data;
}

export async function search(
  query: string,
  mode: SearchMode,
  topK = 10,
): Promise<SearchData> {
  const { data } = await http.post<Envelope<SearchData>>("/api/search", {
    query,
    mode,
    top_k: topK,
  });
  return unwrap(data);
}

export async function compare(query: string, topK = 5): Promise<CompareData> {
  const { data } = await http.post<Envelope<CompareData>>("/api/compare", {
    query,
    top_k: topK,
  });
  return unwrap(data);
}

export async function listDocuments(): Promise<Document[]> {
  const { data } = await http.get<Envelope<Document[]>>("/api/documents");
  return unwrap(data);
}

export async function benchmark(k = 10): Promise<BenchmarkData> {
  const { data } = await http.get<Envelope<BenchmarkData>>("/api/benchmark", {
    params: { k },
  });
  return unwrap(data);
}

export async function health(): Promise<HealthData> {
  const { data } = await http.get<Envelope<HealthData>>("/api/health");
  return unwrap(data);
}

// Surface a readable message from an axios error for the UI.
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = (err.response?.data as { detail?: string } | undefined)?.detail;
    if (detail) return detail;
    if (err.code === "ERR_NETWORK") {
      return "Cannot reach the API. Is the backend running on " + baseURL + "?";
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Unexpected error";
}

export { baseURL };
