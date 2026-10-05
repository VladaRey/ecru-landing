/*
  Аналітика сайту — той самий проєкт PostHog, що й у застосунку.

  Що тут рахується і навіщо:
  - перегляди сторінок разом зі звідки прийшли: PostHog сам знімає
    $referrer і utm_* з адреси, тож посилання з різних місць розрізняються;
  - store_click — натискання кнопки App Store, єдина конверсія сторінки
    (котра з двох кнопок і з якої мови);
  - section_viewed — до яких розділів догортають: так видно, які блоки
    читають, а на якому кидають;
  - language_switched — на яку мову перемикаються;
  - $pageleave і $autocapture — скільки пробули й що натискали.

  Чого тут немає і не буде: куків і будь-якого запису в браузер
  (persistence: 'memory' — кожне відкриття сторінки є окремим анонімним
  візитом), запису екрана, визначення міста й країни за IP. Хто ввімкнув у
  браузері «Do Not Track», той не рахується зовсім.

  Окремо від PostHog: посилання на App Store отримують мітку кампанії
  (`ct`), щоб App Store Connect показував, звідки прийшли ті, хто справді
  завантажив застосунок. Це працює й без аналітики, і з «Do Not Track» —
  мітка нічого не каже про людину, лише про посилання, з якого вона прийшла.
*/
(function () {
  var KEY = 'phc_xUirmvmPzqhCLjv9J9cjDGTxwjDgdUVESorqD3kSXY4m';
  var HOST = 'https://eu.i.posthog.com';
  var root = document.documentElement;
  var lang = root.lang || 'en';
  var page = root.getAttribute('data-page') || 'home';

  /* ── Мітка кампанії для App Store ─────────────────────────────────── */

  function campaign(place) {
    var params = new URLSearchParams(location.search);
    var source = params.get('utm_campaign') || params.get('utm_source') || params.get('ref');
    if (!source && document.referrer) {
      try {
        var host = new URL(document.referrer).hostname.replace(/^www\./, '');
        if (host !== location.hostname) source = host;
      } catch (e) {
        /* битий referrer — лишаємо без джерела */
      }
    }
    var token = [source || 'direct', lang, place]
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-');
    // App Store Connect приймає мітку до 40 символів.
    return token.slice(0, 40);
  }

  var provider = root.getAttribute('data-store-pt');
  var storeLinks = document.querySelectorAll('a[data-place]');
  for (var i = 0; i < storeLinks.length; i += 1) {
    var link = storeLinks[i];
    try {
      var url = new URL(link.href);
      url.searchParams.set('ct', campaign(link.getAttribute('data-place')));
      url.searchParams.set('mt', '8');
      if (provider) url.searchParams.set('pt', provider);
      link.href = url.toString();
    } catch (e) {
      /* лишаємо посилання як є */
    }
  }

  /* ── PostHog ───────────────────────────────────────────────────────── */

  var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1';
  var posthog = window.posthog;
  if (dnt || !posthog || typeof posthog.init !== 'function') return;

  posthog.init(KEY, {
    api_host: HOST,
    persistence: 'memory',
    person_profiles: 'identified_only',
    disable_external_dependency_loading: true,
    disable_surveys: true,
    disable_session_recording: true,
    capture_performance: false,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
  });

  posthog.register({
    site: 'landing',
    lang: lang,
    page: page,
    // Місто й країну за IP не визначаємо — ні тут, ні в застосунку.
    $geoip_disable: true,
  });

  for (var j = 0; j < storeLinks.length; j += 1) {
    storeLinks[j].addEventListener('click', function (event) {
      var target = event.currentTarget;
      posthog.capture(
        'store_click',
        { place: target.getAttribute('data-place'), campaign: new URL(target.href).searchParams.get('ct') },
        // Клік веде на apple.com: маячок браузер досилає вже після переходу.
        { transport: 'sendBeacon' }
      );
    });
  }

  var langLinks = document.querySelectorAll('.langs a');
  for (var k = 0; k < langLinks.length; k += 1) {
    langLinks[k].addEventListener('click', function (event) {
      posthog.capture('language_switched', { to: event.currentTarget.textContent.trim() }, { transport: 'sendBeacon' });
    });
  }

  if ('IntersectionObserver' in window) {
    var seen = {};
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var name = entry.target.getAttribute('data-section');
          if (seen[name]) return;
          seen[name] = true;
          observer.unobserve(entry.target);
          posthog.capture('section_viewed', {
            section: name,
            order: Number(entry.target.getAttribute('data-order') || 0),
          });
        });
      },
      { threshold: 0.4 }
    );
    var sections = document.querySelectorAll('[data-section]');
    for (var s = 0; s < sections.length; s += 1) observer.observe(sections[s]);
  }
})();
