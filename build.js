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
function checkKeys(template, strings, lang) {
  const used = keysIn(template);
  const missing = [...used].filter((k) => !k.startsWith('@') && !(k in strings));
  const unused = Object.keys(strings).filter(
    (k) => !used.has(k) && !BUILDER_KEYS.includes(k)
  );

  const problems = [];
  if (missing.length) problems.push(`${lang}: немає перекладу для ${missing.join(', ')}`);
  if (unused.length) problems.push(`${lang}: у словнику зайві ключі ${unused.join(', ')}`);
  return problems;
}

// Додати мову — дописати код сюди і покласти поруч i18n/<code>.json.
// Тека, hreflang і перемикач виводяться звідси, руками нічого не дублюється.
const LANGS = ['en', 'uk', 'pl', 'es'];
const DEFAULT_LANG = 'en';
const SITE = 'https://vladarey.github.io/ecru-landing/';

// ЗАГЛУШКА: замінити на посилання застосунку в App Store, коли воно буде.
// Живе тут, а не у словниках: адреса не перекладається, а generic-посилання
// apple сам перекидає на потрібну вітрину країни, тож одна на всі мови.
const APP_STORE = 'https://apps.apple.com/app/ecru';

// Самоназви. У словники не потрапляють: назва мови не перекладається —
// на англійській сторінці українська так само «Українська».
const LANG_NAMES = { en: 'English', uk: 'Українська', pl: 'Polski', es: 'Español' };

// Шляхи в розмітці відносні, бо сайт віддається з /ecru-landing/, а не з
// кореня домену. Побічний виграш: dist/uk/index.html відкривається
// подвійним кліком через file:// і виглядає правильно.
function basePrefix(lang) {
  return lang === DEFAULT_LANG ? '' : '../';
}

function pageUrl(lang) {
  return lang === DEFAULT_LANG ? SITE : `${SITE}${lang}/`;
}

function alternates(langs) {
  const links = langs.map(
    (l) => `<link rel="alternate" hreflang="${l}" href="${pageUrl(l)}" />`
  );
  links.push(`<link rel="alternate" hreflang="x-default" href="${pageUrl(DEFAULT_LANG)}" />`);
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
function langSwitch(current, langs, aria) {
  const base = basePrefix(current);
  // Відступ під місце вставки в шаблоні: {{@langswitch}} стоїть на десяти
  // пробілах і в шапці, і в підвалі, а перший рядок відступ уже має від них.
  const pad = ' '.repeat(10);
  const items = langs
    .filter((l) => l !== current)
    .map((l) => {
      const href = `${base}${l === DEFAULT_LANG ? '' : `${l}/`}`;
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

function metaFor(lang, langs, strings) {
  return {
    '@lang': lang,
    '@base': basePrefix(lang),
    '@canonical': pageUrl(lang),
    '@alternates': alternates(langs),
    '@langswitch': langSwitch(lang, langs, strings['lang.aria']),
    '@store': APP_STORE,
  };
}

const fs = require('node:fs');
const path = require('node:path');

// Копіюється один раз у корінь dist. Шляхи до шрифтів усередині style.css
// рахуються від самого CSS-файла, тож він однаково працює для обох сторінок
// і множити його по мовних теках не треба.
const STATIC = [
  'style.css', 'analytics.js', 'assets', '.nojekyll',
  // Іконки лежать у корені, а не в assets: так вони віддаються з кореня
  // сайту, де їх шукають браузер і iOS, коли тега в <head> замало.
  'ecru-logo.svg', 'apple-touch-icon.png',
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

function build({ root, outDir, langs = LANGS, defaultLang = DEFAULT_LANG }) {
  const template = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

  // Спочатку звіряємо всі словники і аж тоді щось пишемо: краще впасти зі
  // списком усіх розбіжностей, ніж лагодити їх по одній.
  const dictionaries = new Map(langs.map((l) => [l, readStrings(root, l)]));
  const problems = langs.flatMap((l) => checkKeys(template, dictionaries.get(l), l));
  if (problems.length) throw new Error(`словники розійшлися з шаблоном:\n  ${problems.join('\n  ')}`);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const written = [];
  for (const lang of langs) {
    const strings = dictionaries.get(lang);
    const values = { ...strings, ...metaFor(lang, langs, strings) };
    const dir = lang === defaultLang ? outDir : path.join(outDir, lang);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'index.html');
    fs.writeFileSync(file, render(template, values));
    written.push(file);
  }

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
  basePrefix, pageUrl, alternates, langSwitch, metaFor,
  build,
  LANGS, DEFAULT_LANG, SITE, APP_STORE, LANG_NAMES, BUILDER_KEYS,
};
