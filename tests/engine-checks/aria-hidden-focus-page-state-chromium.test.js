'use strict';

// aria-hidden-focus focuses the one focusable element inside an aria-hidden
// subtree to see whether the page hands focus straight on. Focusing it moves
// the caret and replaces the page's selection, so the rule saves the
// selection, and the selection inside a focused text field, before it
// probes, and puts them back after: the page is left as it was found
// (round 9, R9-1).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

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

const { addBundle } = require('../helpers/browserBundle');

// One focusable element in each hidden subtree, so the rule probes each.
const HIDDEN =
  '<div aria-hidden="true"><div contenteditable="true">hidden editor</div></div>' +
  '<div aria-hidden="true"><input aria-label="hidden field" value="zz"></div>';

const page = (markup, setup) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1>${markup}${HIDDEN}</main><script>${setup}</script></body></html>`;

const CASES = [
  [
    'text selected on the page',
    page(
      '<p id="p">Some paragraph text</p>',
      "const r = document.createRange(); r.setStart(document.getElementById('p').firstChild, 5); r.setEnd(document.getElementById('p').firstChild, 14); getSelection().addRange(r);"
    )
  ],
  [
    'a backward selection',
    page(
      '<p id="p">Some paragraph text</p>',
      "const t = document.getElementById('p').firstChild; getSelection().setBaseAndExtent(t, 14, t, 5);"
    )
  ],
  [
    'the caret inside a focused contenteditable',
    page(
      '<div id="f" contenteditable="true" role="textbox" aria-label="e">abcdef</div>',
      "const f = document.getElementById('f'); f.focus(); getSelection().collapse(f.firstChild, 3);"
    )
  ],
  [
    'a selection inside a focused text field',
    page(
      '<input id="f" aria-label="f" value="hello world">',
      "const f = document.getElementById('f'); f.focus(); f.setSelectionRange(2, 7, 'backward');"
    )
  ],
  ['no selection at all', page('<button id="f">b</button>', '')]
];

function pageState() {
  const s = getSelection();
  const a = document.activeElement;
  return {
    ranges: s.rangeCount,
    anchor: s.anchorNode ? [s.anchorNode.nodeName, s.anchorOffset] : null,
    focus: s.focusNode ? [s.focusNode.nodeName, s.focusOffset] : null,
    text: String(s),
    active: a ? a.id || a.localName : null,
    field:
      a && typeof a.selectionStart === 'number'
        ? [a.selectionStart, a.selectionEnd, a.selectionDirection]
        : null
  };
}

test(
  'aria-hidden-focus leaves the page selection and caret as it found them',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    for (const [description, html] of CASES) {
      await t.test(description, async () => {
        const p = await browser.newPage();
        await p.setContent(html);
        await addBundle(p);
        const before = await p.evaluate(pageState);
        const outcome = await p.evaluate(
          () =>
            window.a11ycore.runa11yCoreInPage(null, null, null, ['aria-hidden-focus'])
              .checksResults[0].outcome
        );
        assert.equal(outcome, 'fail');
        assert.deepEqual(await p.evaluate(pageState), before);
        await p.close();
      });
    }
  }
);
