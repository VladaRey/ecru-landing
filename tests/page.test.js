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
