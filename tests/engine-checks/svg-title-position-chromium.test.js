'use strict';

/**
 * The SVG rules read an element's <title> and <desc> wherever they are among
 * its children (#118): SVG-AAM names an SVG element by "a direct child title
 * element" and describes it by "a direct child desc element", in no
 * particular position, and the first one counts. Each case is checked against
 * the name and description Chromium computes.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
const IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

// [description, markup with the element #t, the rule that judges it, the
// name and the description Chromium gives #t, what the rule reports on #t
// ('fail', or null for nothing)]
const CASES = [
  [
    'a title after a shape',
    '<svg id="t" role="img" width="20" height="20"><circle cx="10" cy="10" r="4"/><title>Star</title></svg>',
    'svg-text-alternative-present',
    'Star',
    '',
    null
  ],
  [
    'a title after a desc',
    '<svg id="t" role="img" width="20" height="20"><desc>A yellow star</desc><title>Star</title><circle cx="10" cy="10" r="4"/></svg>',
    'svg-text-alternative-present',
    'Star',
    'A yellow star',
    null
  ],
  [
    'an empty title first, then a title',
    '<svg id="t" role="img" width="20" height="20"><title></title><title>Star</title><circle cx="10" cy="10" r="4"/></svg>',
    'svg-text-alternative-present',
    '',
    '',
    'fail'
  ],
  [
    'a title in a group, not a direct child',
    '<svg id="t" role="img" width="20" height="20"><g><title>Star</title><circle cx="10" cy="10" r="4"/></g></svg>',
    'svg-text-alternative-present',
    '',
    '',
    'fail'
  ],
  [
    'a desc alone, after a shape',
    '<svg id="t" role="img" width="20" height="20"><circle cx="10" cy="10" r="4"/><desc>A yellow star</desc></svg>',
    'svg-text-alternative-present',
    '',
    'A yellow star',
    'fail'
  ],
  [
    'a graphics-symbol group with a title after a shape',
    '<svg width="20" height="20"><g id="t" role="graphics-symbol"><rect width="9" height="9"/><title>Box</title></g></svg>',
    'role-img-text-alternative-present',
    'Box',
    '',
    null
  ],
  [
    'an image with a title after metadata',
    `<svg width="20" height="20"><image id="t" href="${IMG}" width="9" height="9"><metadata>x</metadata><title>Logo</title></image></svg>`,
    'svg-image-text-alternative-present',
    'Logo',
    '',
    null
  ],
  [
    'an image with a desc after metadata',
    `<svg width="20" height="20"><image id="t" href="${IMG}" width="9" height="9"><metadata>x</metadata><desc>Company logo</desc></image></svg>`,
    'svg-image-text-alternative-present',
    '',
    'Company logo',
    null
  ],
  [
    'an svg with no role and a title last is no unlabeled image',
    '<svg id="t" width="20" height="20"><g><circle cx="10" cy="10" r="4"/></g><title>Star</title></svg>',
    'img-alt-decorative',
    'Star',
    '',
    null
  ]
];

test(
  'the SVG rules read a direct child <title> or <desc> wherever it is, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    for (const [description, markup, ruleId, name, desc, outcome] of CASES) {
      await t.test(description, async () => {
        const page = await browser.newPage();
        try {
          await page.setContent(
            `<!doctype html><html lang="en"><head><title>SVG</title></head><body><main>${markup}</main></body></html>`
          );
          const cdp = await page.context().newCDPSession(page);
          const { nodes } = await cdp.send('Accessibility.getFullAXTree');
          const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
          const { nodeId } = await cdp.send('DOM.querySelector', {
            nodeId: root.nodeId,
            selector: '#t'
          });
          const { node } = await cdp.send('DOM.describeNode', { nodeId });
          const ax = nodes.find((n) => n.backendDOMNodeId === node.backendNodeId);
          assert.equal(((ax && ax.name && ax.name.value) || '').trim(), name);
          assert.equal(((ax && ax.description && ax.description.value) || '').trim(), desc);

          await page.evaluate(BUNDLE);
          const r = await page.evaluate((id) => {
            const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [id]);
            const c = res.checksResults.find((x) => x.ruleId === id);
            const o = (c.occurrences || []).find((x) => x.selector === '#t');
            return o ? o.occurrenceOutcome || c.outcome : null;
          }, ruleId);
          assert.equal(r, outcome);
        } finally {
          await page.close();
        }
      });
    }
  }
);
