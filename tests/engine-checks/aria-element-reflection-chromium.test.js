'use strict';

/**
 * A name a script gives as element references: el.ariaLabelledByElements =
 * [label]. HTML reflects ARIA's element-reference attributes this way; the
 * content attribute then reads "" and only the IDL attribute holds the
 * elements, and every browser names the element from them (Baseline since
 * April 2025). The name is programmatically determined, as 4.1.2 asks, but
 * the engine read only the attribute, so it failed a named field, button
 * or image. References the element can't see (into a shadow root, or to a
 * detached element) still name nothing, and a description is not a name.
 *
 * jsdom has no reflection, so the cases run in Chromium, and are skipped
 * when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('../../src/testing.js');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}

function findExecutable() {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

const executablePath = findExecutable();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;

// [name, html, script run before the scan, rule, expected outcome]
const CASES = [
  [
    'an input',
    '<span id="lbl">Email address</span><input id="f">',
    'f.ariaLabelledByElements = [lbl]',
    'form-control-programmatic-label-present',
    'pass'
  ],
  [
    'an empty button',
    '<span id="lbl">Email address</span><button id="f"></button>',
    'f.ariaLabelledByElements = [lbl]',
    'button-name-present',
    'pass'
  ],
  [
    'an img with no alt',
    '<span id="lbl">Company logo</span><img id="f" src="a.png">',
    'f.ariaLabelledByElements = [lbl]',
    'img-alt-present',
    'pass'
  ],
  [
    'a role=img',
    '<span id="lbl">Company logo</span><span id="f" role="img"></span>',
    'f.ariaLabelledByElements = [lbl]',
    'role-img-text-alternative-present',
    'pass'
  ],
  [
    'an svg role=img',
    '<span id="lbl">Chart</span><svg id="f" role="img"><circle r="5"></circle></svg>',
    'f.ariaLabelledByElements = [lbl]',
    'svg-text-alternative-present',
    'pass'
  ],
  [
    'an svg <image>',
    '<span id="lbl">Chart</span><svg><image id="f" href="a.png" width="10" height="10"></image></svg>',
    'f.ariaLabelledByElements = [lbl]',
    'svg-image-text-alternative-present',
    'pass'
  ],
  [
    'a role=textbox',
    '<span id="lbl">Search</span><div id="f" role="textbox" tabindex="0"></div>',
    'f.ariaLabelledByElements = [lbl]',
    'textbox-name-present',
    'pass'
  ],
  [
    'a role=checkbox',
    '<span id="lbl">Subscribe</span><div id="f" role="checkbox" aria-checked="false" tabindex="0"></div>',
    'f.ariaLabelledByElements = [lbl]',
    'binary-control-name-present',
    'pass'
  ],
  [
    'a dialog',
    '<span id="lbl">Settings</span><div id="f" role="dialog"><p>x</p></div>',
    'f.ariaLabelledByElements = [lbl]',
    'dialog-name-present',
    'pass'
  ],
  [
    'an input in an open shadow root, labelled from the page',
    '<span id="lbl">Email address</span><div id="h"></div>',
    "const r = h.attachShadow({ mode: 'open' }); r.innerHTML = '<input id=f>'; r.getElementById('f').ariaLabelledByElements = [lbl]",
    'form-control-programmatic-label-present',
    'pass'
  ],
  [
    'a reference into a shadow root, which names nothing',
    '<button id="f"></button><div id="h"></div>',
    "const r = h.attachShadow({ mode: 'open' }); r.innerHTML = '<span id=l>Save</span>'; f.ariaLabelledByElements = [r.getElementById('l')]",
    'button-name-present',
    'fail'
  ],
  [
    'a reference to a detached element, which names nothing',
    '<button id="f"></button>',
    "const l = document.createElement('span'); l.textContent = 'Save'; f.ariaLabelledByElements = [l]",
    'button-name-present',
    'fail'
  ],
  [
    'a description only',
    '<span id="d">Hint</span><input id="f">',
    'f.ariaDescribedByElements = [d]',
    'form-control-programmatic-label-present',
    'fail'
  ],
  ['no reference at all', '<button id="f"></button>', '', 'button-name-present', 'fail']
];

for (const [name, html, script, ruleId, expected] of CASES) {
  test(`a name set as element references, in Chromium: ${name}`, { skip }, async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const p = await browser.newPage();
      await p.setContent(page(html));
      if (script) await p.evaluate(script);
      await p.addScriptTag({ content: BUNDLE });
      const got = await p.evaluate(
        (id) =>
          window.a11ycore
            .runa11yCoreInPage(location.href, null, {}, { includeRuleIds: [id] })
            .checksResults.map((c) => c.outcome)[0],
        ruleId
      );
      assert.equal(got, expected);
    } finally {
      await browser.close();
    }
  });
}

test('without reflection (jsdom), an empty aria-labelledby still names nothing', () => {
  const result = runa11yCoreOnHtml(
    page('<span id="lbl">Email</span><button aria-labelledby=""></button>'),
    {
      runOnly: ['button-name-present']
    }
  );
  assert.equal(result.checksResults[0].outcome, 'fail');
});
