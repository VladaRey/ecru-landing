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

test('заголовковий стек має гарнітуру для кирилиці', () => {
  const display = css.match(/--display:\s*([^;]+);/)[1];
  assert.match(display, /Ecru Display Cyrillic/);
});

test('кирилична гарнітура обмежена кириличним діапазоном', () => {
  const face = css.match(/@font-face\s*\{[^}]*Ecru Display Cyrillic[^}]*\}/)[0];
  assert.match(face, /U\+0400-045F/);
  assert.match(face, /ibm-plex-serif-400-cyrillic\.woff2/);
});

test('Instrument Serif лишився без кирилиці — латиниця не змінилась', () => {
  const faces = css.match(/@font-face\s*\{[^}]*Instrument Serif[^}]*\}/g);
  assert.strictEqual(faces.length, 2);
  for (const face of faces) {
    assert.doesNotMatch(face, /U\+0400-045F/);
  }
});
