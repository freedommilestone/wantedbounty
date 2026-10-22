import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // The public mainnet RPC rejects requests that carry a browser Origin, so dev traffic goes through Vite.
      "/solana-rpc": {
        target: "https://api.mainnet-beta.solana.com",
        changeOrigin: true,
        rewrite: () => "/",
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("referer");
          });
        },
      },
    },
  },
});
