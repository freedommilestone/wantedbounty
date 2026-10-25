// Short-lived USD quote; unavailable or stale market data must never charge a fallback amount.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_last_updated_at=true", { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Price service unavailable");
    const data = (await response.json()).solana;
    const price = data?.usd;
    const age = Date.now() - data?.last_updated_at * 1000;
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(age) || age < -30000 || age > 300000) throw new Error("Price unavailable or stale");
    const lamports = Math.ceil(5 / price * 1e9);
    if (!Number.isSafeInteger(lamports) || lamports <= 0) throw new Error("Invalid quote");
    return res.status(200).json({ lamports, usdPrice: price, expiresAt: Date.now() + 60000 });
  } catch {
    return res.status(503).json({ error: "SOL pricing is unavailable. Retry or pay with USDC or USDT." });
  }
}
