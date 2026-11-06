# Verified wallets and holding streaks

A signed-in, email-confirmed player can link one Solana wallet. The wallet signs a domain-, account-, address- and nonce-bound message, valid for five minutes. The server checks its Ed25519 signature and atomically consumes the challenge. Each wallet can belong to only one account. Connecting an extension alone does not verify ownership. No transaction is sent for verification.

## Historical streaks and daily observations

The dashboard and energy levels now use finalized **historical continuous holdings from token launch**, with a minimum of 1 BERI. See `docs/character-energy.md` for the resumable transaction-history pipeline. Confirmed complete 24-hour holding periods determine the longest streak. The older daily counter remains an observation audit, not an energy-level input.

- A qualifying observation requires **at least 1 BERI**, using raw integer amounts and the mint's decimals. Display rounding never determines eligibility.
- Verification triggers the first balance check. Subsequent automatic checks run daily through `/api/holding-streaks`, configured for **00:10 UTC** in `vercel.json` (Vercel may run daily Hobby jobs within the scheduled hour).
- Each UTC date counts at most once. Any observed balance below 1 BERI disqualifies that day, even if the wallet is refilled later.
- The daily audit measures consecutive observations, not continuous ownership. Historical streaks are independently reconstructed and can include time before verification.
- Failed RPC requests preserve saved balances/history and mark the check pending/failed. Historical gaps are filled only by complete reconciled transaction pages, never by assuming an unobserved balance.
- Once verified, the saved wallet is loaded when the player signs in and refreshed automatically every 60 seconds while the site is visible, including without a wallet extension connection. Returning to a visible tab resumes checks. The dashboard displays total BERI across that wallet’s token accounts, without decimal places, and the last check time. Failed checks retain the last known balance.
- Automatic and manual checks are limited to once per minute per wallet. Duplicate cron runs use the same lease and daily primary key; stale slot responses cannot overwrite a newer observation.
- Unlinking requires explicit confirmation, pauses regeneration, and deletes the link's snapshots/indexing state. Energy and permanent character level remain. Re-verifying reconstructs wallet history again. Disconnecting a browser extension does not unlink the account's verified wallet.

## Configuration and deployment

Server-only variables: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CRON_SECRET`, and `SOLANA_HISTORY_RPC_URL` (Helius RPC with `getTransactionsForAddress` support). `SOLANA_RPC_URL` optionally separates current-balance traffic; otherwise it uses the history RPC, then public mainnet as the last fallback. `BERI_HISTORY_START_DATE` defaults to the approved `launch` policy. `BERI_MINT` can override the established BERI mint. Do not change the mint or eligibility date for an existing dataset without a deliberate migration.

Migration: `supabase/migrations/20261106031553_wallet_verification_holding_streaks.sql`. It was applied to the existing Supabase project. The three tables have RLS; clients can read only their own link/days and cannot read challenges or write tracking data. Only the server service role can execute mutation functions. The advisor's no-policy notice for `wallet_challenges` is intentional deny-all client access.

A sensitive `CRON_SECRET` was added to Vercel production. **The daily job becomes active only when this code is deployed to production.** Preview deployments do not run scheduled scans. Never expose the secret through a public variable or commit it.

The job processes wallets in pages of 30 with three concurrent checks and a 240-second work budget. A failed or incomplete run returns 503 and aggregate counts, without wallet addresses. Inspect Vercel cron logs and retry the authenticated endpoint within the same UTC day on failure. Vercel does not automatically retry failed cron jobs. At larger scale, move scans to a durable queued worker before the daily job can exceed its runtime budget.

## Verification

`npm test` covers cryptographic tampering, expiration, account binding, exact balances, malformed RPC responses, failed checks, cron authorization, and unauthenticated API access. `supabase/tests/wallet_holding_streaks.sql` is a rollback-only database test covering threshold/day transitions, replay protection, duplicate links, leases, RLS and unlinking. No real wallet or transfer is required for these tests.
