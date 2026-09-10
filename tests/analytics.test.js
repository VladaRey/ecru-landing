'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build, LANGS, DEFAULT_LANG } = require('../build.js');

const ROOT = path.join(__dirname, '..');

// Свій каталог, а не спільний dist: тестові файли йдуть паралельно, а
// збірка спершу зносить каталог цілком.
const DIST = fs.mkdtempSync(path.join(os.tmpdir(), 'ecru-analytics-'));

test.before(() => build({ root: ROOT, outDir: DIST }));

const source = () => fs.readFileSync(path.join(ROOT, 'analytics.js'), 'utf8');

test('ключ проєкту підставлений, а не лишився заглушкою', () => {
  const key = source().match(/const KEY = '([^']*)'/);
  assert.ok(key, 'у analytics.js немає KEY');
  assert.match(key[1], /^phc_[A-Za-z0-9]{20,}$/, `ключ виглядає незаповненим: ${key[1]}`);
});

test('аналітика не ставить куків — підвал обіцяє саме це', () => {
  assert.match(source(), /persistence: 'memory'/);
});

test('профіль людини заводиться лише після identify', () => {
  assert.match(source(), /person_profiles: 'identified_only'/);
});

test('регіон ключа і регіон статики збігаються', () => {
  const host = source().match(/const HOST = 'https:\/\/(eu|us)\.i\.posthog\.com'/);
  assert.ok(host, 'HOST має вказувати на eu.i або us.i posthog.com');
});

test('кожна мовна сторінка підвантажує analytics.js своїм шляхом', () => {
  for (const lang of LANGS) {
    const rel = lang === DEFAULT_LANG ? 'index.html' : `${lang}/index.html`;
    const base = lang === DEFAULT_LANG ? '' : '\.\./';
    const html = fs.readFileSync(path.join(DIST, rel), 'utf8');
    assert.match(html, new RegExp(`src="${base}analytics\.js" defer`), rel);
  }
});

test('analytics.js доїжджає у dist поруч зі сторінками', () => {
  assert.ok(fs.existsSync(path.join(DIST, 'analytics.js')));
});

// Кліки PostHog знімає автозахопленням, тому окремого коду під це немає:
// подія приходить з атрибутами самого посилання, і data-place — єдине, що
// відрізняє кнопку в герої від кнопки у фіналі.
test('кожна кнопка магазину каже, звідки по ній клікнули', () => {
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  assert.deepStrictEqual(
    (html.match(/data-place="(\w+)"/g) || []),
    ['data-place="hero"', 'data-place="finale"']
  );
});

// Перегляди й кліки array.js знімає сам. Названа подія потрібна лише для
// кнопки магазину — це єдина конверсія на сторінці, і саме її найлегше
// втратити: клік веде на apple.com, тож звичайний запит навігація обриває.
test('клік по кнопці магазину знімається названою подією', () => {
  const js = source();
  assert.match(js, /capture\(\s*'store_click'/, 'немає названої події store_click');
  assert.match(js, /transport: 'sendBeacon'/, 'подія мусить летіти маячком, бо сторінка зникає');
  assert.match(js, /place: link\.dataset\.place/, 'подія має знати, з якої кнопки клікнули');
});

test('PostHog не дотягує модулів, якими сторінка не користується', () => {
  const js = source();
  assert.match(js, /disable_external_dependency_loading: true/);
  assert.match(js, /disable_surveys: true/);
  assert.match(js, /capture_performance: false/);
});

// Політику читає рев'юер Apple, і контакт у ній має бути робочим. Заглушку
// в цій константі видно було б лише очима — деплой іде на push у main і не
// питає нікого.
test('контакт у політиці — справжня адреса, а не заглушка', () => {
  const { CONTACT_EMAIL } = require('../build.js');
  assert.match(CONTACT_EMAIL, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i, `адреса виглядає незаповненою: ${CONTACT_EMAIL}`);
});
