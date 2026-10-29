# Wanted Bounty

Next.js App Router application. One responsive How It Works component uses a three-, two-, or one-column grid; it does not serve separate mobile and desktop pages.

## Development

Use Node.js 20.9+ (Node.js 22 LTS recommended). Run `npm install`, then `npm run dev`. Production checks: `npm run build`, `npm start`, and `npm test`. Next.js serves the page routes and `/api/*` handlers in the same local server.

Existing public `VITE_BERI_MINT`, `VITE_TREASURY_ADDRESS`, and `VITE_SOLANA_RPC_URL` settings remain supported by an explicit compatibility allowlist in `next.config.mjs`. New installations can use `NEXT_PUBLIC_BERI_MINT`, `NEXT_PUBLIC_TREASURY_ADDRESS`, and `NEXT_PUBLIC_SOLANA_RPC_URL`. Never put private RPC credentials into a public setting.

## Paid AI poster setup

1. Run `supabase/migrations/20261026_poster_orders.sql` once in the Supabase SQL Editor. It creates a server-only order table, atomic payment claim functions, and a private `poster-private` image bucket. There are no public read policies.
2. Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `CHATGPT_API_SECRET_KEY` in Vercel. These must never have a `VITE_` or `NEXT_PUBLIC_` prefix. OpenAI API billing and image-model access must be enabled for the key's project.
3. Optionally set `SOLANA_RPC_URL` for a dedicated mainnet RPC and `OPENAI_IMAGE_MODEL` (default `gpt-image-2`). If overriding the recipient, keep server `TREASURY_ADDRESS` and frontend `NEXT_PUBLIC_TREASURY_ADDRESS` (or legacy `VITE_TREASURY_ADDRESS`) identical.
4. Deploy and verify the order preparation endpoint before making a real payment. Local Next.js runs the API routes; use `.env.local` for private local configuration. A real image request is billable; local tests mock both OpenAI and Solana.

The server stores the input privately before requesting payment. A transaction memo binds the payment to an order. Generation requires a finalized matching transfer; a database unique constraint prevents receipt reuse and an atomic claim prevents concurrent generation. The fixed $5 SOL quote comes from the server. USDC/USDT payments require 5,000,000 base units of the canonical mainnet mint.

The browser retains an order capability token and receipt in localStorage for refresh/retry recovery. Do not clear browser data until the poster is downloaded. If a wallet sent payment but did not return its receipt, paste its transaction signature into recovery. Never clear a paid order to retry a purchase.

Generation failures and ambiguous timeouts move the paid order to `review`; they do not automatically call OpenAI again or request another payment. Operators should inspect `poster_orders` by order ID and the Solana receipt. If `result.jpg` exists in private storage, restore the result record; otherwise resolve/refund the paid order before authorizing another attempt. Do not blindly reset `generating`/`review` to `pending`. Input and result images currently remain in private storage until an operator removes them; no automatic retention cleanup or refund automation is included.

Validation: `npm run build` and `npm test`. The migration keeps payment verification and persistent order claims in `server/`; the Next.js API wrappers preserve the 2 MB request allowance and 300-second poster generation limit.

Vercel framework, build command, and output directory are configured in `vercel.json`. There is no SPA catch-all rewrite; Next.js owns each page route.
