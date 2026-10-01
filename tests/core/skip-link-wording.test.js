'use strict';

/**
 * helpers.hasSkipLinkWording: the one list of skip-link phrasings every rule
 * that looks for a skip link uses (core's skip-link, RGAA's skip-link-present).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
const helpers = createDomHelpers({ window, document: window.document, root: window.document });

test('skip-link phrasings in the shipped languages are recognised', () => {
  for (const text of [
    'Skip to main content',
    'Jump to navigation',
    'Aller au contenu',
    'Passer directement à la navigation',
    'Accéder au menu',
    'Accès rapide',
    "Liens d'évitement",
    'Zum Inhalt springen',
    'Direkt zum Hauptinhalt',
    'Saltar al contenido',
    'Ir directamente al contenido',
    '本文へ移動',
    'メインコンテンツへスキップ'
  ]) {
    assert.equal(helpers.hasSkipLinkWording(text), true, text);
  }
});

test('ordinary link text is not a skip link', () => {
  for (const text of ['Home', 'Contact us', 'Aller plus loin', 'Inhalt', '', null, 42]) {
    assert.equal(helpers.hasSkipLinkWording(text), false, String(text));
  }
});
