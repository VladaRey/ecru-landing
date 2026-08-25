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

test('langSwitch робить поточну мову не посиланням', () => {
  const out = langSwitch('uk', ['en', 'uk']);
  assert.match(out, /<span aria-current="page">Українська<\/span>/);
  assert.doesNotMatch(out, /<a[^>]*>Українська</);
});

test('langSwitch веде з мовної теки на корінь через ../', () => {
  assert.match(langSwitch('uk', ['en', 'uk']), /href="\.\.\/"[^>]*>English/);
});

test('langSwitch веде з кореня у мовну теку без ../', () => {
  assert.match(langSwitch('en', ['en', 'uk']), /href="uk\/"[^>]*>Українська/);
});

test('langSwitch ніколи не видає порожній href', () => {
  for (const current of ['en', 'uk']) {
    assert.doesNotMatch(langSwitch(current, ['en', 'uk']), /href=""/);
  }
});

test('metaFor віддає повний набір службових ключів', () => {
  const meta = metaFor('uk', ['en', 'uk']);
  assert.strictEqual(meta['@lang'], 'uk');
  assert.strictEqual(meta['@base'], '../');
  assert.strictEqual(meta['@canonical'], 'https://vladarey.github.io/ecru-landing/uk/');
  assert.ok(meta['@alternates'].includes('x-default'));
  assert.ok(meta['@langswitch'].includes('aria-current'));
});
