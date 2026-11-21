// nested-interactive fails a tabindex=-1 control inside a presentational-children role, where presentational-children-focusable-absent (same ACT 307n5z basis) passes
const { jrun, jsum } = require('./jsd');
(async()=>{ for (const [id,h] of [
 ['tab-close-btn', `<div role="tablist" aria-label="t"><div role="tab" aria-selected="true" tabindex="0">File.js <button aria-label="Close" tabindex="-1">x</button></div></div>`],
 ['button-link-neg', `<button>Save <a href="#" tabindex="-1">help</a></button>`],
 ['option-checkbox-neg', `<div role="listbox" aria-label="l"><div role="option" aria-selected="false" tabindex="0"><input type="checkbox" tabindex="-1" aria-label="A"> A</div></div>`],
]) console.log(jsum(id, await jrun(h, ['nested-interactive-controls-absent','presentational-children-focusable-absent'], {}), true)); })();
