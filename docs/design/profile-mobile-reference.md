# Mobile profile reference

Reference: `/Users/jakezheng/Downloads/Beri Bounty Pirate Profile UI.png`.

The mobile composition uses a separate harbor panorama, responsive parchment panels, a live profile editor, a scrollable tab bar, poster carousel, ranking and achievement panels, and a harbor footer. Existing Wanted Bounty branding and the shared mobile header are retained. Wallet data is real; sample posters and rankings remain explicitly labeled. Profile edits are saved on this device, not to a server.

## Elements

- `public/scene/profile-mobile-harbor-v2.png`: clean mobile harbor and footer artwork, generated with the built-in image-generation tool using the supplied reference.
- `public/textures/profile-parchment-plain-v2.png`: reusable torn parchment border and fill.
- `src/components/ProfileIcon.tsx`: individual vector icons.
- `src/ProfileMobile.css`: mobile and tablet composition, scoped below 1101px.
- `src/ProfilePage.tsx`: interactive content with carousel measurement that responds to resizing.

Four posters appear on wider mobile/tablet screens. Below 600px, two posters appear per carousel page to keep controls readable. Arrows, swipe scrolling, and pagination track the current page. Reduced-motion preferences are respected.

## Background prompt

Use case: precise-object-edit. Input is exact mobile pirate profile dashboard reference, portrait 880x1786 composition. Create clean BACKGROUND ART ONLY, keeping the same vintage ink engraving and muted warm gold parchment/blue sea palette. Keep the top narrow parchment header at y0..85 but REMOVE all header text, logo, wallet and menu. Preserve exact harbor panorama at y85..265 with large castle island center-left, black skull-sail ship to the right, side wooden docks and ropes. Remove ALL UI from y265..1640: profile portrait, name strip, text, buttons, icons, stats, tabs, posters, leaderboard and achievements. Replace these foreground panels with one uninterrupted pale warm lightly textured parchment field, surrounded by narrow original wood/rope dock edges at far left and right. No panel dividers. Keep detailed bottom scene at y1640..1786: red pirate flag left, sea and dock crates, seagull on right, and small central blank parchment scroll. Remove all text from that bottom scroll. Do not add lettering, avatars, UI, cards or new objects. Output full bleed portrait background, preserving skyline, footer and border framing positions as exactly as possible.
