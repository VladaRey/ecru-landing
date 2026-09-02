'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build } = require('../build.js');

const FIXTURES = path.join(__dirname, 'fixtures');

function run(overrides = {}) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecru-build-'));
  const result = build({
    root: FIXTURES,
    outDir,
    langs: ['en', 'uk'],
    defaultLang: 'en',
    ...overrides,
  });
  return { outDir, result };
}

test('мова за умовчанням лягає в корінь, решта — у свої теки', () => {
  const { outDir } = run();
  assert.ok(fs.existsSync(path.join(outDir, 'index.html')));
  assert.ok(fs.existsSync(path.join(outDir, 'uk', 'index.html')));
});

test('у зібраних сторінках не лишається жодного {{', () => {
  const { outDir } = run();
  for (const rel of ['index.html', 'uk/index.html']) {
    const html = fs.readFileSync(path.join(outDir, rel), 'utf8');
    assert.doesNotMatch(html, /\{\{/, `${rel} містить незамінений ключ`);
  }
});

test('кожна сторінка отримує свою мову й свій текст', () => {
  const { outDir } = run();
  const en = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  const uk = fs.readFileSync(path.join(outDir, 'uk', 'index.html'), 'utf8');
  assert.match(en, /<html lang="en">/);
  assert.match(uk, /<html lang="uk">/);
  assert.match(en, /Your whole wardrobe/);
  assert.match(uk, /Уся ваша гардеробна/);
});

test('шляхи в мовній теці піднімаються на рівень', () => {
  const { outDir } = run();
  const uk = fs.readFileSync(path.join(outDir, 'uk', 'index.html'), 'utf8');
  assert.match(uk, /href="\.\.\/style\.css"/);
  assert.match(uk, /src="\.\.\/assets\/shots\/x\.txt"/);
});

test('статика копіюється один раз у корінь dist', () => {
  const { outDir } = run();
  assert.ok(fs.existsSync(path.join(outDir, 'style.css')));
  assert.ok(fs.existsSync(path.join(outDir, 'assets', 'shots', 'x.txt')));
  assert.ok(fs.existsSync(path.join(outDir, '.nojekyll')));
  assert.ok(!fs.existsSync(path.join(outDir, 'uk', 'style.css')));
});

test('повторна збірка не лишає файлів від попередньої', () => {
  const { outDir } = run();
  fs.writeFileSync(path.join(outDir, 'stale.html'), 'old');
  build({ root: FIXTURES, outDir, langs: ['en', 'uk'], defaultLang: 'en' });
  assert.ok(!fs.existsSync(path.join(outDir, 'stale.html')));
});

test('build падає, коли словника мови немає', () => {
  // Код навмисно неіснуючий: у фікстурах лежать словники всіх мов з LANGS,
  // бо T8 запускає справжній build.js. Візьми звідти будь-яку — і тест
  // мовчки перестане перевіряти те, заради чого написаний.
  assert.throws(() => run({ langs: ['en', 'uk', 'zz'] }), /zz/);
});

test('node build.js виходить з ненульовим кодом, коли словники розійшлися', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ecru-root-'));
  fs.cpSync(FIXTURES, root, { recursive: true });
  fs.writeFileSync(path.join(root, 'build.js'), fs.readFileSync(path.join(__dirname, '..', 'build.js')));
  // Ламаємо саме en: T4 тимчасово лишає в LANGS одну мову, і словник, якого
  // немає в LANGS, збірка просто не читає — тест мовчки перестав би падати.
  fs.writeFileSync(path.join(root, 'i18n', 'en.json'), JSON.stringify({ 'hero.title': 'Only the title' }));
  const { status, stderr } = require('node:child_process').spawnSync(
    'node', ['build.js'], { cwd: root, encoding: 'utf8' }
  );
  assert.notStrictEqual(status, 0, 'збірка мала впасти');
  assert.match(stderr, /hero\.alt/);
});

test('build називає всі проблеми словників одразу, а не першу-ліпшу', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecru-build-'));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ecru-root-'));
  fs.cpSync(FIXTURES, root, { recursive: true });
  fs.writeFileSync(
    path.join(root, 'i18n', 'uk.json'),
    JSON.stringify({ 'hero.title': 'Тільки заголовок', ghost: 'зайвий' })
  );
  assert.throws(
    () => build({ root, outDir, langs: ['en', 'uk'], defaultLang: 'en' }),
    (err) => /hero\.alt/.test(err.message) && /ghost/.test(err.message)
  );
});
