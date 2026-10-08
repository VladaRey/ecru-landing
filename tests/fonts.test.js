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

// Одна гарнітура тексту на всю сторінку й на всі чотири мови, плюс
// Cormorant — лише для слова-логотипа, як і в застосунку. Третя гарнітура
// має бути свідомим рішенням.
test('гарнітури — Manrope для тексту й Cormorant Garamond для логотипа', () => {
  const families = new Set(Array.from(css.matchAll(/font-family:\s*'([^']+)'/g), (m) => m[1]));
  assert.deepStrictEqual([...families].sort(), ['Cormorant Garamond', 'Manrope']);
});

test('у шрифті є кирилиця — інакше українська сторінка впала б у системний шрифт', () => {
  assert.match(css, /manrope-cyrillic\.woff2/);
});

// Курсиву в Manrope немає: браузер синтезував би похилий і розмив штрих.
test('наголос — вагою, а не синтезованим курсивом', () => {
  assert.match(css, /em \{\s*font-style: normal;/);
});
