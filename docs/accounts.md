# Wanted Bounty accounts

Accounts use Supabase email/password Auth in the Wanted Bounty project. The `/account` page provides signup, login, confirmation landing, password reset, and logout. Email confirmation is required before preparing a paid poster order. Wallet access remains separate for crypto payments and BERI balance lookup.

Supabase Dashboard → Authentication → Users contains email, account ID, creation/sign-in timestamps, and user metadata. Passwords are hashed by Supabase Auth; the application never writes plaintext passwords into a table or logs. Authentication events are recorded by Supabase Auth. Profile name, story, and a resized avatar are stored in the user's metadata. This metadata is display content, never an authorization source.

The browser uses the project's public publishable key. Optional `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` overrides must identify the same project as the server's `SUPABASE_URL`. `SUPABASE_SECRET_KEY` stays server-only. Node 22 is required.

Configure Supabase Auth Site URL as `https://www.wantedbounty.xyz`, with redirects `https://www.wantedbounty.xyz/account` and `https://www.wantedbounty.xyz/account?mode=recovery`. Configure custom SMTP for delivery to public users. Local email testing additionally requires localhost account redirects in the allowlist.

New orders record the verified Supabase user ID in `poster_orders.details.accountId`. The server verifies bearer tokens through Supabase Auth, enforces email confirmation, and checks order ownership on status/generation requests. Existing orders without an account ID retain their original recovery-token access so paid orders are not stranded. Poster storage remains private with no public RLS policies.

Validation: Node unit tests cover missing, expired, unconfirmed and wrong-account access, plus payment verification and legacy order recovery. Browser tests simulate Supabase responses for signup/login/reset/signout and profile persistence. Real email delivery and a real confirmed-account checkout require an end-to-end smoke test after deployment; no test emails or paid generations are sent automatically.
