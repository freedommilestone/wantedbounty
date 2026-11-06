# Character energy — progression V1.3

The 100 rows in `src/energy/progression.json` were extracted from the supplied Energy Progression Master List V1.3. The same values are seeded in `public.energy_levels`. EP/day is the authoritative integer rate; the PDF's EP/hour figures are rounded display values.

## Current integration status

The progression tables, reserve accounting, server-only mutation functions, dashboard display, and Supabase Realtime subscription are implemented. The database migration has been applied. Frontend/API changes are not yet published.

**Approved rules:** at least 1 BERI; include historical holdings from token launch. `BERI_HISTORY_START_DATE` defaults to `launch`. An optional server-only YYYY-MM-DD cutoff can be used for a future reviewed policy; an existing checkpoint refuses a changed cutoff rather than silently rewriting permanent awards.

Finalized balance checks activate regeneration through `sync_wallet_energy`. Historical levels come from `server/holding-history.js`, using the configured `SOLANA_HISTORY_RPC_URL` and Helius `getTransactionsForAddress`. The pipeline replays successful transactions oldest-first, includes token-account activity, checks per-account balance continuity (including closure/ownership changes), and reconciles the aggregate and individual accounts with a finalized snapshot. Only complete, reconciled checkpoints award levels. A holding day is a full 24 hours, and a balance below 1 BERI breaks the run even if refilled the same day. The highest level remains permanent.

`wallet_holding_history` stores a private checkpoint and resumable paginated job, guarded by an expiring token-bound lease. Requests save at most one 1,000-transaction page; the daily cron continues pending backfills within its runtime budget. Later checks only replay transactions after the last checkpoint. Failed/malformed pages preserve confirmed progress. No history is inferred from the current balance or the legacy UTC daily-observation counter. Mint history before the provider's token-account coverage boundary (slot 111,491,819) is refused rather than advertised as complete. No retroactive energy credits are minted for pre-verification holding time; history upgrades the permanent level/cap/rate.

Regeneration eligibility follows the latest finalized **balance observation**, with a maximum 26-hour window to cover the daily cron's scheduling window. An observed drop below 1 BERI or unlink immediately pauses future regeneration; failed checks allow the current window to expire. This is periodic balance eligibility, not second-by-second transaction-event enforcement of regeneration. Historical streaks use transaction history separately. Any future game that requires exact intra-check accrual boundaries must reconcile eligible transaction intervals before spending; it must not treat the daily eligibility window as exact continuous proof.

The Vercel variable name `SOLANA_HISTORY_RPC_URL` exists, but sensitive production values are not exportable to local development. Provider connectivity/plan support must be verified in the deployed environment before reporting historical backfills as operational. No new production deployment has been made as part of this work.

## Storage and accounting

- `player_energy`: one character-owned reserve, permanent highest unlocked level, best eligible holding days, regeneration window, settlement time and monotonic revision.
- `energy_events`: server-awarded/spent EP, unique per-player event key, requested/applied amounts, resulting balance and reason. Retrying a key does not apply the event twice; reusing a key with different parameters is rejected.
- One EP is 86,400,000,000 integer units. Microseconds elapsed multiplied by EP/day gives exact fractional accrual without rounding hourly credits. Settlement advances at full capacity so discarded overflow cannot be redeemed later.
- New characters start with 500 EP. Existing balances are preserved, including the old 8,400 balance. Over-cap legacy reserves cannot grow. Spending gradually removes the grandfathered ceiling; normal caps apply once below capacity. No extra transferable balance is created.
- Expired or disabled eligibility stops future accrual without erasing existing energy or permanent levels. A trusted holdings pipeline must provide the verified best duration and bounded validity window. No browser can set them.
- RLS allows players to read only their reserve/events. All mutation functions are invoker-security and executable only by the server service role. Browser clients cannot spend/award arbitrary amounts or set levels.

## Game-handler integration

After validating a real game action, its skill requirements, completion time, and any existing active action, the trusted game handler calls `apply_player_energy_event(p_user, p_key, p_delta, p_reason)` using a server-defined integer cost/reward and a stable authoritative action/reward ID. Negative deltas reject insufficient funds; positive deltas stop at capacity. Amounts must be within -10,000 to 10,000 EP per event.

The PDF does not supply concrete action costs, skill thresholds, or durations. This change does not invent playable activities or expose a public arbitrary spend/credit endpoint. Future timed activities must atomically enforce one active action per character before exposing their controls.

`GET /api/energy` validates the signed-in, email-confirmed account and settles only that character's reserve. The dashboard receives own-row Supabase Realtime updates, ignores stale revisions, projects regeneration for display with a monotonic server-synced clock, and syncs on reconnect/visibility and every minute as fallback. The server remains authoritative for spending.

## Validation

- `tests/energy.test.mjs`: progression milestones, display caps/pauses/expiry, legacy balance preservation, authenticated identity and rejection of client mutation requests.
- `supabase/tests/character_energy.sql`: rollback-only checks for exact fractional accrual, repeated settlement, duplicate/conflicting event IDs, overspending, overflow, eligibility expiry, permanent levels, preserved legacy balances, RLS and function grants.
- `tests/holding-history.test.mjs`: threshold boundaries, intra-day/intra-slot breaks, account aggregation/closure/ownership, v0 addresses, page resumption, incremental checkpoints, gap/reconciliation rejection, and provider failure preservation.
- `supabase/tests/historical_energy_holdings.sql`: historical upgrades on the same observation, lease exclusion, cursor resumption, incomplete-backfill handling, pause/unlink behavior and private indexing state.
- Browser checks cover Realtime spend/credit updates, stale-event rejection, all 100 table rows, and responsive layouts from 320 to 1440px.
