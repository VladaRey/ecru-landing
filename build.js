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

module.exports = {
  keysIn, render, checkKeys,
  basePrefix, pageUrl, alternates, langSwitch, metaFor,
  LANGS, DEFAULT_LANG, SITE, LANG_NAMES,
};
