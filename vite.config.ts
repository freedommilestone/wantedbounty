import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";

const solanaProxy: ProxyOptions = {
  // The public mainnet RPC rejects requests that carry a browser Origin, so local traffic goes through Vite.
  target: "https://api.mainnet-beta.solana.com",
  changeOrigin: true,
  rewrite: () => "/",
  configure: (proxy) => {
    proxy.on("proxyReq", (proxyReq) => {
      proxyReq.removeHeader("origin");
      proxyReq.removeHeader("referer");
    });
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/solana-rpc": solanaProxy } },
  preview: { proxy: { "/solana-rpc": solanaProxy } },
});
