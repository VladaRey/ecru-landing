# ecru-landing

The landing page for Ecru, an offline personal wardrobe app.

Plain HTML and CSS, one page per language. `node build.js` renders
`src/index.html` against each `i18n/<lang>.json` into `dist/` — no
dependencies, nothing to install. Open `dist/index.html` in a browser;
paths are relative, so `dist/uk/index.html` works over `file://` too.
Pushing to `main` builds and deploys to
https://vladarey.github.io/ecru-landing/

## Languages

The page ships in English at the root and Ukrainian under `/uk/`. There is no
runtime language switching and no redirect on `navigator.language`: each
language is a separate static page with its own URL, its own `<html lang>`,
its own canonical link, and `hreflang` links to the others.

- `src/index.html` — the template. Every translatable string is a `{{key}}`
  named after its place on the page (`hero.title`, `faq.cost.q`,
  `manifesto.server.p2`), so the template reads as a table of contents.
  Markup inside a string (`<em>`, `<strong>`, `&nbsp;·&nbsp;`) lives in the
  dictionary with the string, because that is where it belongs to the
  sentence.
- `i18n/<lang>.json` — one flat dictionary per language, same keys in all of
  them. The build fails with a non-zero exit code if any dictionary is missing
  a key or carries one the template no longer uses, and it names every
  mismatch at once rather than the first.
- Keys starting with `@` — `@lang`, `@base`, `@canonical`, `@alternates`,
  `@langswitch` — are filled in by the build, not by a translator, and never
  appear in a dictionary.

**Strings prefixed `quote.` are not translated.** They quote the app's own
interface — the pairing reasons, the fitting-room verdicts — so they are
copied verbatim from the app's locale (`src/i18n/locales/<lang>.json` in the
app repo). Translating them from English would put sentences on the page that
the Ukrainian app never says.

To add a language: add its code to `LANGS` in `build.js`, put its endonym in
`LANG_NAMES` beside it, and drop `i18n/<code>.json` next to the others. The
folder, the `hreflang` links and the switcher all follow from that — nothing
is duplicated by hand.

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
- **The language switcher.** On no artboard at all — the canvas was drawn
  before the page had a second language. It is kept as quiet as possible:
  mono, small, the same colour as the nav links. It sits in the header above
  64rem and in the footer at every width, because below 64rem the header hides
  its links and the footer is the only place a phone can reach it.

## Wiring the waitlist form

The form currently posts nowhere. To connect it, set one attribute in
`src/index.html` — search for `data-endpoint`:

    <form class="waitlist" data-endpoint="">

Put a Formspree endpoint (`https://formspree.io/f/xxxxxxx`) or a Buttondown
one in the attribute. Both forms on the page carry the attribute; set both.

The messages the form shows a visitor are not in `waitlist.js`. They ride
along in `data-msg-*` attributes next to `data-endpoint`, filled from the
dictionary like everything else, so the script never needs to know which
language it was opened in.

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
- `assets/fonts/ibm-plex-serif-400-cyrillic.woff2` — the one exception to
  "headings are Instrument Serif". Instrument Serif has no Cyrillic at all —
  not a missing subset, missing glyphs — so every heading on `/uk/` would
  quietly fall through to Georgia. IBM Plex Serif carries the Cyrillic
  headings instead, declared as `Ecru Display Cyrillic` and restricted by
  `unicode-range` to Cyrillic only, which is why the English, Polish and
  German pages do not shift by a pixel. Plex is already on the page, so the
  type system stays one family. Its OFL is the same licence file as Sans and
  Mono.
- `assets/shots` — the ten phone captures from the design canvas, real screens
  of the app on an Android emulator with a seeded 16-item wardrobe. `.webp`
  next to `.jpg`, same base name.

Asset paths are relative because the site is served from `/ecru-landing/`, not
from a domain root.
