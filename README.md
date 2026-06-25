# Joseph Story Quest

A small browser game prototype for learning the story of Joseph from Genesis 37-50.

## What is included

- Six story modules covering Joseph's journey from his dreams to reconciliation with his family.
- A story view, quiz check, and 3D game slot for every module.
- A playable Three.js mini-game in module 1: collect Joseph's dream stars before time runs out.
- Responsive layout for desktop and mobile.

## Run locally

Use any recent Node.js runtime:

```sh
node server.mjs
```

Then open:

```txt
http://127.0.0.1:4173
```

The Three.js browser module is vendored in `vendor/three.module.js`, so the app does not need a CDN at runtime.

## Extend the game

Story content lives in `src/storyData.js`. Add or edit modules there.

The first mini-game is implemented in `src/main.js` as the `collect` game type. The remaining modules already have locked game slots, so the next step is to add new game types such as caravan navigation, stewardship sorting, dream-symbol matching, grain storage, and family reunion delivery.
