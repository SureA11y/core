'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'img-alt-decorative';

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
    'img-alt-decorative-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 8, maxOccurrences: 8 });

  const expected = [
    'img_d_01',
    'img_d_04',
    'img_d_08',
    'img_d_10',
    'img_d_11',
    'img_d_12',
    'svg_d_01',
    'canvas_d_01'
  ];
  const notExpected = [
    'img_d_02',
    'img_d_03',
    'img_d_05',
    'img_d_06',
    'img_d_07',
    'img_d_09',
    'svg_d_02',
    'svg_d_03',
    'canvas_d_02'
  ];

  for (const id of expected) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of notExpected) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const html = `<!doctype html><html><body><img id="a" alt="" src="x.png"></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(
    rule.title,
    'Les <img>/<canvas>/<svg> exclus doivent être décoratifs (revue manuelle)'
  );
  assert.strictEqual(
    rule.description,
    'Signale les éléments <img>, <canvas> et <svg> exclus de l’arbre d’accessibilité (aria-hidden, role="none"/"presentation", alt vide, ou un svg/canvas sans étiquette) afin de confirmer qu’ils sont purement décoratifs.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Vérifiez si ce <img> est décoratif.');
});

// role="presentation"/"none" is one of ACT e88epe's own exclusion mechanisms
// (its own failed examples use non-empty alt with aria-hidden/role="none"),
// so it's flagged the same as alt="": one of the review triggers, not an
// applicability exclusion.

test(`${RULE_ID}: a non-focusable role="presentation" img is reviewed even with a non-empty alt`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" src="x.png" alt="W3C logo" role="presentation"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'img1'));
});

test(`${RULE_ID}: role="none" excludes the same way role="presentation" does`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" src="x.png" alt="W3C logo" role="none"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'img1'));
});

test(`${RULE_ID}: a focusable role="presentation" img is NOT reviewed here (presentation-role-conflict owns that contradiction)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" src="x.png" alt="" role="presentation" tabindex="0"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden excludes an img regardless of a non-empty alt (ACT e88epe failed example)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" src="x.png" alt="W3C logo" aria-hidden="true"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'img1'));
});

test(`${RULE_ID}: an unlabeled <svg> with no naming intent is reviewed (implicit graphics-document role, ACT e88epe failed example)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><svg id="svg1" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'svg1'));
});

test(`${RULE_ID}: an <svg> with an explicit role="img" and aria-label is not reviewed (a naming question, not this rule's)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><svg id="svg1" role="img" aria-label="Star"><path d="M0 0h10v10H0z"/></svg></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an unlabeled <canvas> with no explicit role is reviewed (ACT e88epe failed example)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><canvas id="canvas1" width="60" height="60"></canvas></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'canvas1'));
});

test(`${RULE_ID}: a <canvas> with an explicit role and aria-label is not reviewed`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><canvas id="canvas1" role="img" aria-label="Chart" width="60" height="60"></canvas></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an unlabeled svg inside an ancestor already named by the author is not reviewed (ACT e88epe's own exception)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>
      <a href="/" aria-label="SVG star"><svg id="svg1" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg></a>
    </body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an inert img is reviewed (inert removes it from the accessibility tree, same as aria-hidden)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><div inert><img id="img1" alt="" src="x.png"></div></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'img1'));
});

test(`${RULE_ID}: a display:none img is not applicable (not visible at all)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" alt="" src="x.png" style="display:none"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
