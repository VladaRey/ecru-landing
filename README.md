# ecru-landing

The landing page for Ecru, an offline personal wardrobe app.

Plain HTML and CSS. No build step: open `index.html` in a browser.
Pushing to `main` deploys to https://vladarey.github.io/ecru-landing/

## Wiring the waitlist form

The form currently posts nowhere. To connect it, set one attribute in
`index.html` — search for `data-endpoint`:

    <form class="waitlist" data-endpoint="">

Put a Formspree endpoint (`https://formspree.io/f/xxxxxxx`) or a Buttondown
one in the attribute. Nothing else needs to change.

## Assets

Everything is local — no CDN, no Google Fonts. Asset paths are relative
because the site is served from `/ecru-landing/`, not from a domain root.
