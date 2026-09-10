'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { keysIn, render, checkKeys } = require('../build.js');

test('keysIn збирає всі ключі шаблона', () => {
  const found = keysIn('<h1>{{hero.title}}</h1><p>{{hero.lede}}</p>');
  assert.deepStrictEqual([...found].sort(), ['hero.lede', 'hero.title']);
});

test('keysIn не плутає службові ключі зі звичайними', () => {
  const found = keysIn('<html lang="{{@lang}}"><img src="{{@base}}a.jpg" alt="{{a.alt}}">');
  assert.deepStrictEqual([...found].sort(), ['@base', '@lang', 'a.alt']);
});

test('render підставляє значення дослівно, разом з розміткою', () => {
  const out = render('<p>{{k}}</p>', { k: 'tells you <em>why</em> — in one sentence' });
  assert.strictEqual(out, '<p>tells you <em>why</em> — in one sentence</p>');
});

test('render підставляє один ключ у всіх його входженнях', () => {
  const out = render('{{cta}}|{{cta}}', { cta: 'Get early access' });
  assert.strictEqual(out, 'Get early access|Get early access');
});

test('render падає, коли значення немає', () => {
  assert.throws(() => render('<p>{{missing}}</p>', {}), /missing/);
});

test('checkKeys мовчить, коли шаблон і словник збігаються', () => {
  const problems = checkKeys('<p>{{a}}{{b}}</p>', { a: '1', b: '2' }, 'en');
  assert.deepStrictEqual(problems, []);
});

test('checkKeys ловить відсутній переклад', () => {
  const problems = checkKeys('<p>{{a}}{{b}}</p>', { a: '1' }, 'uk');
  assert.strictEqual(problems.length, 1);
  assert.match(problems[0], /uk/);
  assert.match(problems[0], /b/);
});

test('checkKeys ловить зайвий ключ у словнику', () => {
  const problems = checkKeys('<p>{{a}}</p>', { a: '1', ghost: '2' }, 'uk');
  assert.strictEqual(problems.length, 1);
  assert.match(problems[0], /ghost/);
});

test('checkKeys не вимагає службових ключів від словника', () => {
  const problems = checkKeys('<html lang="{{@lang}}">{{a}}', { a: '1' }, 'en');
  assert.deepStrictEqual(problems, []);
});

const { basePrefix, pageUrl, alternates, langSwitch, metaFor } = require('../build.js');

test('basePrefix порожній у корені і піднімає на рівень у мовній теці', () => {
  assert.strictEqual(basePrefix('en'), '');
  assert.strictEqual(basePrefix('uk'), '../');
});

test('pageUrl кладе мову за умовчанням у корінь', () => {
  assert.strictEqual(pageUrl('en'), 'https://vladarey.github.io/ecru-landing/');
  assert.strictEqual(pageUrl('uk'), 'https://vladarey.github.io/ecru-landing/uk/');
});

test('alternates перелічує всі мови, включно з собою, і додає x-default', () => {
  const out = alternates(['en', 'uk']);
  assert.match(out, /hreflang="en" href="https:\/\/vladarey\.github\.io\/ecru-landing\/"/);
  assert.match(out, /hreflang="uk" href="https:\/\/vladarey\.github\.io\/ecru-landing\/uk\/"/);
  assert.match(out, /hreflang="x-default" href="https:\/\/vladarey\.github\.io\/ecru-landing\/"/);
  assert.strictEqual(out.match(/<link/g).length, 3);
});

test('langSwitch кладе поточну мову в summary і не повторює її списком', () => {
  const out = langSwitch('uk', ['en', 'uk'], 'Мова сторінки');
  assert.match(out, /<summary[^>]*>Українська<\/summary>/);
  assert.doesNotMatch(out, /<a[^>]*>Українська</);
});

test('langSwitch лишає інші мови посиланнями, а не option', () => {
  const out = langSwitch('uk', ['en', 'uk'], 'Мова сторінки');
  assert.match(out, /<a href="\.\.\/">English<\/a>/);
  assert.doesNotMatch(out, /<option/);
  assert.doesNotMatch(out, /<select/);
});

test('langSwitch веде з кореня у мовну теку без ../', () => {
  assert.match(langSwitch('en', ['en', 'uk'], 'Page language'), /href="uk\/"[^>]*>Українська/);
});

test('langSwitch ніколи не видає порожній href', () => {
  for (const current of ['en', 'uk']) {
    assert.doesNotMatch(langSwitch(current, ['en', 'uk'], 'aria'), /href=""/);
  }
});

test('langSwitch підписує список для читалки', () => {
  assert.match(langSwitch('en', ['en', 'uk'], 'Page language'), /aria-label="Page language"/);
});

test('metaFor віддає повний набір службових ключів', () => {
  const meta = metaFor('uk', ['en', 'uk'], { 'lang.aria': 'Мова сторінки' });
  assert.strictEqual(meta['@lang'], 'uk');
  assert.strictEqual(meta['@base'], '../');
  assert.strictEqual(meta['@canonical'], 'https://vladarey.github.io/ecru-landing/uk/');
  assert.ok(meta['@alternates'].includes('x-default'));
  assert.ok(meta['@langswitch'].includes('<details'));
});

test('checkKeys не вважає зайвими ключі, які читає сама збірка', () => {
  const problems = checkKeys('<p>{{a}}</p>', { a: '1', 'lang.aria': 'Page language' }, 'en');
  assert.deepStrictEqual(problems, []);
});

// ── друга сторінка ────────────────────────────────────────────────────
// Політика лежить у теці всередині мови (`uk/privacy/`), тож глибина, з
// якої рахуються відносні шляхи, більше не дорівнює «мова чи не мова».

const { homePrefix } = require('../build.js');

test('basePrefix рахує і мову, і теку сторінки', () => {
  assert.strictEqual(basePrefix('en', ''), '');
  assert.strictEqual(basePrefix('en', 'privacy'), '../');
  assert.strictEqual(basePrefix('uk', ''), '../');
  assert.strictEqual(basePrefix('uk', 'privacy'), '../../');
});

test('homePrefix веде на головну своєї мови, а не на корінь сайту', () => {
  // З uk/privacy/ корінь сайту — це англійська головна. Своя головна на
  // рівень вище, і так для будь-якої мови: підсторінка завжди одна тека.
  assert.strictEqual(homePrefix('privacy'), '../');
  assert.strictEqual(homePrefix(''), '');
});

test('pageUrl дописує теку сторінки після мови', () => {
  assert.strictEqual(pageUrl('en', 'privacy'), 'https://vladarey.github.io/ecru-landing/privacy/');
  assert.strictEqual(pageUrl('uk', 'privacy'), 'https://vladarey.github.io/ecru-landing/uk/privacy/');
});

test('alternates в’яжуть однакові сторінки, а не будь-які', () => {
  const out = alternates(['en', 'uk'], 'privacy');
  assert.match(out, /hreflang="uk" href="[^"]*\/uk\/privacy\/"/);
  assert.doesNotMatch(out, /href="https:\/\/vladarey\.github\.io\/ecru-landing\/"/);
});

test('langSwitch лишає людину на тій самій сторінці іншої мови', () => {
  const out = langSwitch('uk', ['en', 'uk', 'pl'], 'Мова сторінки', 'privacy');
  assert.match(out, /<a href="\.\.\/\.\.\/privacy\/">English<\/a>/);
  assert.match(out, /<a href="\.\.\/\.\.\/pl\/privacy\/">Polski<\/a>/);
});

test('checkKeys рахує вжитими ключі всіх шаблонів разом', () => {
  // Ключ, потрібний лише другій сторінці, для першої не зайвий: словник
  // на мову один, а сторінок кілька.
  const problems = checkKeys(['<p>{{a}}</p>', '<p>{{b}}</p>'], { a: '1', b: '2' }, 'en');
  assert.deepStrictEqual(problems, []);
});

test('checkKeys і з кількома шаблонами ловить ключ, якого не вживає жоден', () => {
  const problems = checkKeys(['<p>{{a}}</p>', '<p>{{b}}</p>'], { a: '1', b: '2', ghost: '3' }, 'uk');
  assert.strictEqual(problems.length, 1);
  assert.match(problems[0], /ghost/);
});

test('metaFor віддає підсторінці її власну глибину, дорогу додому й пошту', () => {
  const meta = metaFor('uk', ['en', 'uk'], { 'lang.aria': 'Мова сторінки' }, 'privacy');
  assert.strictEqual(meta['@base'], '../../');
  assert.strictEqual(meta['@home'], '../');
  assert.strictEqual(meta['@canonical'], 'https://vladarey.github.io/ecru-landing/uk/privacy/');
  assert.ok(meta['@email']);
});
