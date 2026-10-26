// Only fresh market data may produce a payment quote; never substitute a fixed SOL amount.
const sources = [
  {
    url: "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_last_updated_at=true",
    read: (data) => ({ price: data?.solana?.usd, timestamp: data?.solana?.last_updated_at * 1000 }),
  },
  {
    url: "https://api.exchange.coinbase.com/products/SOL-USD/ticker",
    read: (data) => ({ price: Number(data?.price), timestamp: Date.parse(data?.time) }),
  },
];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  for (const source of sources) {
    try {
      const response = await fetch(source.url, { signal: AbortSignal.timeout(3000), headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Price service unavailable");
      const { price, timestamp } = source.read(await response.json());
      const age = Date.now() - timestamp;
      if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(age) || age < -30000 || age > 300000) throw new Error("Price unavailable or stale");
      const lamports = Math.ceil(5 / price * 1e9);
      if (!Number.isSafeInteger(lamports) || lamports <= 0) throw new Error("Invalid quote");
      return res.status(200).json({ lamports, usdPrice: price, expiresAt: Date.now() + 60000 });
    } catch {
      // Rate limits, timeouts, malformed responses and stale data all try the next source.
    }
  }
  return res.status(503).json({ error: "SOL pricing is unavailable. Retry or pay with USDC or USDT." });
}
