'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

// Значення у словниках однорядкові, тож перенесення рядків у зібраній
// сторінці не збігаються з попередніми. HTML ці пробіли однаково схлопує,
// тому звіряємо текст після такого самого схлопування: втрачене чи додане
// слово порівняння ловить, чужу верстку в JSON — не тягне. Див. R7.
const squash = (html) => html.replace(/\s+/g, ' ').trim();

test('зібрана англійська сторінка не втратила жодного слова', () => {
  execFileSync('node', ['build.js'], { cwd: ROOT });
  const built = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  const original = execFileSync('git', ['show', 'HEAD:index.html'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  assert.strictEqual(squash(built), squash(original));
});
