'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'canvas-text-alternative-quality';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no matching elements`, () => {
  const html = `<!doctype html><html><body><p>None</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when at least one applicable element triggers manual review`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'canvas-text-alternative-quality-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });

  const expected = ['c_q_01', 'c_q_02', 'c_q_05', 'c_q_08'];
  const notExpected = ['c_q_03', 'c_q_04', 'c_q_06', 'c_q_07', 'c_q_09'];

  for (const id of expected) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of notExpected) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'canvas-text-alternative-quality-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(
    rule.title,
    'L\u2019\u00e9quivalent textuel de <canvas> doit \u00eatre appropri\u00e9 (v\u00e9rification manuelle)'
  );
  assert.strictEqual(
    rule.description,
    'Signale les \u00e9l\u00e9ments <canvas> pour lesquels un \u00e9quivalent textuel a \u00e9t\u00e9 d\u00e9tect\u00e9, afin de v\u00e9rifier manuellement son \u00e9quivalence et sa pertinence.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(
    occ.summary,
    'V\u00e9rifiez que l\u2019\u00e9quivalent textuel de ce <canvas> transmet ce qu\u2019il affiche.'
  );
  assert.strictEqual(
    occ.hint,
    'Le texte de remplacement ou le nom accessible devrait donner la m\u00eame information, ou remplir la m\u00eame fonction, que ce qui est dessin\u00e9.'
  );
});

// role="presentation"/"none" exclusion (mirrors img-alt-present policy: exclude
// only when the element is NOT focusable, since a focusable element stays in
// the tab order and still needs a usable name). A <canvas> is not focusable on its own, so the exclusion applies until a tabindex puts it in the tab order.

test(`${RULE_ID}: a non-focusable role="presentation" canvas is excluded from review`, () => {
  const applicable = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><canvas id="canvas1" aria-label="Sales chart"></canvas></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(applicable, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><canvas id="canvas1" role="presentation" aria-label="Sales chart"></canvas></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role="none" excludes the same way role="presentation" does`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><canvas id="canvas1" role="none" aria-label="Sales chart"></canvas></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a fallback list or upper-case role (role="foo none", role="PRESENTATION") excludes the same way`, () => {
  for (const role of ['foo none', 'PRESENTATION']) {
    const result = runa11yCoreOnHtml(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><canvas id="canvas1" role="${role}" aria-label="Sales chart"></canvas></body></html>`,
      { runOnly: [RULE_ID] }
    );
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a focusable role="presentation" canvas is still reviewed`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><canvas id="canvas1" role="presentation" tabindex="0" aria-label="Sales chart"></canvas></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'canvas1'));
});

test(`${RULE_ID}: maps to WCAG 1.1.1`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><canvas id="canvas1">Sales 2024: 10k</canvas></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html), RULE_ID, 'cantTell');
  assert.ok(
    rule.meta.normativeMappings.some((m) => m.standard === 'WCAG' && m.requirement === '1.1.1')
  );
});

// A fallback that only says the browser can't draw the canvas speaks of the
// browser, and a file name or a generic word says nothing of the drawing:
// both lean fail. A note beside a real description, or any other text,
// needs a person.
test(`${RULE_ID}: leans fail on an unsupported-browser note, a file name or a placeholder`, () => {
  const run = (canvas) =>
    assertRule(
      runa11yCoreOnHtml(
        `<!doctype html><html lang="en"><body><main>${canvas}</main></body></html>`,
        {
          runOnly: [RULE_ID]
        }
      ),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    ).occurrences[0];
  const note = run('<canvas>Your browser does not support the canvas element.</canvas>');
  assert.strictEqual(note.lean.toward, 'fail');
  assert.strictEqual(note.lean.i18n.whyKey, 'canvas_textAltQuality_lean_why_unsupported');
  const sorry = run(
    "<canvas>Sorry, your browser doesn't support HTML5 canvas. Please use a modern browser.</canvas>"
  );
  assert.strictEqual(sorry.lean.toward, 'fail');
  const word = run('<canvas aria-label="graphic"></canvas>');
  assert.strictEqual(word.lean.toward, 'fail');
  assert.strictEqual(word.lean.i18n.whyKey, 'canvas_textAltQuality_lean_why');
  for (const canvas of [
    '<canvas>Your browser does not support canvas. Sales rose 20% from 2023 to 2024.</canvas>',
    '<canvas>Sales rose 20% from 2023 to 2024.</canvas>',
    // The ARIA name wins over the fallback.
    '<canvas aria-label="Sales by month">Your browser does not support canvas.</canvas>'
  ]) {
    assert.strictEqual(run(canvas).lean, undefined, canvas);
  }
});

// Browsers name a <canvas> from its ARIA name first; the fallback content is
// what it holds, and its text alternative only when nothing names it.
test(`${RULE_ID}: an ARIA name is read before the fallback content`, () => {
  const html = `<!doctype html><html lang="en"><body><main><canvas aria-label="Sales by month, 2026" width="300" height="150">Your browser does not support canvas.</canvas></main></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.value, 'Sales by month, 2026');
  assert.equal(rule.occurrences[0].data.details.mechanism, 'aria-label');
  // The "browser does not support canvas" note is not the name, so it no
  // longer leans fail.
  assert.equal(rule.occurrences[0].lean, undefined);
});
