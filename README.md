# ecru-landing

The landing page for Ecru, an offline personal wardrobe app.

Plain HTML and CSS. No build step: open `index.html` in a browser.
Pushing to `main` deploys to https://vladarey.github.io/ecru-landing/

## The design

The page is a build of the Claude Design canvas **“Ecru Landing”**
(`claude.ai/code/artifact/05f9d073-8ced-47a2-9d6b-0a5ea4c1f211`), which holds
two artboards — desktop at 1440 and phone at 390. Everything between those two
widths is `clamp()` interpolated from the two artboards, so the page tracks the
design at any viewport instead of snapping between two hand-tuned states.

The canvas is the source of truth for type, colour and spacing. If it changes,
change this page to match rather than the other way round.

Two things deliberately differ from the canvas:

- **The FAQ launch date.** The canvas has `[LAUNCH DATE — to fill in]`. Rather
  than ship a placeholder, the answer says there is no date to promise yet.
  Replace it when there is one.
- **The name disclaimer in the footer.** Not in the canvas, kept from the
  previous page. It stays until the name Ecru is cleared for trademark.

## Wiring the waitlist form

The form currently posts nowhere. To connect it, set one attribute in
`index.html` — search for `data-endpoint`:

    <form class="waitlist" data-endpoint="">

Put a Formspree endpoint (`https://formspree.io/f/xxxxxxx`) or a Buttondown
one in the attribute. Both forms on the page carry the attribute; set both.

## Assets

Everything is local — no CDN, no Google Fonts, no external request of any kind.
That is not tidiness: the page promises the app talks to no server, and a call
out to `fonts.gstatic.com` on first paint would undercut the promise on the
first screen.

- `assets/fonts` — Instrument Serif (headings), IBM Plex Sans (body), IBM Plex
  Mono (eyebrows and fine print), sliced into the same latin / latin-ext /
  cyrillic subsets Google Fonts serves. `unicode-range` means a subset is only
  fetched if the page actually uses it, so latin-ext and cyrillic cost nothing
  until the copy needs them. IBM Plex Sans is variable — one file per subset
  covers every weight. Licences sit next to the files.
- `assets/shots` — the ten phone captures from the design canvas, real screens
  of the app on an Android emulator with a seeded 16-item wardrobe. `.webp`
  next to `.jpg`, same base name.

Asset paths are relative because the site is served from `/ecru-landing/`, not
from a domain root.
