# Kiro fork

This fork is Archify with a Kiro brand layer. Every Archify style (Classic,
Signal Flow, Blueprint, Editorial) and both color modes use Kiro's colors,
rounded tag chips, and the Kiro ghost. Readers still pick the style and mode.

## What the fork changes

Kept as add-on blocks so upstream merges stay clean. The only upstream-owned
source file touched is `viewer/template.source.html`, in two self-contained
spots:

- A separate `<style>` element headed `KIRO BRAND`, just before `</head>`. It
  holds the whole brand layer (palettes, tags, ghost). Because it is its own
  element placed after Archify's styles, it wins the cascade without editing
  any upstream rule.
- `<span class="kiro-ghost" aria-hidden="true"></span>` right after
  `<!-- ARCHIFY:SVG_SLOT_END -->`.

Fork-only files: `KIRO.md` and `scripts/kiro-regenerate.mjs`.

Everything else in the diff is regenerated output (the built template,
examples, gallery, docs pages, README showcase), plus the brand block and ghost
copied into the hand-maintained `examples/web-app.html` by the regenerate script.

## Pulling upstream

```sh
git fetch upstream            # git remote add upstream git@github.com:tt-a1i/archify.git
git merge upstream/main
```

Real conflicts can only occur at those two spots. Generated files
may also conflict; take upstream's version and rebuild, as upstream's
CONTRIBUTING.md asks:

```sh
git checkout --theirs -- <generated files>
(cd archify && npm ci)
node scripts/kiro-regenerate.mjs
(cd archify && npm test) && (cd website && npm ci && npm run build && npm test)
git add -A && git commit
```

`build-readme-showcase.mjs` needs ffmpeg and Chrome. If Chrome cannot start its
sandbox, point `ARCHIFY_CHROME` at a wrapper that adds `--no-sandbox`.

## Invariants

- Leave `data-theme` off the diagram's svg element. The brand palettes use
  `[data-preset][data-theme]` selectors, which would then outrank the resolved
  variables `viewer/export.js` injects for standalone exports.
- The ghost is page chrome outside the SVG. It never appears in exported
  SVG, PNG, or share cards, it is hidden in embeds and print, and it holds still under reduced motion.
