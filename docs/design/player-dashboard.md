# Player dashboard

`/dashboard` recreates the captain’s quarters from `04_Player_Dashboard.png` as responsive React components: sidebar navigation, greeting and faction flag, four stat cards, wanted identity, adventure card, and player menu. Text, buttons, stats, and the shared wanted poster remain live elements. Current Wanted Bounty branding is retained. Desktop uses the reference's side-by-side composition; narrow screens use scrollable section navigation, two-column stats, and stacked content. Hover/press/focus states respect reduced-motion preferences.

Saved player names and faction flags come from the authenticated player's Supabase record. Starting state is bounty 0, energy 8,400, level 1, progress 0%, no rank, no fighting style, and no Devil Fruit. Game state is server-owned: the browser has no column grants to change it. Character/profile navigation and section controls work; expedition rewards, fruit discovery, marketplace, and community rankings are not implemented and their panels explicitly say so.

Sign-in resolves the saved allegiance before navigating: an existing choice opens `/dashboard`, otherwise `/allegiance`. Revisiting the chooser with a saved faction immediately redirects without rendering the selection cards. A failed record lookup opens a retry state, not a new choice. Recovery URLs remain accessible. Confirmation is permanent at the database level, including direct REST requests, with same-choice retries idempotent. A concurrent choice in another tab reloads the saved record.

Migration `supabase/migrations/20261105231916_player_dashboard_and_faction_lock.sql` was applied to the connected Wanted Bounty project. `supabase/tests/player_dashboard.sql` verifies starting stats, one-time selection, immutable choice/timestamp, protected stats, owner-only access, and metadata synchronization, rolling all temporary users back.

## Artwork

Separate generated assets:
- `public/scene/player-dashboard-coast-v1.webp`: blank parchment scenery, wheel/deck and edge coastline.
- `public/scene/uncharted-seas-v1.webp`: adventure islands illustration.

The built-in image generator used the supplied dashboard reference, then Sharp compressed the outputs to WebP. Existing transparent allegiance flags, shared poster, default Luffy portrait, paper/button textures and logo are reused. No page text or interactive control is baked into the new images.

Backdrop prompt:

> Use case: precise-object-edit. Produce ONLY a blank illustrated page background based on this supplied vintage pirate player dashboard. Remove all lettering, logos, header menu, avatar, flag, panels, cards, sidebar buttons and icons. Keep the warm aged cream parchment, fine brown map etchings, small seabirds, tiny coastline and water accents along far right and bottom edges, and the beautifully detailed wooden ship wheel and dark timber deck at the bottom left. Empty light parchment through the center and top, suitable for readable live website content. Wide landscape 16:10. No UI panels or text, no characters, no flags. Preserve reference hand-inked anime nautical style and crisp thin weathered outside border.

Adventure illustration prompt:

> Use case: illustration-story. Create a standalone wide horizontal landscape illustration matching the small 'Your next adventure' picture in the supplied vintage pirate dashboard. Show the Uncharted Seas: three rugged green and ochre islands in blue ocean with white hand-drawn wave crests, distant castle ruins/tower atop the right island, cream clouds and muted blue sky, a couple small flying seabirds. Warm weathered parchment grain, crisp vintage anime ink drawing, antique adventure map palette. Wide 3:1 composition, no text, no labels, no UI, no border, no characters. This is a website card illustration, not a screenshot of the page.

## Verification

Next.js production build and 43 existing Node tests pass. Browser checks covered widths 320, 390, 700, 744, 768, 1024, and 1440 pixels, long player names, all three faction labels/flags, section actions, player-menu dismissal, new-choice confirmation, saved-choice bypass, and failed-record retry. Separate mocked-auth checks verified both account-page and Play Game modal login routes for each saved faction and for an unselected player. Final visual checks used 744×468, 1440×900, and 390×844 viewports. Browser auth was mocked; no real signup emails or game transactions were sent.
