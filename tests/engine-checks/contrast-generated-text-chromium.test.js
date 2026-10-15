'use strict';

// Text a ::before or ::after `content`, or a list item's ::marker, generates
// is measured in a browser (#219), in the pseudo-element's colour and font
// against its element's background and its own. It was never measured: a
// ::before drawn at 1.61:1 passed. Where it can't be measured (a
// pseudo-element taken out of the flow, content that can't be read, a
// shadow) contrast-computable asks about it. jsdom computes no
// pseudo-element styles, so there it is left out.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, executablePath, skip } = require('../helpers/chromium');
const { runa11yCoreOnHtml } = require('../../src/testing.js');

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');
const RULES = ['contrast-computable', 'contrast-minimum'];

const STYLE = `
html { background: #fff }
p { color: #000 }
#new::before { content: "New: "; color: #ccc }
#tag::after { content: " Beta"; color: #fff; background: #888 }
#large::before { content: attr(data-label); color: #949494; font-size: 30px }
#small::before { content: attr(data-label); color: #949494 }
#icon::before { content: "\\f101"; color: #ccc }
#image::before { content: url(x.png) }
#pinned::before { content: "Pinned"; position: absolute; color: #ccc }
#counted::before { content: counter(step, my-style) ". "; color: #ccc }
#shadow::before { content: "Glow"; color: #ccc; text-shadow: 0 0 2px #000 }
#both { color: #bbb }
#both::before { content: "Both "; color: #ccc }
ol.faint li::marker { color: #ccc }
ul.faint li { color: #000 }
ul.faint li::marker { color: #ccc }
`;

const BODY = `
<p id="new">Updated</p>
<p id="tag">Feature</p>
<p id="large" data-label="Big label">Body</p>
<p id="small" data-label="Small label">Body</p>
<p id="icon">Icon</p>
<p id="image">Image</p>
<p id="pinned">Pinned</p>
<p id="counted">Counted</p>
<p id="shadow">Shadow</p>
<p id="both">Both</p>
<ol class="faint"><li id="first">One</li></ol>
<ul class="faint"><li id="bullet">Bullet</li></ul>`;

const page = `<!doctype html><html lang="en"><head><title>t</title><style>${STYLE}</style></head><body><main>${BODY}</main></body></html>`;

const summarize = (results) => {
  const by = (id) => results.find((r) => r.ruleId === id);
  const row = (o) => {
    const d = o.data.details;
    return [
      o.selector,
      d.generatedBy || null,
      d.metrics ? Math.round(d.metrics.ratio * 100) / 100 : d.reasonCode,
      o.i18n.summaryKey
    ];
  };
  return {
    asked: by('contrast-computable')
      .occurrences.filter((o) => o.selector)
      .map(row),
    failed: by('contrast-minimum')
      .occurrences.filter((o) => o.selector)
      .map(row)
  };
};

test('generated text is measured, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const p = await browser.newPage();
  await p.setContent(page);
  await p.addScriptTag({ content: BUNDLE });
  const results = await p.evaluate(
    (rules) => window.a11ycore.runa11yCoreInPage(null, null, {}, rules).checksResults,
    RULES
  );
  const ASKED = 'contrastComputable_cantTell_generatedText';
  const FAILED = 'contrastMinimum_fail_generatedText';
  assert.deepEqual(summarize(results), {
    asked: [
      ['#pinned', '::before', 'GENERATED_TEXT_POSITIONED', ASKED],
      ['#counted', '::before', 'GENERATED_TEXT_UNREADABLE', ASKED],
      ['#shadow', '::before', 'TEXT_SHADOW', ASKED]
    ],
    failed: [
      // The element's own text, then what its ::before generates.
      ['#both', null, 1.92, 'contrastMinimum_fail_belowThreshold'],
      ['#new', '::before', 1.61, FAILED],
      // Measured against its own background.
      ['#tag', '::after', 3.54, FAILED],
      // 3.03:1 is enough for 30px text, not for 16px.
      ['#small', '::before', 3.03, FAILED],
      ['#both', '::before', 1.61, FAILED],
      // A number is text; a bullet isn't.
      ['#first', '::marker', 1.61, FAILED]
    ]
  });
});

test('generated text is left out in jsdom, which computes no pseudo-element styles', () => {
  const result = runa11yCoreOnHtml(page, { runOnly: RULES });
  assert.deepEqual(summarize(result.checksResults), {
    asked: [],
    failed: [['#both', null, 1.92, 'contrastMinimum_fail_belowThreshold']]
  });
});
