'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');

test('кожен @font-face вказує на файл, який справді лежить у репозиторії', () => {
  const urls = Array.from(css.matchAll(/url\('([^']+)'\)/g), (m) => m[1]);
  assert.ok(urls.length > 0);
  for (const url of urls) {
    assert.ok(fs.existsSync(path.join(ROOT, url)), `немає файла ${url}`);
  }
});

// Одна гарнітура на всю сторінку й на всі чотири мови: серифні заголовки
// давали латиниці й кирилиці різні шрифти, і /en/ та /uk/ виглядали як дві
// різні сторінки. Друга гарнітура тепер має бути свідомим рішенням.
test('на сторінці одна гарнітура — IBM Plex Sans', () => {
  const families = new Set(Array.from(css.matchAll(/font-family:\s*'([^']+)'/g), (m) => m[1]));
  assert.deepStrictEqual([...families], ['IBM Plex Sans']);
});

test('у шрифті є кирилиця — інакше українська сторінка впала б у системний шрифт', () => {
  assert.match(css, /ibm-plex-sans-cyrillic\.woff2/);
});
