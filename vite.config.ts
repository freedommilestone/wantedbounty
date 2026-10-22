import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";

function stripBrowserHeaders(req: { headers: Record<string, unknown> }) {
  // The public mainnet RPC returns 403 when a browser Origin is present. Remove it
  // before http-proxy copies the incoming headers onto the upstream request.
  for (const header of ["origin", "referer", "sec-fetch-site", "sec-fetch-mode", "sec-fetch-dest"]) {
    delete req.headers[header];
  }
}

const solanaProxy: ProxyOptions = {
  target: "https://api.mainnet-beta.solana.com",
  changeOrigin: true,
  rewrite: () => "/",
  bypass(req) {
    stripBrowserHeaders(req);
  },
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
