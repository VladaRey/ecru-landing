'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build } = require('../build.js');

const ROOT = path.join(__dirname, '..');

// Свій каталог, а не спільний dist: node --test запускає кожен файл окремим
// процесом і паралельно, а збірка спершу зносить dist цілком. Два тестові
// файли на один каталог — це гонка, у якій один стирає те, що інший копіює.
const DIST = fs.mkdtempSync(path.join(os.tmpdir(), 'ecru-page-'));

test.before(() => build({ root: ROOT, outDir: DIST }));

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
  assert.strictEqual(html.match(/<details class="langs">/g).length, 2);
});

test('перемикач у підвалі не стоїть усередині <p>', () => {
  // <details> — не phrasing content: усередині <p> парсер закриє абзац
  // перед ним, і рядок підвалу розсиплеться разом зі своїм flex.
  const html = page('index.html').replace(/<!--[\s\S]*?-->/g, '');
  assert.doesNotMatch(html, /<p[^>]*>(?:(?!<\/p>)[\s\S])*?<details/);
});

test('у перемикачі лишаються посилання, а не option', () => {
  const html = page('uk/index.html');
  assert.match(html, /<details class="langs">[\s\S]*?<a href="\.\.\/">English<\/a>/);
  assert.doesNotMatch(html, /<select/);
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
  assert.match(uk, /src="\.\.\/assets\/shots\/grid\.jpg"/);
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
  assert.doesNotMatch(page('uk/index.html'), /Your wardrobe, and the reason/);
});

// Заклик на сторінці один — завантажити. Форми очікування тут стояли до
// того, як застосунок вийшов, і тест тримає їх видаленими: лишена форма
// означала б дві різні обіцянки на одній сторінці.
test('кожна мовна сторінка веде в магазин, а не в чергу', () => {
  for (const rel of ['index.html', 'uk/index.html', 'pl/index.html', 'es/index.html']) {
    const html = page(rel);
    assert.strictEqual(html.match(/<a class="appstore"/g).length, 2, rel);
    assert.match(html, /href="https:\/\/apps\.apple\.com\//, rel);
    assert.doesNotMatch(html, /<form/, rel);
    assert.doesNotMatch(html, /waitlist/, rel);
  }
});

// Назва магазину не перекладається, тож живе в шаблоні, а не у словниках, —
// і на кожній мові має лишитись тим самим рядком.
test('кнопка магазину названа своїм ім’ям на кожній мові', () => {
  for (const rel of ['index.html', 'uk/index.html', 'pl/index.html', 'es/index.html']) {
    assert.strictEqual(page(rel).match(/>App Store</g).length, 2, rel);
  }
});

// Іконка вказана трьома тегами, і кожен має свою причину: SVG для
// сучасних браузерів, PNG для Safari до 16.4, apple-touch-icon для iOS.
// Перевіряємо і теги, і що файли справді доїхали в dist: посилання на
// іконку, якої немає, дає порожню вкладку, а не помилку збірки.
test('кожна мовна сторінка вказує іконку своїм шляхом', () => {
  for (const lang of ['en', 'uk', 'pl', 'es']) {
    const rel = lang === 'en' ? 'index.html' : `${lang}/index.html`;
    const base = lang === 'en' ? '' : '../';
    const html = page(rel);
    assert.match(html, new RegExp(`rel="icon" href="${base}ecru-logo\\.svg" type="image/svg\\+xml"`), rel);
    assert.match(html, new RegExp(`rel="icon" href="${base}apple-touch-icon\\.png"`), rel);
    assert.match(html, new RegExp(`rel="apple-touch-icon" href="${base}apple-touch-icon\\.png"`), rel);
  }
});

test('файли іконки лягають у корінь dist', () => {
  for (const name of ['ecru-logo.svg', 'apple-touch-icon.png']) {
    assert.ok(fs.existsSync(path.join(DIST, name)), `немає dist/${name}`);
  }
});

// Випадний список мов — <ul>, і без цього рядка браузер малює в ньому
// маркери списку. Крапки поруч з назвами мов уже одного разу доїхали на
// сторінку, тож перевірка лишається.
test('у перемикачі мов немає маркерів списку', () => {
  const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
  const rule = css.match(/\.langs > ul \{[^}]*\}/);
  assert.ok(rule, 'у style.css немає правила .langs > ul');
  assert.match(rule[0], /list-style:\s*none/);
});

// ── політика конфіденційності ─────────────────────────────────────────
// App Store Connect не дає подати застосунок без посилання на політику, і
// рев'юер відкриває його руками. Тому сторінка перевіряється так само, як
// головна: своєю мовою, своїм канонічним посиланням і робочими шляхами.

const { CONTACT_EMAIL } = require('../build.js');

const PRIVACY = ['privacy/index.html', 'uk/privacy/index.html', 'pl/privacy/index.html', 'es/privacy/index.html'];

test('політика зібралась кожною мовою й оголошує свою', () => {
  assert.match(page('privacy/index.html'), /<html lang="en">/);
  assert.match(page('uk/privacy/index.html'), /<html lang="uk">/);
  assert.match(page('pl/privacy/index.html'), /<html lang="pl">/);
  assert.match(page('es/privacy/index.html'), /<html lang="es">/);
});

test('у політиці не лишилось незамінених ключів', () => {
  for (const rel of PRIVACY) assert.doesNotMatch(page(rel), /\{\{/, rel);
});

test('політика вказує канонічним посиланням на себе, а не на головну', () => {
  assert.match(page('uk/privacy/index.html'), /rel="canonical" href="[^"]*\/uk\/privacy\/"/);
});

test('hreflang політики ведуть у політику інших мов', () => {
  const html = page('privacy/index.html');
  assert.match(html, /hreflang="uk" href="[^"]*\/uk\/privacy\/"/);
  assert.match(html, /hreflang="es" href="[^"]*\/es\/privacy\/"/);
});

test('перемикач мов на політиці не викидає на головну', () => {
  assert.match(page('uk/privacy/index.html'), /<a href="\.\.\/\.\.\/pl\/privacy\/">Polski<\/a>/);
});

test('стилі й іконки з мовної політики піднімаються на два рівні', () => {
  const html = page('uk/privacy/index.html');
  assert.match(html, /href="\.\.\/\.\.\/style\.css"/);
  assert.match(html, /rel="apple-touch-icon" href="\.\.\/\.\.\/apple-touch-icon\.png"/);
});

test('з політики можна повернутись на головну своєї мови', () => {
  // З uk/privacy/ це `../`, тобто /uk/. Корінь сайту (`../../`) був би
  // англійською головною — мова б мовчки змінилась.
  assert.match(page('uk/privacy/index.html'), /<a class="nav__brand" href="\.\.\/">/);
});

test('підвал головної веде в політику на кожній мові', () => {
  for (const rel of ['index.html', 'uk/index.html', 'pl/index.html', 'es/index.html']) {
    assert.match(page(rel), /<a href="privacy\/">/, rel);
  }
});

// Сторінка обіцяє «нічого не йде на сервер». Обидва місця, де це не зовсім
// так, названі в ній прямо — сервіс оновлень застосунку і лічильник самого
// сайту. Тест тримає обидві згадки: прибрати одну означало б лишити на
// сторінці обіцянку, ширшу за правду.
test('політика називає і сервіс оновлень, і лічильник сайту', () => {
  for (const rel of PRIVACY) {
    assert.match(page(rel), /u\.expo\.dev/, rel);
    assert.match(page(rel), /expo\.dev\/privacy/, rel);
    assert.match(page(rel), /PostHog/, rel);
  }
});

test('контакт у політиці — той самий, що в збірці', () => {
  for (const rel of PRIVACY) {
    assert.ok(page(rel).includes(`mailto:${CONTACT_EMAIL}`), rel);
  }
});
