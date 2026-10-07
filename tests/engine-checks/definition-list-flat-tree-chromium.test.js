'use strict';

/**
 * The definition list rules read the flat tree, as the list rules do (#119):
 * a <dt>/<dd> slotted into a shadow <dl><slot></slot></dl> is in that list,
 * and one its host doesn't slot is not rendered. Each case is checked against
 * where Chromium's accessibility tree puts the <dt>: in a description list,
 * or not.
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
const ITEMS = '<dt id="t">Term</dt><dd>Definition</dd>';

// [description, light markup with #host, #host's shadow markup, where the
// accessibility tree puts #t ('list': in a description list, 'out': not in
// one, 'absent': not exposed), the outcomes of definition-list-children-valid
// and dlitem-parent-valid]
const CASES = [
  [
    'a shadow <dl><slot>',
    `<x-dl id="host">${ITEMS}</x-dl>`,
    '<dl><slot></slot></dl>',
    'list',
    'pass',
    'pass'
  ],
  [
    'a shadow <dl> with a named slot',
    '<x-dl id="host"><dt id="t" slot="i">Term</dt><dd slot="i">Definition</dd></x-dl>',
    '<dl><slot name="i"></slot></dl>',
    'list',
    'pass',
    'pass'
  ],
  [
    'a shadow <dl><div><slot>',
    `<x-dl id="host">${ITEMS}</x-dl>`,
    '<dl><div><slot></slot></div></dl>',
    'list',
    'pass',
    'pass'
  ],
  [
    'a shadow <div><slot>: no list',
    `<x-dl id="host">${ITEMS}</x-dl>`,
    '<div><slot></slot></div>',
    'out',
    'notApplicable',
    'fail'
  ],
  [
    'items the host does not slot',
    `<x-dl id="host">${ITEMS}</x-dl>`,
    '<dl><dt>Own</dt><dd>Own definition</dd></dl>',
    'absent',
    'pass',
    'pass'
  ],
  [
    'a <p> slotted in beside the items',
    `<x-dl id="host">${ITEMS}<p>Note</p></x-dl>`,
    '<dl><slot></slot></dl>',
    'list',
    'fail',
    'pass'
  ]
];

test('the definition list rules read the flat tree, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [description, markup, shadow, placed, dl, dlitem] of CASES) {
    await t.test(description, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>Lists</title></head><body><main>${markup}</main></body></html>`
        );
        await page.evaluate((html) => {
          document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = html;
        }, shadow);

        const cdp = await page.context().newCDPSession(page);
        const { nodes } = await cdp.send('Accessibility.getFullAXTree');
        const byId = new Map(nodes.map((n) => [n.nodeId, n]));
        const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
        const { nodeId } = await cdp.send('DOM.querySelector', {
          nodeId: root.nodeId,
          selector: '#t'
        });
        const { node } = await cdp.send('DOM.describeNode', { nodeId });
        const ax = nodes.find((n) => n.backendDOMNodeId === node.backendNodeId);
        let where = 'absent';
        if (ax && !ax.ignored) {
          let p = ax.parentId ? byId.get(ax.parentId) : null;
          while (p && (p.ignored || p.role.value === 'generic' || p.role.value === 'none'))
            p = p.parentId ? byId.get(p.parentId) : null;
          where = p && p.role.value === 'DescriptionList' ? 'list' : 'out';
        }
        assert.equal(where, placed);

        await page.evaluate(BUNDLE);
        const r = await page.evaluate(() => {
          const res = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
            'definition-list-children-valid',
            'dlitem-parent-valid'
          ]);
          const of = (id) => res.checksResults.find((x) => x.ruleId === id).outcome;
          return { dl: of('definition-list-children-valid'), dlitem: of('dlitem-parent-valid') };
        });
        assert.deepEqual(r, { dl, dlitem });
      } finally {
        await page.close();
      }
    });
  }
});
