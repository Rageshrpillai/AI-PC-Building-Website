import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      // We'll use '/api-proxy' as a prefix for our API calls in the frontend
      "/api-proxy": {
        target: "https://comppartsapi.herokuapp.com", // The actual API address
        changeOrigin: true, // Recommended for most cases, especially with virtual hosts
        rewrite: (path) => path.replace(/^\/api-proxy/, ""), // Remove the prefix when forwarding
        // secure: false, // Uncomment if the target API is HTTPS with a self-signed certificate (not usually needed for Heroku)
      },
    },
  },
});
