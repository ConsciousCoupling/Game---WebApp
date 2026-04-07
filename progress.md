Original prompt: i have a number of changes i'd like you to help me make:
1- add a custom font
2- add a notification with sound when its your turn
3- add better instruction cues to various screens
4- prevent th non-playing player from flipping the coin during the coin toss
5- add durations to all default activities
6- round the corners of the game die slightly
7- add a dice rolling sound
8- add a coin flip sound

2026-04-05
- Scoped the request into gameplay behavior, UI copy, default data, and die presentation.
- Blocker: the repo references custom fonts in CSS, but the actual font files are missing and no target font was specified.
- Blocker: default activity durations are not defined anywhere in the repo, so adding them requires user-provided values instead of guessed timings.
- Proceeding with the fully specified changes first: turn notifications, sound effects, instruction cues, coin toss gating, and die corner softening.
- Implemented synthesized turn/dice/coin sounds with browser notification support and temporary document-title turn alerts.
- Tightened gameplay interaction gating so the coin toss is visibly locked for the non-active player; also disabled non-active activity-shop and coin-outcome buttons to avoid fake clicks.
- Improved cue copy on gameplay, activity editing/review, waiting, and summary screens.
- Softened the die geometry by switching to a rounded box mesh and reduced face engraving size to fit the rounded edges.
- Added the requested custom font mapping using copied local TTFs in `public/fonts`: body text uses caps, headings use open block, and buttons use the fun face.
- Tuned the font coverage so class-based buttons, labels, badges, names, and gameplay phase banners also inherit the intended font roles instead of falling back to body text.
- Verified `npm run build` and `npm run lint` both pass.
- Attempted browser/screenshot verification, but the environment lacked usable Playwright artifacts and the fallback OS screenshot flow stalled at the local permission layer.
