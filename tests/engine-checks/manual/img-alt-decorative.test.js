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
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 12, maxOccurrences: 12 });

  const expected = [
    'img_d_01',
    'img_d_04',
    'img_d_08',
    'img_d_11',
    'img_d_12',
    'svg_d_01',
    'canvas_d_01',
    'img_d_14',
    'img_d_15',
    'img_d_17',
    'img_d_18',
    'svg_d_04'
  ];
  const notExpected = [
    'img_d_02',
    'img_d_03',
    'img_d_05',
    'img_d_06',
    'img_d_07',
    'img_d_09',
    // Inert: left out with other hidden content (#226).
    'img_d_10',
    'svg_d_02',
    'svg_d_03',
    'canvas_d_02',
    'img_d_13', // alt=" " is not the decorative marker; img-alt-present fails it
    'svg_d_05',
    'img_d_16'
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
    'Les <img>/<canvas>/<svg> exclus doivent être décoratifs (vérification manuelle)'
  );
  assert.strictEqual(
    rule.description,
    'Signale les éléments <img>, <canvas> et <svg> exclus de l’arbre d’accessibilité (aria-hidden, role="none"/"presentation", alt vide, ou un svg/canvas sans étiquette) afin de confirmer qu’ils sont purement décoratifs.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'Vérifiez si cet élément <img> est purement décoratif.');
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

test(`${RULE_ID}: a named figure or landmark does not exempt the images in it`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="fr"><head><title>t</title></head><body>
      <figure role="figure" aria-label="Crédit photo : DR"><img id="photo" alt="" src="photo.jpg"></figure>
      <nav aria-label="Menu Footer"><img id="logo" alt="" src="logo.png"></nav>
      <section aria-label="News"><svg id="deco" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg></section>
    </body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  for (const id of ['photo', 'logo', 'deco']) assert.ok(hasOccurrenceForId(rule, id), id);
});

test(`${RULE_ID}: an image under an author-named control, img or item is not reviewed`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>
      <div role="button" tabindex="0" aria-label="Close"><img alt="" src="close.png"></div>
      <span role="img" aria-label="Five stars"><svg viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg></span>
      <div role="listbox" aria-label="Fruit"><div role="option" aria-label="Apple"><img alt="" src="apple.png"></div></div>
      <h2 aria-label="Results"><img alt="" src="chart.png"></h2>
    </body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { maxOccurrences: 0 });
});

test(`${RULE_ID}: an image beside the text that names a link or button is still reviewed`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>
      <a href="/r.pdf">Annual report <img id="pdf" src="pdf.png" alt=""></a>
      <a href="/p">Product <img id="star" src="star-full.png" alt=""><img src="star-empty.png" alt=""></a>
      <a href="https://example.org/">Partner site <svg id="ext" aria-hidden="true" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg></a>
      <a href="/q"><span class="visually-hidden">Quarterly results</span><img id="chart" src="chart.png" alt="" width="600" height="400"></a>
      <a href="/c"><img src="logo.png" alt="Contact"><img id="beside" src="arrow.png" alt=""></a>
      <button type="button"><img id="save" alt="" src="save.png"> Save</button>
    </body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 7, maxOccurrences: 7 });
  for (const id of ['pdf', 'star', 'ext', 'chart', 'beside', 'save'])
    assert.ok(hasOccurrenceForId(rule, id), id);
});

test(`${RULE_ID}: an image in a composite widget's named container is still reviewed`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>
      <div role="menu" aria-label="Actions"><img id="deco" alt="" src="sep.png"></div>
    </body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'deco'));
});

test(`${RULE_ID}: an image that is a link's only content is still reviewed`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>
      <a href="/b"><img id="only" alt="" src="banner.png"></a>
    </body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'only'));
});

// An inert img takes no interaction and no assistive technology gets it: it
// is left out with other hidden content, as img-alt-present leaves it (#226).
test(`${RULE_ID}: an inert img is not applicable, as img-alt-present skips it`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><div inert><img id="img1" alt="" src="x.png"></div></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a display:none img is not applicable (not visible at all)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" alt="" src="x.png" style="display:none"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// Only a literally empty alt is the decorative marker (HTML-AAM): alt=" "
// keeps the img role with an empty name, which img-alt-present fails. Asking
// "is it decorative?" here would contradict that failure.
test(`${RULE_ID}: alt=" " is not treated as decorative; img-alt-present fails it`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="a" src="a.png" alt=" "></body></html>`;
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, {
      engineOptions,
      ...(engineOptions.profile ? {} : { runOnly: [RULE_ID, 'img-alt-present'] })
    });
    assertRule(result, RULE_ID, 'notApplicable', { maxOccurrences: 0 });
    assertRule(result, 'img-alt-present', 'fail', { minOccurrences: 1 });
  }
});

// An <svg> named or described by a direct child <title> or <desc>, wherever
// it is among the children, is not an unlabeled image left out of the
// accessibility tree (#118).
test(`${RULE_ID}: an svg with a later direct child <title> or <desc> is not an unlabeled image`, () => {
  for (const child of ['<title>Star</title>', '<desc>A star</desc>']) {
    const html = `<!doctype html><html><body><svg width="20" height="20"><g><circle cx="10" cy="10" r="4"/></g>${child}</svg></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
  const unlabeled = runa11yCoreOnHtml(
    '<!doctype html><html><body><svg width="20" height="20"><g><circle cx="10" cy="10" r="4"/></g></svg></body></html>',
    { runOnly: [RULE_ID] }
  );
  assertRule(unlabeled, RULE_ID, 'cantTell', { minOccurrences: 1 });
});

test(`${RULE_ID}: copies of the same image are counted, each still reported`, () => {
  const chevron = '<svg viewBox="0 0 10 10"><path d="M2 1l5 4-5 4"/></svg>';
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>
      <img id="a1" alt="" src="/icons/chevron.png">
      <img id="a2" alt="" src="/icons/chevron.png">
      <img id="b1" alt="" src="/photos/team.jpg">
      <div id="s1">${chevron}</div>
      <div id="s2">
        ${chevron.replace('<svg', '<svg  ')}
      </div>
      <svg id="s3" viewBox="0 0 10 10"><path d="M8 1l-5 4 5 4"/></svg>
      <canvas id="c1" width="20" height="20"></canvas>
      <canvas id="c2" width="20" height="20"></canvas>
    </body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 8, maxOccurrences: 8 });
  const details = rule.occurrences.map((o) => o.data.details);
  const pairs = details.map((d) => [d.sameImageCount, d.sameImageFirst]);
  assert.deepEqual(pairs, [
    [2, true], // a1
    [2, false], // a2
    [1, true], // b1
    [2, true], // the first chevron svg
    [2, false], // the same chevron, spaced differently
    [1, true], // s3, another arrow
    [1, true], // c1: a canvas is never the same as another
    [1, true] // c2
  ]);
});

test(`${RULE_ID}: lazy-load placeholders and differently drawn svgs are not the same image`, () => {
  const star = '<path d="M5 0l1 4h4l-3 2 1 4-3-2-3 2 1-4-3-2h4z"/>';
  const pixel = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>
      <img alt="" src="${pixel}" data-src="/photos/a.jpg">
      <img alt="" src="${pixel}" data-srcset="/photos/b.jpg 1x">
      <svg class="star full" fill="gold" viewBox="0 0 10 10">${star}</svg>
      <svg class="star empty" fill="none" stroke="gold" viewBox="0 0 10 10">${star}</svg>
      <svg class="star full" fill="gold" viewBox="0 0 10 10">${star}</svg>
    </body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 5, maxOccurrences: 5 });
  assert.deepEqual(
    rule.occurrences.map((o) => o.data.details.sameImageCount),
    [1, 1, 2, 1, 2]
  );
});

// A hidden image that is all a link holds, with no name on the link, leaves
// it unnamed: it leans fail. An image 2 px wide or high, or one whose file is
// named as a spacer, shows nothing to describe: it leans pass. Any other
// hidden image needs a person.
test(`${RULE_ID}: leans fail on an unnamed control, pass on a spacer, none otherwise`, () => {
  const run = (body) =>
    assertRule(
      runa11yCoreOnHtml(`<!doctype html><html lang="en"><body><main>${body}</main></body></html>`, {
        runOnly: [RULE_ID]
      }),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    ).occurrences[0];

  const control = run('<a href="/home"><img src="home.png" alt=""></a>');
  assert.strictEqual(control.data.details.reasonCode, 'IMAGE_ONLY_CONTROL_CONTENT');
  assert.strictEqual(control.lean.toward, 'fail');
  assert.strictEqual(control.lean.i18n.whyKey, 'img_altDecorative_lean_why_control');

  const tiny = run('<p>Text</p><img src="line.png" alt="" width="600" height="1">');
  assert.strictEqual(tiny.data.details.reasonCode, 'EXCLUDED_ELEMENT_REVIEW');
  assert.strictEqual(tiny.lean.toward, 'pass');
  assert.strictEqual(tiny.lean.i18n.whyKey, 'img_altDecorative_lean_why_tiny');

  const spacer = run('<p>Text</p><img src="/img/spacer.gif" alt="">');
  assert.strictEqual(spacer.lean.toward, 'pass');
  assert.strictEqual(spacer.lean.i18n.whyKey, 'img_altDecorative_lean_why_spacer');
  assert.deepStrictEqual(spacer.lean.signals, [
    { signal: 'spacer-file-name', value: 'spacer.gif' }
  ]);

  const photo = run('<p>Text</p><img src="team-photo.jpg" alt="" width="400" height="300">');
  assert.strictEqual(photo.data.details.reasonCode, 'EXCLUDED_ELEMENT_REVIEW');
  assert.strictEqual(photo.lean, undefined);
});
