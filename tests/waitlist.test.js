'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build } = require('../build.js');

const ROOT = path.join(__dirname, '..');

// Кожен тестовий файл — окремий процес, і запускаються вони паралельно.
// Тому збираємо у власний каталог: спільний dist означав би, що дві збірки
// зносять його одна в одної під руками.
const DIST = fs.mkdtempSync(path.join(os.tmpdir(), 'ecru-waitlist-'));

test.before(() => build({ root: ROOT, outDir: DIST }));

test('у waitlist.js не лишилось жодного тексту для людини', () => {
  const js = fs.readFileSync(path.join(ROOT, 'waitlist.js'), 'utf8');
  const code = js.replace(/^\s*\/\/.*$/gm, '');
  const strings = code.match(/(['"])(?:(?!\1)[^\\]|\\.)*\1/g) || [];
  const prose = strings.filter((s) => /\s\w+\s/.test(s) && !/^['"][.#\[]/.test(s));
  assert.deepStrictEqual(prose, [], `лишились літерали: ${prose.join(', ')}`);
});

test('обидві форми несуть усі п’ять повідомлень', () => {
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  for (const attr of ['invalid', 'unwired', 'sending', 'ok', 'fail']) {
    const found = html.match(new RegExp(`data-msg-${attr}="[^"]+"`, 'g')) || [];
    assert.strictEqual(found.length, 2, `data-msg-${attr} має бути на обох формах`);
  }
});
