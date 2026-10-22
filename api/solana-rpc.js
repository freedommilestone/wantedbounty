const SOLANA_RPC = "https://api.mainnet-beta.solana.com/";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const response = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(req.body ?? {}),
    });
    const text = await response.text();
    res.status(response.status).setHeader("content-type", "application/json").send(text);
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "RPC proxy failed" });
  }
}
