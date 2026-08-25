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

// Порожній масив означає «сходиться». Ключ, що лишився в словнику без
// вживання, — така сама помилка, як відсутній переклад: він означає, що
// шаблон змінили, а словники за ним не пішли.
function checkKeys(template, strings, lang) {
  const used = keysIn(template);
  const missing = [...used].filter((k) => !k.startsWith('@') && !(k in strings));
  const unused = Object.keys(strings).filter((k) => !used.has(k));

  const problems = [];
  if (missing.length) problems.push(`${lang}: немає перекладу для ${missing.join(', ')}`);
  if (unused.length) problems.push(`${lang}: у словнику зайві ключі ${unused.join(', ')}`);
  return problems;
}

// Додати мову — дописати код сюди і покласти поруч i18n/<code>.json.
// Тека, hreflang і перемикач виводяться звідси, руками нічого не дублюється.
const LANGS = ['en', 'uk'];
const DEFAULT_LANG = 'en';
const SITE = 'https://vladarey.github.io/ecru-landing/';

// Самоназви. У словники не потрапляють: назва мови не перекладається —
// на англійській сторінці українська так само «Українська».
const LANG_NAMES = { en: 'English', uk: 'Українська', pl: 'Polski', de: 'Deutsch' };

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

function langSwitch(current, langs) {
  const base = basePrefix(current);
  return langs
    .map((l) => {
      if (l === current) return `<span aria-current="page">${LANG_NAMES[l]}</span>`;
      const href = `${base}${l === DEFAULT_LANG ? '' : `${l}/`}`;
      return `<a href="${href}">${LANG_NAMES[l]}</a>`;
    })
    .join('\n            ');
}

function metaFor(lang, langs) {
  return {
    '@lang': lang,
    '@base': basePrefix(lang),
    '@canonical': pageUrl(lang),
    '@alternates': alternates(langs),
    '@langswitch': langSwitch(lang, langs),
  };
}

const fs = require('node:fs');
const path = require('node:path');

// Копіюється один раз у корінь dist. Шляхи до шрифтів усередині style.css
// рахуються від самого CSS-файла, тож він однаково працює для обох сторінок
// і множити його по мовних теках не треба.
const STATIC = ['style.css', 'waitlist.js', 'assets', '.nojekyll'];

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
    const values = { ...dictionaries.get(lang), ...metaFor(lang, langs) };
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
  LANGS, DEFAULT_LANG, SITE, LANG_NAMES,
};
