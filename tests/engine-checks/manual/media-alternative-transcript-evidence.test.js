'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml');
const { assertRule } = require('../../helpers/assertRule');

const RULE_ID = 'a11ycore-media-alternative-transcript-evidence';

// Helper to generate deterministic long text (no randomness).
function longText(minChars) {
    // 10 chars per token including space-ish; tweak until comfortably above thresholds.
    const token = 'loremipsum ';
    const reps = Math.ceil(minChars / token.length) + 5;
    return token.repeat(reps).trim();
}

function getOccurrenceDetails(engineOutput) {
    // Prefer assertRule helper if it returns ruleResult; otherwise fall back to common shapes.
    try {
        const ruleResult = assertRule(engineOutput, RULE_ID, undefined);
        return ruleResult;
    } catch {
        if (engineOutput && Array.isArray(engineOutput.checksResults)) {
            return engineOutput.checksResults.find((r) => r && r.ruleId === RULE_ID) || null;
        }
        if (engineOutput && engineOutput.byRuleId && engineOutput.byRuleId[RULE_ID]) {
            return engineOutput.byRuleId[RULE_ID];
        }
        return null;
    }
}

test(`${RULE_ID}: no applicable <audio>/<video> => notApplicable`, () => {
    const html = `<!doctype html><html><body><p>No media here.</p></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-describedby contains transcript token and substantial text`, () => {
    const transcript = `Transcript: ${longText(220)}`;

    const html = `<!doctype html><html><body>
    <audio controls aria-describedby="tx">
      <source src="x.mp3" type="audio/mpeg" />
    </audio>
    <div id="tx">${transcript}</div>
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-describedby has no token but is very substantial (>= 400 chars)`, () => {
    // No "transcript" token intentionally.
    const described = longText(420);

    const html = `<!doctype html><html><body>
    <video controls aria-describedby="desc">
      <source src="x.mp4" type="video/mp4" />
    </video>
    <div id="desc">${described}</div>
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0 });
});

test(`${RULE_ID}: pass when transcript heading exists with substantial adjacent text (adjacent-heading)`, () => {
    const tx = longText(220);

    const html = `<!doctype html><html><body>
    <div id="wrap">
      <audio controls>
        <source src="x.mp3" type="audio/mpeg" />
      </audio>
      <h3>Transcript</h3>
      <p>${tx}</p>
    </div>
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0 });
});

test(`${RULE_ID}: pass when explicit Transcript link resolves to on-page transcript section with heading + substantial text (anchor-target)`, () => {
    const tx = longText(220);

    const html = `<!doctype html><html><body>
    <div id="wrap">
      <audio controls>
        <source src="x.mp3" type="audio/mpeg" />
      </audio>
      <p><a href="#tgt">Transcript</a></p>
    </div>

    <section id="tgt">
      <h2>Transcript</h2>
      <p>${tx}</p>
    </section>
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when no transcript evidence is detected (reasonCode transcriptNotDetected)`, () => {
    const html = `<!doctype html><html><body>
    <audio controls>
      <source src="x.mp3" type="audio/mpeg" />
    </audio>
    <p>Some nearby text but nothing labeled as transcript.</p>
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

    const rr = getOccurrenceDetails(result);
    assert.ok(rr, 'rule result should exist');
    assert.ok(rr.occurrences && rr.occurrences.length >= 1, 'should have occurrences');

    const o = rr.occurrences[0];
    assert.equal(o.data.details.reasonCode, 'transcriptNotDetected');
    assert.equal(o.data.details.evidence.strength, 'none');
    assert.equal(o.data.details.evidence.method, 'none');
});

test(`${RULE_ID}: cantTell when transcript link is external/cross-document (reasonCode transcriptEvidenceUnverified, method external-link)`, () => {
    const html = `<!doctype html><html><body>
    <div>
      <audio controls>
        <source src="x.mp3" type="audio/mpeg" />
      </audio>
      <p><a href="/transcripts/audio.html">Transcript</a></p>
    </div>
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

    const rr = getOccurrenceDetails(result);
    const o = rr.occurrences[0];
    assert.equal(o.data.details.reasonCode, 'transcriptEvidenceUnverified');
    assert.equal(o.data.details.evidence.strength, 'weak');
    assert.equal(o.data.details.evidence.method, 'external-link');
    assert.equal(o.data.details.evidence.transcriptLinkHref, '/transcripts/audio.html');
});

test(`${RULE_ID}: cantTell when transcript link is same-page but target cannot be verified (anchor-unverified)`, () => {
    // Target exists but does NOT include transcript heading or enough text.
    const html = `<!doctype html><html><body>
    <div>
      <audio controls>
        <source src="x.mp3" type="audio/mpeg" />
      </audio>
      <p><a href="#tgt">Transcript</a></p>
    </div>

    <section id="tgt">
      <h2>Resources</h2>
      <p>Short text.</p>
    </section>
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

    const rr = getOccurrenceDetails(result);
    const o = rr.occurrences[0];
    assert.equal(o.data.details.reasonCode, 'transcriptEvidenceUnverified');
    assert.equal(o.data.details.evidence.strength, 'weak');
    assert.equal(o.data.details.evidence.method, 'anchor-unverified');
    assert.equal(o.data.details.evidence.transcriptLinkHref, '#tgt');
});

test(`${RULE_ID}: determinism — running twice yields identical rule result`, () => {
    const tx = `Transcript: ${longText(220)}`;

    const html = `<!doctype html><html><body>
    <audio controls aria-describedby="tx">
      <source src="x.mp3" type="audio/mpeg" />
    </audio>
    <div id="tx">${tx}</div>
  </body></html>`;

    const r1 = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const r2 = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

    const rr1 = getOccurrenceDetails(r1);
    const rr2 = getOccurrenceDetails(r2);

    assert.deepEqual(rr1, rr2);
});
