'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

// Кожен тестовий файл — окремий процес, порядок їх запуску не гарантований.
// Без цього тест читав би dist, зібраний (чи не зібраний) кимось іншим.
test.before(() => execFileSync('node', ['build.js'], { cwd: ROOT }));

test('у waitlist.js не лишилось жодного тексту для людини', () => {
  const js = fs.readFileSync(path.join(ROOT, 'waitlist.js'), 'utf8');
  const code = js.replace(/^\s*\/\/.*$/gm, '');
  const strings = code.match(/(['"])(?:(?!\1)[^\\]|\\.)*\1/g) || [];
  const prose = strings.filter((s) => /\s\w+\s/.test(s) && !/^['"][.#\[]/.test(s));
  assert.deepStrictEqual(prose, [], `лишились літерали: ${prose.join(', ')}`);
});

test('обидві форми несуть усі п’ять повідомлень', () => {
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  for (const attr of ['invalid', 'unwired', 'sending', 'ok', 'fail']) {
    const found = html.match(new RegExp(`data-msg-${attr}="[^"]+"`, 'g')) || [];
    assert.strictEqual(found.length, 2, `data-msg-${attr} має бути на обох формах`);
  }
});
