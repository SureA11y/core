// Embedded controls reached through aria-labelledby: engine name vs Chromium (via label-in-name)
const { runAll } = require('./harness');
const refs = {
 'div-textbox-aria-label': `<div id="r" role="textbox" aria-label="X">typed</div>`,
 'div-combobox-aria-label': `<div id="r" role="combobox" aria-label="X" aria-expanded="false" tabindex="0">Apple</div>`,
 'input-combobox-aria-label': `<input id="r" role="combobox" aria-label="X" aria-expanded="false" value="Pear">`,
 'div-slider-valuetext': `<div id="r" role="slider" aria-label="X" aria-valuenow="5" aria-valuetext="five" tabindex="0"></div>`,
 'div-slider-valuenow': `<div id="r" role="slider" aria-label="X" aria-valuenow="5" tabindex="0"></div>`,
 'div-spinbutton': `<div id="r" role="spinbutton" aria-label="X" aria-valuenow="7" tabindex="0"></div>`,
 'listbox-selected': `<div id="r" role="listbox" aria-label="X"><div role="option" aria-selected="true">Kiwi</div><div role="option">Lime</div></div>`,
 'select-single': `<select id="r" aria-label="X"><option>One</option><option selected>Two</option></select>`,
 'input-range': `<input id="r" type="range" aria-label="X" value="30">`,
 'textarea': `<textarea id="r" aria-label="X">notes</textarea>`,
};
const cases = [];
(async()=>{
 const { launch, runCase } = require('./harness');
 const b = await launch();
 for (const [k, ref] of Object.entries(refs)) {
  // First find Chromium's name with an empty button
  let out = await runCase(b, { id:k, html:`${ref}<button data-t="b" aria-labelledby="r"></button>` }, ['label-in-name']);
  const cname = out.ax.b.name;
  out = await runCase(b, { id:k, html:`${ref}<button data-t="b" aria-labelledby="r">${cname}</button>` }, ['label-in-name']);
  const li = out.res[0];
  console.log(k.padEnd(26), 'chromium:', JSON.stringify(cname).padEnd(10), 'label-in-name:', li.outcome, li.occ.map(o=>o.rc+' '+o.sum).join(' | ').slice(0,250));
 }
 await b.close();
})();
