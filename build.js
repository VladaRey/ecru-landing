'use strict';

// Збірка не парсить HTML. Вона робить одну текстову заміну {{ключів}},
// тому вкладена розмітка всередині рядка — не окремий випадок: значення
// зберігається у словнику разом з тегами і підставляється цілком.

const KEY_RE = /\{\{([\w.@-]+)\}\}/g;

function keysIn(template) {
  return new Set(Array.from(template.matchAll(KEY_RE), (m) => m[1]));
}

function render(template, values) {
  return template.replace(KEY_RE, (whole, key) => {
    if (!(key in values)) throw new Error(`немає значення для {{${key}}}`);
    return values[key];
  });
}

// Ключі, які читає сама збірка, а не шаблон. Для checkKeys вони не «зайві»:
// їх ніхто не підставляє через {{...}}, але без них сторінка неповна.
const BUILDER_KEYS = ['lang.aria'];

// Порожній масив означає «сходиться». Ключ, що лишився в словнику без
// вживання, — така сама помилка, як відсутній переклад: він означає, що
// шаблон змінили, а словники за ним не пішли.
function checkKeys(templates, strings, lang) {
  // Сторінок кілька, а словник один на мову. Тому «вжитий» рахується по
  // всіх шаблонах разом: ключ, потрібний лише політиці, для головної не
  // зайвий — він просто стоїть на іншій сторінці.
  const used = new Set();
  for (const template of [].concat(templates)) {
    for (const key of keysIn(template)) used.add(key);
  }
  const missing = [...used].filter((k) => !k.startsWith('@') && !(k in strings));
  const unused = Object.keys(strings).filter(
    (k) => !used.has(k) && !BUILDER_KEYS.includes(k)
  );

  const problems = [];
  if (missing.length) problems.push(`${lang}: немає перекладу для ${missing.join(', ')}`);
  if (unused.length) problems.push(`${lang}: у словнику зайві ключі ${unused.join(', ')}`);
  return problems;
}

// Сторінок дві, і друга не є окремим сайтом: вона ділить із першою словники,
// стилі, іконки й перемикач мов. `dir` — це одразу три речі: тека в dist,
// хвіст URL і глибина, з якої рахуються відносні шляхи. Порожній рядок
// означає «сторінка лежить у корені своєї мови».
const PAGES = [
  { template: 'index.html', dir: '' },
  { template: 'privacy.html', dir: 'privacy' },
];

// Додати мову — дописати код сюди і покласти поруч i18n/<code>.json.
// Тека, hreflang і перемикач виводяться звідси, руками нічого не дублюється.
const LANGS = ['en', 'uk', 'pl', 'es'];
const DEFAULT_LANG = 'en';
const SITE = 'https://vladarey.github.io/ecru-landing/';

// Живе тут, а не у словниках: адреса не перекладається, і чотири копії
// одного рядка розійшлися б при першій же правці. У посиланні є `/ua/`, бо
// саме таким його дав App Store Connect; вітрину Apple однаково підбирає під
// обліковий запис відвідувача, тож одна адреса обслуговує всі чотири мови.
const APP_STORE = 'https://apps.apple.com/ua/app/ecru-wardrobe/id6807435125';
const APP_ID = '6807435125';

// Provider token з App Store Connect (App Analytics → Sources → Campaigns →
// «Generate a campaign link», параметр `pt=`). З ним завантаження за мітками
// `ct`, які ставить assets/analytics.js, видно в App Store Connect окремими
// кампаніями. Порожній — мітки однаково ставляться, але Apple їх не рахує.
const APP_STORE_PROVIDER_TOKEN = '';

// Мова → локаль для Open Graph: соцмережі розуміють лише формат ll_CC.
const OG_LOCALES = { en: 'en_US', uk: 'uk_UA', pl: 'pl_PL', es: 'es_ES' };

// Тут, а не у словниках, з тієї ж причини, що й посилання в магазин: адреса
// не перекладається, і чотири копії одного рядка розійшлися б при першій же
// правці. Окрема скринька, а не особиста: адресу видно на публічній
// сторінці, і її збирають розсилки.
const CONTACT_EMAIL = 'ecru.app.support@gmail.com';

// Самоназви. У словники не потрапляють: назва мови не перекладається —
// на англійській сторінці українська так само «Українська».
const LANG_NAMES = { en: 'English', uk: 'Українська', pl: 'Polski', es: 'Español' };

// Шляхи в розмітці відносні, бо сайт віддається з /ecru-landing/, а не з
// кореня домену. Побічний виграш: dist/uk/index.html відкривається
// подвійним кліком через file:// і виглядає правильно.
function basePrefix(lang, dir = '') {
  const depth = (lang === DEFAULT_LANG ? 0 : 1) + (dir ? 1 : 0);
  return '../'.repeat(depth);
}

// Дорога зі сторінки на головну *своєї* мови — не те саме, що {{@base}}.
// З `uk/privacy/` корінь сайту (`../../`) веде на англійську головну, а
// назад до української треба рівно на рівень. Підсторінка завжди лежить
// на один рівень нижче своєї мови, тож відповідь однакова для всіх мов.
function homePrefix(dir = '') {
  return dir ? '../' : '';
}

function pageUrl(lang, dir = '') {
  const langPart = lang === DEFAULT_LANG ? '' : `${lang}/`;
  return `${SITE}${langPart}${dir ? `${dir}/` : ''}`;
}

// hreflang в'яжуть між собою однакові сторінки різних мов, а не будь-які:
// політика мусить вести на політику, інакше пошук вважає їх однією.
function alternates(langs, dir = '') {
  const links = langs.map(
    (l) => `<link rel="alternate" hreflang="${l}" href="${pageUrl(l, dir)}" />`
  );
  links.push(`<link rel="alternate" hreflang="x-default" href="${pageUrl(DEFAULT_LANG, dir)}" />`);
  return links.join('\n    ');
}

/**
 * Випадний список, а не рядок посилань — і `<details>`, а не `<select>`.
 *
 * `<select>` вимагав би обробника на `onchange`, і мови перестали б бути
 * посиланнями: ні для краулера, ні для `hreflang` це не безкоштовно. У
 * `<details>` усередині лишаються справжні `<a href>`, а поведінка dropdown
 * дістається від браузера — без жодного рядка JS.
 *
 * Поточна мова стоїть у `<summary>` і в списку не повторюється: вона вже
 * названа, і другим рядком була б просто посиланням на цю саму сторінку.
 */
function langSwitch(current, langs, aria, dir = '') {
  const base = basePrefix(current, dir);
  // Відступ під місце вставки в шаблоні: {{@langswitch}} стоїть на десяти
  // пробілах і в шапці, і в підвалі, а перший рядок відступ уже має від них.
  const pad = ' '.repeat(10);
  const items = langs
    .filter((l) => l !== current)
    .map((l) => {
      // Перемикач лишає людину на тій самій сторінці, а не викидає на
      // головну: з політики українською він веде в політику польською.
      const href = `${base}${l === DEFAULT_LANG ? '' : `${l}/`}${dir ? `${dir}/` : ''}`;
      return `${pad}    <li><a href="${href}">${LANG_NAMES[l]}</a></li>`;
    })
    .join('\n');

  return [
    '<details class="langs">',
    `${pad}  <summary>${LANG_NAMES[current]}</summary>`,
    `${pad}  <ul aria-label="${aria}">`,
    items,
    `${pad}  </ul>`,
    `${pad}</details>`,
  ].join('\n');
}

// Екранування для атрибутів і JSON: значення зі словників містять лапки й теги.
const stripTags = (value = '') => value.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
const attr = (value) => stripTags(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * Теги для соцмереж і месенджерів: заголовок, опис і картинка прев'ю.
 *
 * Без них посилання на сайт у Telegram, Instagram чи Slack показувалося
 * голим рядком. Картинка своя на кожну мову — з тим самим заголовком, що й
 * на сторінці (`assets/og/og-<lang>.png`).
 */
function social(lang, langs, strings, dir) {
  const title = attr(strings[dir ? 'privacy.meta.title' : 'meta.title']);
  const description = attr(strings[dir ? 'privacy.meta.description' : 'meta.description']);
  const image = `${SITE}assets/og/og-${lang}.png`;
  const lines = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Lelia" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${pageUrl(lang, dir)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="${OG_LOCALES[lang] ?? 'en_US'}" />`,
    ...langs
      .filter((l) => l !== lang)
      .map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALES[l] ?? 'en_US'}" />`),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    // Смарт-банер Safari на iPhone: «Відкрити / Завантажити» згори сторінки.
    `<meta name="apple-itunes-app" content="app-id=${APP_ID}" />`,
  ];
  return lines.join('\n    ');
}

/**
 * Структуровані дані для пошуку: що це застосунок (iOS, безкоштовний) і,
 * на головній, питання й відповіді з розділу FAQ — пошук може показати їх
 * просто у видачі.
 */
function structuredData(lang, strings, dir) {
  if (dir) return '';
  const app = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'Lelia',
    url: pageUrl(lang),
    description: stripTags(strings['meta.description']),
    operatingSystem: 'iOS',
    applicationCategory: 'LifestyleApplication',
    inLanguage: lang,
    installUrl: APP_STORE,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
  const faqKeys = Object.keys(strings)
    .filter((key) => /^faq\.[\w-]+\.q$/.test(key))
    .map((key) => key.slice(0, -2));
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: faqKeys.map((key) => ({
      '@type': 'Question',
      name: stripTags(strings[`${key}.q`]),
      acceptedAnswer: { '@type': 'Answer', text: stripTags(strings[`${key}.a`]) },
    })),
  };
  // `<` у JSON усередині <script> екрануємо, щоб текст не міг закрити тег.
  const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
  return [
    `<script type="application/ld+json">${json(app)}</script>`,
    `<script type="application/ld+json">${json(faq)}</script>`,
  ].join('\n    ');
}

/** Скрипти аналітики — обидва свої, з цього ж сайту; дані йдуть лише в PostHog (ЄС). */
function analytics(lang, dir) {
  const base = basePrefix(lang, dir);
  return [
    `<script defer src="${base}assets/vendor/posthog.js"></script>`,
    `<script defer src="${base}assets/analytics.js"></script>`,
  ].join('\n    ');
}

function metaFor(lang, langs, strings, dir = '') {
  return {
    '@social': social(lang, langs, strings, dir),
    '@jsonld': structuredData(lang, strings, dir),
    '@analytics': analytics(lang, dir),
    '@page': dir || 'home',
    '@storept': APP_STORE_PROVIDER_TOKEN,
    '@lang': lang,
    '@base': basePrefix(lang, dir),
    '@home': homePrefix(dir),
    '@canonical': pageUrl(lang, dir),
    '@alternates': alternates(langs, dir),
    '@langswitch': langSwitch(lang, langs, strings['lang.aria'], dir),
    '@store': APP_STORE,
    '@email': CONTACT_EMAIL,
  };
}

const fs = require('node:fs');
const path = require('node:path');

// Копіюється один раз у корінь dist. Шляхи до шрифтів усередині style.css
// рахуються від самого CSS-файла, тож він однаково працює для обох сторінок
// і множити його по мовних теках не треба.
const STATIC = [
  'style.css', 'assets', '.nojekyll',
  // Іконки лежать у корені, а не в assets: так вони віддаються з кореня
  // сайту, де їх шукають браузер і iOS, коли тега в <head> замало.
  'lelia-logo.svg', 'apple-touch-icon.png',
];

function readStrings(root, lang) {
  const file = path.join(root, 'i18n', `${lang}.json`);
  if (!fs.existsSync(file)) throw new Error(`немає словника ${lang}: ${file}`);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`словник ${lang} не розбирається: ${err.message}`);
  }
}

function build({ root, outDir, langs = LANGS, defaultLang = DEFAULT_LANG, pages = PAGES }) {
  const templates = pages.map((page) => ({
    ...page,
    html: fs.readFileSync(path.join(root, 'src', page.template), 'utf8'),
  }));

  // Спочатку звіряємо всі словники і аж тоді щось пишемо: краще впасти зі
  // списком усіх розбіжностей, ніж лагодити їх по одній.
  const dictionaries = new Map(langs.map((l) => [l, readStrings(root, l)]));
  const htmls = templates.map((t) => t.html);
  const problems = langs.flatMap((l) => checkKeys(htmls, dictionaries.get(l), l));
  if (problems.length) throw new Error(`словники розійшлися з шаблоном:\n  ${problems.join('\n  ')}`);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const written = [];
  for (const lang of langs) {
    const strings = dictionaries.get(lang);
    const langDir = lang === defaultLang ? outDir : path.join(outDir, lang);
    for (const page of templates) {
      const values = { ...strings, ...metaFor(lang, langs, strings, page.dir) };
      const dir = page.dir ? path.join(langDir, page.dir) : langDir;
      fs.mkdirSync(dir, { recursive: true });
      // Ім'я файла завжди index.html: адреса сторінки — тека («/privacy/»),
      // а не «/privacy.html». Так посилання не залежить від того, чи вміє
      // хостинг дописувати розширення.
      const file = path.join(dir, 'index.html');
      fs.writeFileSync(file, render(page.html, values));
      written.push(file);
    }
  }

  // Карта сайту з усіма мовними версіями кожної сторінки й robots.txt, що на
  // неї вказує: так пошук знаходить усі вісім адрес, а не лише корінь.
  const urls = pages.flatMap((page) =>
    langs.map((lang) => {
      const links = langs
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${pageUrl(l, page.dir)}" />`)
        .join('\n');
      return `  <url>\n    <loc>${pageUrl(lang, page.dir)}</loc>\n${links}\n  </url>`;
    })
  );
  fs.writeFileSync(
    path.join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
  );
  fs.writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);

  for (const entry of STATIC) {
    const from = path.join(root, entry);
    if (fs.existsSync(from)) {
      fs.cpSync(from, path.join(outDir, entry), { recursive: true });
    }
  }

  return { written };
}

if (require.main === module) {
  try {
    const root = __dirname;
    const { written } = build({ root, outDir: path.join(root, 'dist') });
    console.log(`зібрано: ${written.length} сторінок`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = {
  keysIn, render, checkKeys,
  basePrefix, homePrefix, pageUrl, alternates, langSwitch, metaFor,
  build,
  LANGS, DEFAULT_LANG, SITE, APP_STORE, APP_ID, CONTACT_EMAIL, LANG_NAMES, BUILDER_KEYS, PAGES,
};
