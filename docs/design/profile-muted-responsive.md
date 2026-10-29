# Muted responsive profile dashboard

Reference: `/Users/jakezheng/Downloads/Muted parchment nautical dashboard.png`.

The profile uses one interactive component tree and one responsive stylesheet, `src/ProfilePage.css`. The old layered `ProfileDesktop.css` and `ProfileMobile.css` overrides have been removed. The shared Wanted Bounty branding and navigation remain in place.

The harbor, paper panels, portrait, name ribbon, statistics, posters, ranking rows, achievements and buttons are independent elements. Existing scenery and parchment assets are reused with scoped CSS color grading. Decorative paper layers are separated from text so their muted treatment does not reduce text contrast. Panel edges use border-image rather than scaling a full interface screenshot.

Desktop uses a sidebar, central profile/gallery column and community column. At intermediate desktop widths the new-poster tile moves below the four posters. At 1100px and below, navigation becomes a scrollable tab strip and the community panels move under the profile. Below 651px, statistics become a two-column grid, community panels stack, and the poster carousel shows two cards. Text and panel heights remain content-driven.

Profile editing and photo upload retain their existing device-local storage. Poster Edit/Hide actions remain interactive sample actions. The new ellipsis button opens options to change the main sample poster or edit its name; clicking outside or pressing Escape dismisses it. Wallet balances are read from the connected wallet. Unavailable rank/reward data is not replaced with the reference's fictional balances. Samples and milestone previews remain labeled.

Validation: production build passes. Chrome checked at 320, 390, 650, 768, 1100, 1101, 1280, 1536 and 1920px with no horizontal page overflow or runtime errors. Profile editing, refresh persistence, poster editing, Hide/Show, menu dismissal, mobile carousel pagination, tab navigation and resizing were exercised at phone and desktop widths. Reduced-motion and keyboard-focus styles are included.
