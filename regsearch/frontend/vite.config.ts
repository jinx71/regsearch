import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// No dev proxy: the axios client points at VITE_API_URL (default
// http://localhost:8000). Keeping the API origin explicit makes the
// deployed config (Vercel env var -> Render/Fly URL) obvious.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
