# Sofiarcade

A little arcade of simple browser games, made for Sofia. Each game is self-contained,
touch-first, and playable at its own clean URL under **sofiarcade.com**.

## Layout

```
sofiarcade/
├── README.md           <- you are here
├── package.json        <- npm start -> node serve.js
├── railway.json        <- Railway build/deploy config
├── serve.js            <- static dev server (also works as a production server)
├── .claude/
│   └── launch.json     <- lets Claude Code launch the preview
└── site/               <- THE WEB ROOT: this is what gets deployed
    ├── index.html      <- landing page listing the games
    ├── _headers        <- cache/security headers for Cloudflare Pages & Netlify
    └── bubble-cat/     <- one folder per game
        ├── index.html
        └── README.md
```

`site/` is the web root. A folder at `site/<name>/` is served at `/<name>/`, so
`site/bubble-cat/index.html` is `sofiarcade.com/bubble-cat`.

## The games

| Game | URL | Notes |
| --- | --- | --- |
| [Bubble Cat](site/bubble-cat/README.md) | `/bubble-cat` | 3D tap-the-bubbles. Three.js, no assets, one file. |

## Run it

```bash
node serve.js
```

Then go to http://localhost:5178 for the landing page, or straight to
http://localhost:5178/bubble-cat for a game.

A game that is one self-contained HTML file can also just be opened from disk — but use
the server if the game fetches anything, since `file://` blocks that.

## Adding a game

No build step, no manifest to regenerate, no framework:

1. Make `site/<game-name>/index.html`. Keep the game self-contained where you can — the
   existing one generates its art and audio in code and pulls Three.js from a CDN.
2. Add a card to the list in `site/index.html`: copy one `<li>`, point `href` at
   `/<game-name>/`, and drop the `soon` class so it becomes playable.
3. Add a row to the table above, and a `README.md` in the game's folder if it grows
   enough to need one.

Two conventions worth keeping, because they are what make the games feel alike:

- **Touch-first.** `touch-action: none`, no scrolling, safe-area padding on the HUD, and a
  layout that works in portrait — these are phone and tablet games first.
- **The shared palette.** Sky `#8fd4f5`, orange `#ffb03a` → `#ff7a2f` with a `#d2551a`
  drop shadow, deep ink `#28455e`, leaf green `#3d5a2a`. They are declared as CSS
  variables at the top of `site/index.html`.

## Deploying

The site is fully static, so the simplest host is the right one.

### Cloudflare Pages (recommended)

Connect the repo, then set:

| Setting | Value |
| --- | --- |
| Build command | *(leave empty)* |
| Build output directory | `site` |

That is the whole configuration — no build, no environment variables, no server. Add
`sofiarcade.com` under **Custom domains**; if the domain is registered with Cloudflare the
DNS is wired up for you. `site/_headers` is picked up automatically and keeps browsers from
caching a stale copy of a game after a deploy.

Netlify works identically: publish directory `site`, no build command.

### Railway

`railway.json` and `serve.js` are kept so the Node deploy still works — **New Project →
Deploy from GitHub repo** and that is the setup. Railway detects Node from `package.json`,
runs `npm start`, and `serve.js` serves `site/`. There are no dependencies to install.

Two details that matter, both already handled in `serve.js`:

- **It listens on `process.env.PORT`.** Railway assigns the port at runtime; a server
  hardcoded to 5178 will never receive traffic.
- **It binds `0.0.0.0`, not `localhost`.** A container listening only on `127.0.0.1` is
  unreachable from outside, and the deploy looks healthy while serving nothing. This is
  the single most common reason a Railway deploy "succeeds" but the URL times out.

For a static site this buys you nothing over Cloudflare Pages and costs a running
container, so prefer Pages unless a game eventually needs a real backend.

## Sofi Learn

`/learn/` is a dependency-free learning hub for shared play, ages 2–4. It has 35
short rounds across counting 1–5, letters A–F, colors, animals, shapes, and objects.
The content lives in `site/learn/content.js`; interactions live in `game.js`.
Home and learning share `site/garden.css`. Bubble Cat remains self-contained.

Tap animals to count them once each. Three shuffled answers allow gentle retries,
then an explicit Next button lets the child control the pace. Help points to the
answer. Every world finishes with replay and world-selection choices.

Spoken prompts use the browser's English speech voice; the speaker button starts
or repeats a prompt when arriving through a direct link. Animal calls are spoken,
not recordings. Success chimes use Web Audio. Mute is saved on this device when
local storage is available. Browsers without speech still show every instruction.
No accounts, analytics, progress collection, external assets, or dependencies were
added to Sofi Learn. Reduced-motion preferences disable decorative animation.

### Checks

- `npm test`: lesson coverage, unique answers/distractors, shuffle positions, counting.
- `npm run check`: JavaScript syntax checks.
- `npm start`: run the existing static server. No build step is needed.

Manual browser QA: all 35 rounds, wrong-answer retry, repeated animal taps,
completion/replay, hub navigation, mute persistence, mobile layouts, and Bubble
Cat start/pause/resume/home. Device voice quality should also be checked on the
intended phone/tablet; browser automation does not verify audible output.

Bubble Cat now has labeled Pause and Home controls during play. Home opens a
confirmation dialog and pauses the round. Stay here (or Escape) restores the prior
playing/paused state; Yes, go home ends the round and returns to the arcade.

The arcade home groups adventures into Games and Learning. Each category has its
own tile list, so future adventures can be added without exposing every learning
subject on the homepage. Sofi Learn retains the six-world subject hub inside.
Homepage-only artwork and styling live in `site/arcade.css` and `site/index.html`.
