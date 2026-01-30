import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@stores": path.resolve(__dirname, "./src/stores"),
    },
  },
  server: {
    proxy: {
      // En desarrollo, simular el comportamiento de la función serverless
      "/api/notion": {
        target: "https://api.notion.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/notion/, "/v1"),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // Convertir el header personalizado a Authorization
            const notionToken = req.headers["x-notion-token"];
            if (notionToken) {
              proxyReq.setHeader("Authorization", `Bearer ${notionToken}`);
              proxyReq.setHeader("Notion-Version", "2022-06-28");
            }
          });
        },
      },
    },
  },
});
