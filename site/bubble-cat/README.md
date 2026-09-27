# Bubble Cat

A 3D tap-the-bubbles game for kids, and the first game in [Sofiarcade](../../README.md).
Mochi the cat sits in the corner of a cartoon park blowing bubbles; you tap them to pop
them before they float off the top of the screen.

Lives at `/bubble-cat/` on the site. The whole game is this folder's `index.html`.

## Status

| | |
| --- | --- |
| Playable | Yes — menu, scoring, lives, combos, game over, replay |
| Engine | Three.js (loaded from CDN) |
| Assets | None — the cat, the park and the sounds are all generated in code |
| Build step | None — it is one HTML file |
| Tablet port | Not started; the game is already built for touch (see below) |

## Run it

Open this folder's `index.html` directly in a browser, or serve the whole site from the
repo root and visit http://localhost:5178/bubble-cat

```bash
node serve.js
```

## How it plays

- A bubble grows on the cat's wand, detaches, and drifts up and to the right with a wobble.
- Tap or click a bubble to pop it: **+1 point**, or **+2** once you are on a 3-in-a-row combo.
- A bubble that reaches the sky costs a heart. **Five hearts**, then game over.
- Spawn rate and rise speed ramp up the longer you survive.
- Best score is kept in `localStorage`.

## What's in the scene

- Cartoon park: rolling hills, a winding path, ten swaying trees, bushes, scattered
  flowers, a bench, drifting clouds, gradient sky.
- Mochi the cat: a **drawn 2D sprite**, not a 3D model. Ten frames are painted once at
  load with the Canvas 2D API and played back as a flip-book on a billboard plane that
  faces the camera. The cycle runs settle → inhale → puff → relax, with the cheeks
  swelling, the mouth opening into an "o", the brows lifting and the wand arm rising, so
  you can actually see the cat blowing each bubble. The sprite snaps to the blow frame
  whenever a bubble spawns, so the puff and the bubble coincide instead of drifting
  in and out of sync.
- Pops: coloured particle burst, a floating "+1", and a synthesized pop sound that
  pitches up as your combo climbs.

## Tuning knobs

All in `index.html`:

| What | Where |
| --- | --- |
| Lives | `MAX_LIVES` |
| How high a bubble must get to escape | `ESCAPE_Y` — **derived**, see below |
| Difficulty ramp | `spawnEvery` / `level` in the `STATE.PLAY` block |
| Bubble size, speed, drift | `spawnBubble()` |
| Bubble colours | `TINTS` |
| Camera framing (portrait vs landscape) | `resize()` |
| Cat's artwork | `drawCat2D()` |
| Cat's animation frames | `CAT_CYCLE` |
| Cat's size | `SPRITE.worldH` |
| Which way the cat faces | `SPRITE.flip` |
| Cat's corner placement | the anchoring block in `resize()` — **not** a fixed position |
| Old 3D cat (off by default) | `USE_SPRITE_CAT`, `buildCat3D()` |

### The escape line follows the camera

`ESCAPE_Y` is **not** a constant to tune by hand — `resize()` recomputes it from the
camera frustum every time the view changes. A closer camera shows less sky, and a
hardcoded line would mean bubbles vanishing well above the top of the screen (or
lingering past it) instead of being missed right as they leave view. If you move the
camera, the escape line follows on its own; what you may want to retune instead is the
bubble rise speed in `spawnBubble()`, since a shorter climb gives the player less time.

### Testing note

`requestAnimationFrame` pauses while the browser pane is hidden, so the game clock
freezes and nothing spawns. If you are driving this from a script and the state looks
stuck at zero, check that the pane is actually visible before concluding anything is
broken.

### The cat: 2D sprite, with the 3D one still in the box

`USE_SPRITE_CAT` at the top of the cat section switches between the drawn sprite
(default) and the original 3D model, which is kept intact behind the flag so the two can
be compared rather than the old one being lost. Flip it to `false` to see the 3D build.

How the sprite works:

| Piece | Where |
| --- | --- |
| The artwork itself | `drawCat2D()` — one function, painted in a 100 × 112 design space |
| The animation frames | `CAT_CYCLE` — each entry is `{puff, blink, lift, bob, hold}` |
| Building the textures | `buildCatSprite()` — renders each frame once at 6 px per design unit |
| Playback and billboarding | `animateCatSprite()` |
| Size and placement | `SPRITE.worldH` and `mesh.position` |

**The cat is pinned to the left edge of the frame**, not parked at a fixed world
position. `resize()` works out where the left edge of the view falls at the sprite's own
depth and places the cat there, so it stays in the corner across any aspect ratio or
orientation instead of sliding toward the middle on wide screens.

**`SPRITE.flip` mirrors the artwork** so the cat faces right and the wand points into the
open play area rather than off the edge. The mirroring is applied to the canvas while the
frames are being painted, not to the mesh, which keeps the mesh transform clean — but it
means the wand's horizontal position has to be mirrored too. That is what `wandU()` is
for; use it rather than `SPRITE.wandU` when working out where bubbles are born.

Two more things to know before editing it:

- **The wand ring must not move between frames.** `SPRITE.wandU` / `wandV` mark where the
  ring sits in the art, and `updateSpawnPoint()` maps that onto the sprite plane to work
  out where bubbles are born. If the ring drifts from frame to frame, bubbles will pop
  into existence away from the wand.
- **Each arc needs its own `beginPath()`.** The "w" mouth was originally two `arc()` calls
  in one path; the canvas joined them with a connecting line and the mouth filled in as a
  dark blob across the muzzle.

### Why the art is drawn rather than downloaded

CC0 cat art does exist — [Openclipart #331861](https://openclipart.org/detail/331861/cartoon-cat)
is a genuinely nice public-domain vector cat, and OpenGameArt has several CC0 cat sprite
sheets. None of them work here. Every one is a static pose or a platformer walk cycle;
none has a raised paw, a bubble wand, puffed cheeks or an open mouth. The found art would
have supplied the body only, and the entire performance — the part that actually sells
"this cat is blowing the bubbles" — still had to be drawn. At that point drawing the whole
cat is simpler and keeps it all in one consistent style.

### Things already tried on the cat's look

- **Cel shading** (`MeshToonMaterial` with a 4-step ramp) was built and removed. At this
  camera distance the crisp bands flattened the cat into a single orange mass and killed
  the rounded forms; smooth Lambert plus a cool rim light reads better. There is a
  comment where the ramp used to live, so nobody rebuilds it by accident.
- **Ears** have to be sunk deep into the skull with a fur blob packed around the base.
  A cone sitting on a sphere meets it at a hard edge and looks stuck on.
- **Camera distance** turned out to be the biggest lever, more than any geometry change.
  The camera now sits close enough that the cat reads as a character. Pushing in further
  crops the raised wand off the left edge, which is not cosmetic — the player has to see
  bubbles being born, so that is the practical limit.

### A note on keeping the cat a cat

The face is the whole illusion. A round head with a protruding snout reads as a dog
almost immediately, so the muzzle is deliberately two shallow whisker pads rather than
one long snout, and the skull is wider than it is deep with a small tapered jaw. The
other things doing the work: tall upright ears set close together, big almond eyes with
vertical slit pupils and an iris that nearly fills them, a triangular nose, and the
"w" mouth arcs. If the cat ever starts looking like a dog again, the snout and the ears
are the first two things to check.

### A note on posing the arms

Each limb is built by `bone()`, whose meat hangs down `-Y` from the joint, so rotating the
group swings the limb from its socket. That means `rotation.z` near `0` points the limb
straight **down**, and you have to go past `±PI/2` to raise it — the wand arm sits at
`-2.5`. The wand then counter-rotates every frame
(`wand.rotation.z = -(shoulder.z + elbow.z) - 0.3`) so it stays pointing skyward no matter
how the arm swings. Change the arm pose freely; the wand follows on its own.

## Porting to iPad / Android tablet

The game is already built for touch: `touch-action: none`, no scrolling, safe-area
padding on the HUD, pointer events with a touch fallback, a capped pixel ratio, and a
camera that reframes itself for portrait. Wrapping it is the only work left.

```bash
npm init -y
npm i -D @capacitor/cli
npm i @capacitor/core @capacitor/ios @capacitor/android
npx cap init "Pop The Bubble Game" com.example.popthebubble --web-dir=site/bubble-cat
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios      # or: npx cap open android
```

Two things to change before shipping a native build:

1. **Drop the CDN.** Download `three.min.js` into this folder and point the
   `<script src>` at it, so the game works offline.
2. **Lock the orientation** in `capacitor.config.json` (or in the native project) if you
   want portrait only. The layout handles both, but a fixed orientation plays better.

iOS needs a user gesture before audio can start; the Play button already provides it.

## Ideas for later

- More bubble types: a big slow one worth more, a tiny fast one, a rainbow bonus bubble.
- Swipe-to-pop as well as tap, so a child can sweep through a cluster.
- The cat reacting to misses (ears drooping) and to long combos (happy bounce).
- Background music, and a mute toggle in the corner.
- Levels or a timed mode instead of the endless ramp.
