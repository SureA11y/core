'use strict';

// The quality rules match known non-descriptive phrases. English is always
// checked; the element's own language (nearest lang attribute) adds its list.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

function outcomeOf(html, ruleId) {
  const result = runa11yCoreOnHtml(html, { runOnly: [ruleId] });
  const rule = result.checksResults.find((r) => r.ruleId === ruleId);
  assert.ok(rule, `${ruleId} ran`);
  return rule;
}

const page = (lang, body, title = 'Informe anual de resultados 2026') =>
  `<!doctype html><html lang="${lang}"><head><title>${title}</title></head><body>${body}</body></html>`;

for (const [lang, text] of [
  ['ja', 'こちら'],
  ['ja', '詳しくはこちら→'],
  ['ja', '続きを読む'],
  ['de', 'Hier klicken'],
  ['es', 'Leer más'],
  ['fr', 'En savoir plus'],
  ['fr', 'Plus d’infos']
]) {
  test(`link-name-quality flags "${text}" on a ${lang} page`, () => {
    const rule = outcomeOf(
      page(lang, `<p>Texto.</p><a href="/x">${text}</a>`),
      'link-name-quality'
    );
    assert.equal(rule.outcome, 'cantTell');
  });
}

test('link-name-quality does not flag a word that is generic only in another language', () => {
  const html = page('en', '<a href="/suite">Suite</a> <a href="/plus">Plus</a>');
  assert.equal(outcomeOf(html, 'link-name-quality').occurrences.length, 0);
});

test('link-name-quality uses the link’s own language, not the page’s', () => {
  const html = page('en', '<p lang="fr"><a href="/x">Lire la suite</a></p>');
  assert.equal(outcomeOf(html, 'link-name-quality').outcome, 'cantTell');
});

test('link-name-quality still flags English phrases on a Japanese page', () => {
  const html = page('ja', '<a href="/x">Read more</a>');
  assert.equal(outcomeOf(html, 'link-name-quality').outcome, 'cantTell');
});

for (const [lang, text] of [
  ['ja', '見出し'],
  ['ja', '見出し２'],
  ['ja', '第1章'],
  ['de', 'Überschrift'],
  ['es', 'Sin título'],
  ['fr', 'Sans titre']
]) {
  test(`heading-quality flags "${text}" on a ${lang} page`, () => {
    const rule = outcomeOf(page(lang, `<h2>${text}</h2><p>Texto.</p>`), 'heading-quality');
    assert.equal(rule.outcome, 'cantTell');
  });
}

test('heading-quality leaves a descriptive Japanese heading alone', () => {
  const rule = outcomeOf(page('ja', '<h2>料金プランの比較</h2><p>本文</p>'), 'heading-quality');
  assert.equal(rule.occurrences.length, 0);
});

for (const [lang, text] of [
  ['ja', '入力欄'],
  ['de', 'Eingabefeld'],
  ['es', 'Campo'],
  ['fr', 'Champ']
]) {
  test(`form-control-label-quality flags the label "${text}" on a ${lang} page`, () => {
    const html = page(lang, `<label for="f">${text}</label><input id="f" type="text">`);
    assert.equal(outcomeOf(html, 'form-control-label-quality').outcome, 'cantTell');
  });
}

test('page-title-patterns treats a short Japanese title as a full title', () => {
  const html = page('ja', '<p>本文</p>', 'お問い合わせ');
  assert.equal(outcomeOf(html, 'page-title-patterns').occurrences.length, 0);
});

for (const [lang, title] of [
  ['ja', 'トップページ'],
  ['ja', '株式会社サンプル | ホーム'],
  ['de', 'Startseite'],
  ['es', 'Inicio - Ayuntamiento de Ejemplo'],
  ['fr', 'Accueil']
]) {
  test(`page-title-patterns flags "${title}" on a ${lang} page`, () => {
    const html = page(lang, '<p>Texto.</p>', title);
    assert.equal(outcomeOf(html, 'page-title-patterns').outcome, 'cantTell');
  });
}

const LONG_JA = 'これは動画の内容をすべて書き起こしたテキストです。'.repeat(12);

test('media transcript evidence recognizes a Japanese transcript heading', () => {
  const html = page(
    'ja',
    `<div><h2>文字起こし</h2><p>${LONG_JA}</p><video controls><source src="a.mp4" type="video/mp4"></video></div>`
  );
  assert.equal(outcomeOf(html, 'media-alternative-transcript-evidence').outcome, 'notApplicable');
});

test('link-name-quality ignores a trailing arrow after a generic phrase', () => {
  const html = page('en', '<a href="/x">Read more »</a>');
  assert.equal(outcomeOf(html, 'link-name-quality').outcome, 'cantTell');
});
