// Which element-reference relations does Chromium expose when set as elements?
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/user/core/package.json')('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const mode of ['attr', 'elements']) {
  const p = await b.newPage();
  const A = mode === 'attr';
  await p.setContent(`<input id="g" aria-label="Email" aria-invalid="true" ${A ? 'aria-errormessage="err"' : ''}><span id="err">Bad email</span>
  <button id="t" aria-expanded="true" ${A ? 'aria-controls="menu"' : ''}>Menu</button><ul id="menu"><li>a</li></ul>
  <div id="cb" role="combobox" tabindex="0" aria-label="C" aria-expanded="true" ${A ? 'aria-activedescendant="op"' : ''}></div><div role="listbox" aria-label="l"><div role="option" id="op">x</div></div>
  <button id="d" ${A ? 'aria-describedby="dd"' : ''}>Go</button><p id="dd">Desc text</p>`);
  if (!A) await p.evaluate(`g.ariaErrorMessageElements=[err]; t.ariaControlsElements=[menu]; cb.ariaActiveDescendantElement=op; d.ariaDescribedByElements=[dd];`);
  await p.waitForTimeout(200);
  const cdp = await p.context().newCDPSession(p); await cdp.send('Accessibility.enable');
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  for (const n of nodes) {
    const props = (n.properties || []).filter(x => ['errormessage', 'controls', 'activedescendant', 'describedby', 'owns'].includes(x.name));
    if (props.length || (n.description && n.description.value)) console.log(mode, n.role.value, JSON.stringify(n.name && n.name.value), 'desc=' + JSON.stringify(n.description && n.description.value), props.map(x => x.name + ':' + (x.value.relatedNodes || []).length).join(' '));
  }
  await p.close();
}
await b.close();
