'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

test.before(() => execFileSync('node', ['build.js'], { cwd: ROOT }));

function page(rel) {
  return fs.readFileSync(path.join(DIST, rel), 'utf8');
}

test('кожна сторінка оголошує свою мову', () => {
  assert.match(page('index.html'), /<html lang="en">/);
});

test('кожна сторінка вказує на себе канонічним посиланням', () => {
  assert.match(page('index.html'), /rel="canonical" href="https:\/\/vladarey\.github\.io\/ecru-landing\/"/);
});

test('сторінка перелічує всі мови у hreflang і додає x-default', () => {
  const html = page('index.html');
  assert.match(html, /hreflang="en"/);
  assert.match(html, /hreflang="x-default"/);
});

test('перемикач мов є в шапці і в підвалі', () => {
  const html = page('index.html');
  assert.strictEqual(html.match(/aria-current="page"/g).length, 2);
});

test('у зібраній сторінці не лишилось незамінених ключів', () => {
  assert.doesNotMatch(page('index.html'), /\{\{/);
});

test('українська сторінка зібралась і оголошує свою мову', () => {
  assert.match(page('uk/index.html'), /<html lang="uk">/);
});

test('шляхи на українській сторінці піднімаються на рівень', () => {
  const uk = page('uk/index.html');
  assert.match(uk, /href="\.\.\/style\.css"/);
  assert.match(uk, /src="\.\.\/assets\/shots\/pairs\.jpg"/);
  assert.doesNotMatch(uk, /src="assets\//);
});

test('українська сторінка вказує канонічним посиланням на себе', () => {
  assert.match(page('uk/index.html'), /rel="canonical" href="[^"]*\/uk\/"/);
});

test('обидві сторінки посилаються одна на одну через hreflang', () => {
  for (const rel of ['index.html', 'uk/index.html']) {
    assert.match(page(rel), /hreflang="uk"/);
    assert.match(page(rel), /hreflang="en"/);
  }
});

test('у жодній зібраній сторінці не лишилось ключів', () => {
  for (const rel of ['index.html', 'uk/index.html']) {
    assert.doesNotMatch(page(rel), /\{\{/, rel);
  }
});

test('українська сторінка не містить англійського тексту героя', () => {
  assert.doesNotMatch(page('uk/index.html'), /Your whole wardrobe/);
});
