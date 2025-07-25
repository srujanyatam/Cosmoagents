
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { aiRewriteApiPlugin } from './src/api/ai-rewrite';
import { aiExplainApiPlugin } from './src/api/ai-explain';
import 'dotenv/config';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), aiRewriteApiPlugin(), aiExplainApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
