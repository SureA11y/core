// RW: a code editor (contenteditable, lines kept by white-space:pre) in a box that scrolls sideways FAILS,
// while the same code read-only (<pre>, <code>) is exempt and a <textarea wrap=off> passes.
const h = require('./harness');
const D = '<!doctype html><html><head><meta charset=utf-8></head><body>';
const LONG = 'const result = someFunction(argumentNumberOne, argumentNumberTwo, argumentNumberThree);';
const cases = {
  'editor: contenteditable div white-space:pre in overflow:auto': `<div style="overflow-x:auto"><div contenteditable="true" role="textbox" aria-multiline="true" aria-label="Code" style="white-space:pre;display:inline-block;min-width:100%">${LONG}</div></div>`,
  'CodeMirror 6 shape (cm-scroller > cm-content)': `<div class="cm-editor"><div class="cm-scroller" style="overflow:auto;display:flex"><div class="cm-gutters" style="flex:none">1</div><div class="cm-content" contenteditable="true" role="textbox" aria-multiline="true" style="white-space:pre;flex-grow:2"><div class="cm-line">${LONG}</div></div></div></div>`,
  'read-only: <pre> in overflow:auto': `<div style="overflow-x:auto"><pre>${LONG}</pre></div>`,
  'read-only: <code> white-space:pre in overflow:auto': `<div style="overflow-x:auto"><code style="white-space:pre;display:inline-block">${LONG}</code></div>`,
  'editor: <pre contenteditable> in overflow:auto': `<div style="overflow-x:auto"><pre contenteditable="true">${LONG}</pre></div>`,
  'editor: <textarea wrap=off>': `<textarea wrap="off" style="width:100%;box-sizing:border-box">${LONG}</textarea>`,
};
(async () => {
  for (const [name, frag] of Object.entries(cases)) for (let i = 0; i < 2; i++) {
    const r = await h.runChromium(D + frag + '</body></html>', 'reflow-horizontal-scroll');
    console.log(name.padEnd(58), r.outcome, r.occ.map(o => `${o.o}:${o.code}@${o.sel}`).join(','));
  }
  await h.close();
})();
