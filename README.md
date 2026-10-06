# ecru-landing

The landing page for Ecru, an offline personal wardrobe app.

Plain HTML and CSS, one page per language. `node build.js` renders
`src/index.html` against each `i18n/<lang>.json` into `dist/` — no
dependencies, nothing to install. Pushing to `main` builds and deploys to
https://vladarey.github.io/ecru-landing/

## Running it

```
npm run dev     # build, serve on :8000, rebuild on every edit
npm run build   # build dist/ once
npm test        # the whole suite
```

`npm run dev` takes `--port`, and `--no-watch` if you would rather rebuild by
hand. Serve it rather than opening the file: paths are relative, so
`dist/uk/index.html` renders fine over `file://`, but the language switcher
points at folders (`uk/`) and a browser answers those with a directory
listing instead of the page.

## Languages

The page ships in English at the root, and Ukrainian, Polish and Spanish under
`/uk/`, `/pl/` and `/es/`. There is no runtime language switching and no
redirect on `navigator.language`: each language is a separate static page with
its own URL, its own `<html lang>`, its own canonical link, and `hreflang`
links to the others.

- `src/index.html` and `src/privacy.html` — the templates, one per page.
  Every translatable string is a `{{key}}` named after its place on the page
  (`hero.title`, `faq.cost.q`, `privacy.network.p1`), so a template reads as a
  table of contents.
  Markup inside a string (`<em>`, `<strong>`, `&nbsp;·&nbsp;`) lives in the
  dictionary with the string, because that is where it belongs to the
  sentence.
- `i18n/<lang>.json` — one flat dictionary per language, same keys in all of
  them, shared by both pages. The build fails with a non-zero exit code if any
  dictionary is missing a key or carries one no template uses any more, and it
  names every mismatch at once rather than the first. "Used" is counted across
  all templates together: a key only the privacy page needs is not a stray key
  for the home page.
- Keys starting with `@` — `@lang`, `@base`, `@home`, `@canonical`,
  `@alternates`, `@langswitch`, `@store`, `@email` — are filled in by the
  build, not by a translator, and never appear in a dictionary.
- `PAGES` in `build.js` lists the pages. A page's `dir` is three things at
  once: the folder inside `dist`, the tail of the URL, and the depth relative
  paths are counted from. `{{@base}}` reaches the site root (`../../` from
  `uk/privacy/`), `{{@home}}` reaches the home page *of the same language*
  (`../`) — the two are not interchangeable, and mixing them up switches the
  visitor's language without saying so.

**Strings prefixed `quote.` are not translated.** They quote the app's own
interface, so they are copied verbatim from the app's locale
(`src/i18n/locales/<lang>.json` in the app repo). Translating them from
English would put sentences on the page that the Ukrainian app never says.

Where each one comes from, so a future edit knows what to re-copy rather than
reword:

| page key | app key |
| --- | --- |
| `quote.reason1` | `reason.fit.neutralAligned` |
| `quote.reason2` | `reason.fit.warmer` |
| `quote.reason3` | `reason.fit.brighter` |
| `quote.reason4` | `reason.fit.lighter` |
| `quote.verdict.yes` / `.maybe` / `.no` | the fitting-room verdicts |

The four `reason.*` lines used to be `reason.pair.*` — the explanations for a
pair of items. Section 02 now shows one item's colour score, so they are the
`reason.fit.*` set instead: one that costs nothing, then one for each of the
three axes the app names. `wedge.p` beside them must use the same words for
those axes as the quotes do — temperature, saturation, lightness — or the
page contradicts the app two lines below its own claim.

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

A few things deliberately differ from the canvas:

- **The FAQ launch date.** The canvas has `[LAUNCH DATE — to fill in]`. The
  app has shipped, so that question is now "where do I get it?" and the answer
  points at the App Store.
- **The waitlist form.** Both artboards put an email field in the hero and in
  the closing call. The app is out, so both are an App Store button instead.
- **No button in the header.** The canvas has a call to action in the top bar.
  With one destination for the whole page, a third copy of the same button
  competed with the two that carry it; the header keeps the section links and
  the language switcher.
- **Screenshots in section 08.** Not on any artboard — the section is pure
  prose in the canvas.
- **The name disclaimer in the footer.** Not in the canvas, kept from the
  previous page. It stays until the name Ecru is cleared for trademark.
- **The language switcher.** On no artboard at all — the canvas was drawn
  before the page had a second language. It is kept as quiet as possible:
  small, the same colour as the nav links. It sits in the header above
  64rem and in the footer at every width, because below 64rem the header hides
  its links and the footer is the only place a phone can reach it.

## The privacy policy

`/privacy/` exists because App Store Connect will not accept a submission
without a privacy policy URL, and the reviewer opens it by hand. It ships in
all four languages like everything else (`/privacy/`, `/uk/privacy/`, …), from
`src/privacy.html` and the `privacy.*` keys.

The contact address is `CONTACT_EMAIL` in `build.js` —
`ecru.app.support@gmail.com`, a mailbox for the app rather than a personal one,
because an address on a public page gets harvested. It sits in `build.js` next
to `APP_STORE` for the same reason: an address is not a translatable string,
and four copies of it would drift apart at the first edit. A test holds it to
a real address, so a placeholder cannot reach the page the way it could reach
this file.

What the page says has to keep matching what the app does, and as of app
version 1.2 that is three places where something leaves the device: the update
check against `u.expo.dev`, anonymous usage statistics through PostHog, and —
only when the person turns weather on — a location rounded to about 11 km, sent
to Open-Meteo. All three are named in the policy, and tests hold every mention
in place.

App 1.2 adds no fourth. Its notifications are local — scheduled by the phone,
with no server and no push token — and its wardrobe backup is a file the
person hands to the iOS share sheet themselves, like a shared outfit picture.
The policy names both anyway (**Permissions** and **Backups**), together with
the new on-device data: the wishlist and planned outfits.

The site itself counts visits too, without cookies — see **Analytics** below;
the policy's **This website** section says the same, in all four languages.

Change what the app sends and this text is wrong before it is out of date —
along with the App Privacy declaration in App Store Connect, which the reviewer
reads against this very page.

## The App Store link

`APP_STORE` in `build.js` is the app's real listing:
`https://apps.apple.com/ua/app/ecru-wardrobe/id6807435125`. It is one
constant, filled into both buttons on all four pages through the `{{@store}}`
key. A test insists it point at a card with an `id…` in it, so the old
placeholder — `apps.apple.com/app/ecru`, which led nowhere and looked fine —
cannot come back unnoticed.

It sits in `build.js` beside `SITE` rather than in the dictionaries because an
App Store URL is not a translatable string. The `/ua/` in it is the country
path App Store Connect hands out; Apple picks the storefront by the visitor's
own account anyway, so one URL serves all four languages.

The button is not Apple's official badge image. That badge is a raster asset
served from Apple's site, and this page fetches nothing off the network and
draws everything else as vectors — so the logo is an inline SVG path and the
two lines of type are the page's own. The word **App Store** lives in the
template, not in a dictionary: it is a proper noun and is not translated. Only
the line above it is, as `store.pre` — "Download on the", "Завантажити з",
"Pobierz z", "Descárgalo en el".

There is no waitlist form and no email collected anywhere on the page, and
now nothing is recorded about the buttons either. They used to carry
`data-place` (`hero` or `finale`) to tell PostHog which of the two a visitor
clicked; that attribute went out with the analytics, since nothing else read
it.

## Analytics

The site counts visits in the same PostHog project as the app (EU region), so
"landing → App Store → first launch" sits in one place. Two files, both served
from this site: `assets/vendor/posthog.js` (posthog-js `array.no-external`,
vendored so the page fetches no code from anyone else's domain; MIT licence
beside it) and `assets/analytics.js`, which initialises it and wires the events.
The build adds both with `defer` to every page, library first.

What it records:

| event | when | properties |
| --- | --- | --- |
| `$pageview`, `$pageleave` | automatically | `$referrer`, `utm_*` from the URL, plus `site`, `lang`, `page` on every event |
| `$autocapture` | any click | element selector |
| `store_click` | an App Store button | `place` (`hero` / `finale`), `campaign` (the `ct` tag) |
| `section_viewed` | a section is 40 % on screen, once per load | `section` (`data-section`), `order` |
| `language_switched` | a link in the language menu | `to` |

What it does not: `persistence: 'memory'` keeps nothing in the browser — no
cookies, no localStorage — so the footer's "no tracking cookies" stays true and
no consent banner is needed; the cost is that every page load is a new
anonymous visitor. `$geoip_disable` keeps PostHog from working out a city or
country, session recording is off, and a browser that sends Do Not Track is not
counted at all. `docs/posthog-config.md` has the reasoning behind each option.

**App Store campaigns.** Independently of PostHog, `analytics.js` adds a `ct`
campaign tag to both App Store links — `<source>-<lang>-<place>`, where source
is `utm_campaign`, `utm_source` or `ref` from the URL, else the referring
domain, else `direct`. Fill `APP_STORE_PROVIDER_TOKEN` in `build.js` with the
`pt` value from App Store Connect (App Analytics → Sources → Campaigns) and
downloads per tag show up there. Share the page with `?utm_source=instagram`
(or `telegram`, `reddit`, …) and each channel becomes its own row in both
PostHog and App Store Connect.

Tests keep it honest: only these two local scripts and the JSON-LD blocks may
appear on a page, no `src="http…"`, and the init must stay EU, memory-only,
without recording and without GeoIP.

## SEO

- `<title>`, description, canonical and `hreflang` (with `x-default`) per page
  and language, as before.
- Open Graph and Twitter tags with a preview image per language
  (`assets/og/og-<lang>.png`, 1200×630) — links pasted into Telegram,
  Instagram or Slack show a card instead of a bare URL. Each card is the
  page's `hero.title` beside two real app screens (`outfits` and `suits`:
  outfits with their reasons, and a score opened into its explanation), so the
  preview shows what the app does, not just its name. Re-render them when
  those captures are retaken.
- `apple-itunes-app` — Safari on iPhone shows the App Store smart banner.
- JSON-LD on the home page: `MobileApplication` (iOS, free) and `FAQPage`
  built from the `faq.*` strings, so search can show the answers directly.
- `sitemap.xml` (all eight pages with their language alternates) and
  `robots.txt` pointing at it, both written by the build.

## Assets

Every asset is local — no CDN, no Google Fonts, and the analytics library is
vendored too. The only request that leaves for another domain is the
analytics data itself, to `eu.i.posthog.com`.

- `assets/fonts` — IBM Plex Sans, the only typeface on the page: body,
  headings (600, tighter tracking) and the places that used to be mono
  (eyebrows, fine print, numbers — the same Sans with tabular figures). It
  is variable, so one file per latin / latin-ext / cyrillic subset covers
  every weight, and `unicode-range` fetches a subset only when the copy uses
  it. The serif headings are gone on purpose: Instrument Serif has no
  Cyrillic, so `/uk/` needed IBM Plex Serif instead and the four languages
  never looked like one page. `tests/fonts.test.js` holds the page to a
  single family. The licence sits next to the files.
- `assets/shots` — the phone captures, `.webp` next to `.jpg`, same base
  name. They are being replaced one by one with real iPhone screenshots; the
  originals were the design canvas's Android emulator screens of a seeded
  16-item wardrobe.

  | file | screen | where | source |
  | --- | --- | --- | --- |
  | `today` | Home tab: weather, occasion chips, an outfit card | hero | **to retake for 1.2** — still the old wardrobe grid |
  | `dropper` | colour screen, picked by hand | 06 | **to retake for 1.2** |
  | `suits` | a score opened into its reasoning | 02 | **to retake for 1.2** |
  | `outfits` | Outfits tab: Suggestions · Saved · Collections | 01 | **to retake for 1.2** |
  | `builder` | outfit builder | 01 | **to retake for 1.2** |
  | `plan` | plan sheet: month, occasion chips | 03 | **to retake for 1.2** — still the old calendar |
  | `trip` | suitcase picture filling up, weather per day, list by category | 04 | **to take for 1.2** — a copy of the old calendar until then |
  | `colortype` | colour type result | 07 | **to retake for 1.2** |
  | `fitcolor` | fitting room, colour read and confirmed | 05 | **to retake for 1.2** |
  | `verdict` | fitting-room verdict with “Wishlist” | 05 | **to retake for 1.2** |
  | `shoot` | “How to take the photo” dialog | 09 | **to retake for 1.2** |
  | `card` | item page with the “When worn” card | 09 | **to retake for 1.2** |
  | `item` | item card with pair reasons | — | Android, unused |
  | `pairs` | item card with pair reasons | — | Android, unused |
  | `wardrobe` | wardrobe grid | — | Android, unused |

  **App 1.2 redesigned every screen**, so every capture on the page is due
  for a retake, and the alt texts already describe the new screens. `today`
  and `plan` are renamed placeholders (the old `grid` and `calendar`) until
  their captures land, and `trip` is a copy of the same placeholder — do not ship
  this branch before all three are real. The list of
  what to capture, with the app state for each, is in the app repo's
  `docs/app-store-release.md`, section 8.

  The three marked unused are superseded Android ones — `grid` replaced `wardrobe`,
  `suits` replaced `pairs` and then `item` — and are kept only because an
  unreferenced file costs a visitor nothing; delete them when you are sure.

  New captures come in at 1170×2532; they are resized to 540 wide to match
  the set, which puts each one back in the 24–50 KB range the others sit in.
  The iPhone screens are 540×1169 rather than 540×1200, so the `width` and
  `height` attributes on those `<img>` tags differ — they only reserve
  layout space, but a wrong pair means the page jumps when the image lands.

Section 08 was a wall of text with no screenshot at all and now carries two.
  Section 07 briefly carried one too, but the shot that fitted it — a score
  opened into its reasoning — argues section 02's point more directly, where
  it now sits beside the 92%-with-no-explanation card it contradicts. Section
  07 is two columns of prose again, by choice.
- `ecru-logo.svg` and `apple-touch-icon.png` — the favicon, at the root rather
  than in `assets` because that is where a browser and iOS look for it. Three
  `<link>` tags, one reason each: the SVG for current browsers, the PNG for
  Safari before 16.4, and `apple-touch-icon` for an iOS home screen, which
  does not read SVG at all. One PNG covers the last two.

  The PNG is the SVG flattened to 180×180 — every shape in the logo is an
  axis-aligned rectangle, so it was rasterised by exact pixel coverage rather
  than by a converter, and it is 663 bytes. Its corners are square on purpose:
  iOS applies its own rounded mask, and rounding under rounding would clip the
  orange corners to transparency. Redraw it from the SVG with any rasteriser
  if the logo changes.

  Note the SVG is 8.3 KB, of which 7.7 KB is C2PA provenance metadata; the
  drawing itself is 558 bytes. Stripping the metadata would make the favicon
  fifteen times smaller, at the cost of the content credential.

Asset paths are relative because the site is served from `/ecru-landing/`, not
from a domain root.
