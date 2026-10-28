# Desktop profile reference artwork

Reference: `/Users/jakezheng/Downloads/Beri Bounty in vintage tones.png`.

Created with the built-in image-generation tool. Foreground content is live React/CSS, not flattened screenshot text. The existing Wanted Bounty branding, real wallet balances, and explicit sample collection/leaderboard labels are retained.

## Assets

- `public/scene/profile-desktop-harbor-v2.png`: clean harbor/dock scene.
- `public/textures/profile-parchment-v2.png`: transparent profile parchment with cloud/bird detail.
- `public/textures/profile-parchment-plain-v2.png`: blank transparent parchment, used with CSS border-image to keep the edges from stretching.
- `src/components/ProfileIcon.tsx`: independent vector dashboard illustrations.

## Prompts

### Harbor

Use case: precise-object-edit. Input image is the exact desktop profile design reference. Create its clean BACKGROUND ART ONLY for a responsive website. Keep the 1536x1024 landscape composition, vintage ink engraving, warm pale gold parchment and desaturated blue sea. Preserve the exact narrow panoramic harbor band across y75..260: ships, twin island cities, clouds, skyline. Preserve the left edge dock with lanterns, barrels, crates, ropes and wanted papers, the bottom edge dock and waves, and the right wooden sign reading DIFFERENT STORIES. ONE CREW. Remove the entire top navigation header (replace with plain warm parchment, no logo or text), and REMOVE all the foreground UI parchment panels in y240..990: sidebar, profile card/avatar, statistics, gallery, ranking, achievements, every UI icon, button and text. Inpaint the areas behind those removed panels with subdued matching dock wood, crates and harbor water so independent HTML panels can be placed above them. Do not add new foreground panels, portrait faces, UI labels or buttons. Preserve reference's subdued color grading, highly detailed linework, framing and exact skyline position. Output a clean full-bleed 1536x1024 background.

### Profile paper

Use case: precise-object-edit. Reference is a pirate profile dashboard. Produce ONE standalone empty parchment panel matching exactly the central profile paper at x235..1100 y250..600 in the attached design. Crop out all surrounding interface and scenery, remove the avatar, badges, text, statistics, buttons, icons and name strip. Keep warm ivory golden parchment, subtly mottled fibers, fine ink etched cloud and bird details near right margin, irregular dark burnt torn edges, slight curled corners. Broad clean lightly textured middle area for live website text. Landscape ratio 2.45:1. No words, no lettering, no numbers, no photo, no UI controls, no interior boxes. Outside irregular paper edge must be genuinely transparent. High resolution.

### Plain paper

Use case: precise-object-edit. Edit target is this standalone empty parchment panel. Remove only the birds and cloud engraving on right. Replace them with matching clean softly mottled warm ivory-gold paper. Keep exact paper shape, torn edge, curled corners, texture, color, lighting, and transparent exterior unchanged. No text, symbols, icons, boxes or new objects. This is a blank reusable responsive website panel.

