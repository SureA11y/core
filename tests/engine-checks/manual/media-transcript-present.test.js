'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom } = require('../../helpers/runDomRulesOnHtml.js');
const { runDomRulesInPage } = require('../../../src/index.js');

const RULE_ID = 'media-alternative-transcript-evidence';

const LOREM = 'lorem ipsum dolor sit amet '.repeat(10).trim();

// The fixture used above only exercises aria-describedby (strong) and an
// external transcript link (weak) -- it never triggers the
// adjacent-heading or same-document-anchor evidence paths in
// findTranscriptEvidence, nor the "every applicable element already has
// strong evidence" -> notApplicable branch. Those only run through
// runa11yCoreOnHtml (toString-embedded), which Node's
// --experimental-test-coverage can't attribute back to this file (see
// tests/node-runtime-parity.test.js's header comment), so exercise them here
// directly via runDomRulesInPage.
function runNode(html) {
  createDom(html);
  return runDomRulesInPage('https://example.test/', null, {}, { includeRuleIds: [RULE_ID] });
}

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
    'media-transcript-present-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });

  // mt_01: no transcript evidence at all -> cantTell occurrence (transcriptNotDetected)
  // mt_02: external/cross-document transcript link -> cantTell occurrence (transcriptEvidenceUnverified)
  // mt_03: strong evidence via aria-describedby with transcript token -> no occurrence (silently considered resolved)
  // mt_04: aria-hidden ancestor -> excluded (not eligible)
  // mt_05: hidden attribute ancestor -> excluded (not eligible)
  // mt_06: display:none ancestor -> excluded (not eligible)
  // mt_07: visibility:hidden ancestor, but element itself is visibility:visible (invertible) -> eligible, no evidence -> cantTell occurrence
  // mt_08: inert ancestor -> excluded (not eligible)
  const expected = ['mt_01', 'mt_02', 'mt_07'];
  const notExpected = ['mt_03', 'mt_04', 'mt_05', 'mt_06', 'mt_08'];

  for (const id of expected) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of notExpected) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID} (node runtime): strong evidence via an adjacent transcript heading + substantial following text -> notApplicable`, () => {
  const html = `<!doctype html><html><body>
    <div>
      <h2>Transcript</h2>
      <p>${LOREM}</p>
      <video id="v1" controls><source src="a.mp4" type="video/mp4"></video>
    </div>
  </body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

test(`${RULE_ID} (node runtime): strong evidence via a same-document anchor resolving to a transcript section -> notApplicable`, () => {
  const html = `<!doctype html><html><body>
    <div>
      <video id="v2" controls><source src="b.mp4" type="video/mp4"></video>
      <a href="#transcript-section">Transcript</a>
    </div>
    <section id="transcript-section">
      <h2>Transcript</h2>
      <p>${LOREM}</p>
    </section>
  </body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

test(`${RULE_ID} (node runtime): a same-document anchor that does not resolve to a verified transcript section -> cantTell (anchor-unverified)`, () => {
  const html = `<!doctype html><html><body>
    <div>
      <video id="v3" controls><source src="c.mp4" type="video/mp4"></video>
      <a href="#missing-section">Transcript</a>
    </div>
  </body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 1);
  assert.strictEqual(rule.occurrences[0].data.details.evidence.method, 'anchor-unverified');
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'transcriptEvidenceUnverified');
});

test(`${RULE_ID} (node runtime): notApplicable when every applicable media element already has strong evidence`, () => {
  const html = `<!doctype html><html><body>
    <div>
      <audio id="v4" controls aria-describedby="desc4"><source src="d.mp3" type="audio/mpeg"></audio>
      <p id="desc4">Transcript: ${LOREM}</p>
    </div>
  </body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});
