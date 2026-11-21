const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const page = (b) => `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1>${b}</main></body></html>`;
const run = (b, rule) => { const c = runa11yCoreOnHtml(page(b), { runOnly: [rule] }).checksResults[0]; return c.outcome + ' ' + [...new Set(c.occurrences.map((o) => o.data.details.reasonCode))].join(','); };
console.warn = () => {};
const cases = [
  ['NA-1 APG menubar', '<ul role="menubar" aria-label="m"><li role="none"><a role="menuitem" href="#" aria-haspopup="true" aria-expanded="false">About</a><ul role="menu" aria-label="About"><li role="none"><a role="menuitem" href="#">Team</a></li></ul></li></ul>', 'aria-prohibited-children'],
  ['NA-2 tab with tabindex=-1 close', '<div role="tablist"><div role="tab" tabindex="0" aria-selected="true">File.js <button aria-label="Close" tabindex="-1">x</button></div></div>', 'nested-interactive-controls-absent'],
  ['NA-2 sibling rule', '<div role="tablist"><div role="tab" tabindex="0" aria-selected="true">File.js <button aria-label="Close" tabindex="-1">x</button></div></div>', 'presentational-children-focusable-absent'],
  ['NA-3 h3 between tablist and tab', '<div role="tablist"><h3><button role="tab" aria-selected="true">A</button></h3></div>', 'aria-required-parent'],
  ['NA-3 control div role=heading', '<div role="tablist"><div role="heading" aria-level="3"><button role="tab" aria-selected="true">A</button></div></div>', 'aria-required-parent'],
  ['NA-4 textbox value via labelledby', '<div id="r" role="textbox" aria-label="X">typed</div><button aria-labelledby="r">typed</button>', 'label-in-name'],
  ['NA-5 select as labelledby target', '<select id="s"><option>Price</option><option>Rating</option></select><button aria-labelledby="s"></button>', 'label-in-name'],
  ['NA-7 section doc-chapter', '<section role="doc-chapter" aria-label="c"><p>x</p></section>', 'aria-allowed-role'],
  ['NA-8 button role=tab no name', '<div role="tablist"><button role="tab" aria-selected="true"></button></div>', 'button-name-present'],
  ['NA-10 bare text in body', '', 'region'],
];
for (const [label, body, rule] of cases) console.log(label.padEnd(36), rule.padEnd(42), run(body, rule));
const bare = runa11yCoreOnHtml('<!doctype html><html lang="en"><head><title>t</title></head><body>Important notice<main><h1>h</h1></main></body></html>', { runOnly: ['region'] }).checksResults[0];
console.log('NA-10 bare text'.padEnd(36), 'region'.padEnd(42), bare.outcome, bare.occurrences.length);
