# Responsive How It Works

References: `How BERI Bounty Works.png` and `Beri Bounty Responsive Pirate UI Mockup.png` supplied by the user.

The page has one component tree (`HowItWorksPage.tsx`) and one stylesheet. CSS Grid changes from three columns above 1100px, to two columns at 600–1100px, to one below 600px. Text wraps naturally; card heights grow with their content. There is no scaled full-page screenshot or hidden duplicate mobile page.

## Independent elements

- Generated `how-responsive-ocean-v3.webp`: clean sky, harbor, ocean and dock artwork; no UI or text.
- Generated `how-wave-tile-v1.webp`: repeatable ocean behind a variable-length card grid.
- Existing `how-mobile-elements.png`: transparent treasure, reward, payment and character illustrations, individually displayed through CSS sprite regions with their own proportions.
- Existing reusable torn parchment: card and banner edges use border-image, keeping edge thickness stable as panels grow.
- Live titles, numbered medallions, buttons, checks, leaderboard rows and footer lettering.
- Three existing CreatorPoster components form the wanted-poster fan.
- Shared Wanted Bounty header, current branding and mobile drawer remain consistent with the other pages.

The reference's unsupported promises are not copied: community rankings are explicitly illustrative, reward eligibility is governed by stonk.fun, and the controls link to actual profile, create and explore pages. Paid AI creation supports USDC, USDT and SOL. No claim is made that a submitted photo stays only in the browser.

## Generated background prompt

Use case: precise-object-edit. Reference image is the provided How BERI Bounty Works desktop pirate webpage. Create clean BACKGROUND SCENERY ONLY. Preserve its 1536x1024 composition and detailed vintage ink engraving, warm parchment clouds, vivid deep teal sea. REMOVE top navigation bar and ALL parchment panels, heading banner, cards, footer paper, UI text, emblems, numbered circles, coins, character portraits and buttons. Inpaint their areas naturally with scenery. Upper third: preserve big pirate ship at far left, little sailing ship mid-left, large castle island at right, birds, blue sky and cream clouds. Middle: uninterrupted ocean waves with no cards or foreground objects. Bottom corners: preserve wooden docks, barrels, ropes, red skull pirate flag left, and wooden sign right but without any lettering. No words, UI panels, logos, text or placeholder boxes. Full bleed high detail landscape artwork. This will be behind separate live HTML elements.

## Generated ocean prompt

Asset type: seamless repeatable website background texture. Create a square tile of vintage pirate manga engraved ocean waves viewed from a slightly elevated angle. Entire canvas is only deep teal blue sea, dense fine black ink lines and ivory cream foam, warm aged paper grain, matching the provided reference. No sky, land, horizon, ships, lettering, panels or objects. Flat evenly lit texture with consistent scale and detail all across so it repeats vertically behind responsive parchment cards. Avoid giant dramatic wave peaks. 1024x1024.

Both assets used the built-in image-generation tool with the desktop reference. Original generated files remain in the Codex image output folder; project copies are in `public/scene/`.
