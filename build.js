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

module.exports = { keysIn, render, checkKeys };
