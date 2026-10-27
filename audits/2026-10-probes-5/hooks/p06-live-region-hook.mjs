// The live-region hook and live-region-announcements: what is recorded, what
// is reported, and whether the record matches the docs.
import { open, scan, show } from './h.mjs';
const R = ['live-region-announcements'];
const extra = `(() => { const a = window.a11ycore.getAnnouncements(); return a && a.map(x => x.politeness[0] + ':' + x.text); })()`;
// Each page does its change after load, in a later task.
const later = (js) => `<script>addEventListener('load', () => setTimeout(() => { ${js} }, 30))</script>`;
const wait = async (page) => page.waitForTimeout(200);
const cases = {
  statusFilledLater: `<div id=s role=status></div>` + later(`s.textContent='Saved'`),
  insertedStatus: `<main id=m></main>` + later(`m.insertAdjacentHTML('beforeend','<div role=status>Saved</div>')`),
  insertedAlert: `<main id=m></main>` + later(`m.insertAdjacentHTML('beforeend','<div role=alert>Failed</div>')`),
  insertedAlertWithLiveAssertive: `<main id=m></main>` + later(`m.insertAdjacentHTML('beforeend','<div role=alert aria-live=assertive>Failed</div>')`),
  insertedAlertWithAtomic: `<main id=m></main>` + later(`m.insertAdjacentHTML('beforeend','<div role=alert aria-atomic=true>Failed</div>')`),
  insertedAlertLivePolite: `<main id=m></main>` + later(`m.insertAdjacentHTML('beforeend','<div role=alert aria-live=polite>Failed</div>')`),
  insertedAlertdialog: `<main id=m></main>` + later(`m.insertAdjacentHTML('beforeend','<div role=alertdialog aria-label=x>Failed</div>')`),
  shownAndFilled: `<div id=s role=status hidden></div>` + later(`s.hidden=false;s.textContent='Saved'`),
  shownAndFilledByClass: `<style>.h{display:none}</style><div id=s role=status class=h></div>` + later(`s.className='';s.textContent='Saved'`),
  shownByStylesheet: `<style id=st>#s{display:none}</style><div id=s role=status></div>` + later(`st.remove();s.textContent='Saved'`),
  ancestorShown: `<div id=w hidden><div id=s role=status></div></div>` + later(`w.hidden=false;s.textContent='Saved'`),
  liveOff: `<div id=s role=status aria-live=off></div>` + later(`s.textContent='Saved'`),
  outputEl: `<output id=s></output>` + later(`s.value='42'`),
  ariaHiddenToggled: `<div id=w aria-hidden=true><div id=s role=status></div></div>` + later(`w.removeAttribute('aria-hidden');s.textContent='Saved'`),
  inertRegion: `<div inert><div id=s role=status></div></div>` + later(`s.textContent='Saved'`),
  characterData: `<div id=s aria-live=polite>Old</div>` + later(`s.firstChild.data='New'`),
  sameTextReset: `<div id=s aria-live=polite>Saved</div>` + later(`s.textContent='';s.textContent='Saved'`),
  sameTextTwoTasks: `<div id=s aria-live=polite>Saved</div>` + later(`s.textContent='';setTimeout(()=>s.textContent='Saved',20)`),
  roleAddedLater: `<div id=s>Hi</div>` + later(`s.setAttribute('role','status');setTimeout(()=>s.textContent='Saved',20)`),
  roleAddedWithText: `<div id=s></div>` + later(`s.setAttribute('role','status');s.textContent='Saved'`),
  movedRegion: `<div id=a><div id=s role=status>Ready</div></div><div id=b></div>` + later(`b.appendChild(s)`),
  hiddenTextChild: `<div id=s role=status></div>` + later(`s.innerHTML='<span style="display:none">secret</span>Saved'`),
  shadowRegion: `<x-t></x-t><script>customElements.define('x-t',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<div role=status id=s></div>'}})</script>` + later(`document.querySelector('x-t').shadowRoot.getElementById('s').textContent='Saved'`),
  beforeLoad: `<div id=s role=status></div><script>s.textContent='Early'</script>`,
  busyRegion: `<div id=s role=status aria-busy=true>x</div>`,
  relevantRemovals: `<div id=s aria-live=polite aria-relevant=removals>Old</div>` + later(`s.textContent='New'`),
  toastAddedRemoved: `<main id=m></main>` + later(`const d=document.createElement('div');d.setAttribute('role','status');d.textContent='Copied';m.append(d);setTimeout(()=>d.remove(),20)`),
  emptyThenFilledSameTask: `<main id=m></main>` + later(`const d=document.createElement('div');d.setAttribute('role','status');m.append(d);d.textContent='Saved'`),
  emptyThenFilledNextTask: `<main id=m></main>` + later(`const d=document.createElement('div');d.setAttribute('role','status');m.append(d);setTimeout(()=>d.textContent='Saved',20)`),
  roleListStatus: `<div id=s role="foo status"></div>` + later(`s.textContent='Saved'`),
  roleUpper: `<div id=s role="STATUS"></div>` + later(`s.textContent='Saved'`),
  nestedLive: `<div aria-live=assertive><div id=s aria-live=polite></div></div>` + later(`s.textContent='Saved'`),
  liveOffInsideLive: `<div aria-live=polite><div id=s aria-live=off></div></div>` + later(`s.textContent='Saved'`)
};
const b = await open();
for (const [name, html] of Object.entries(cases)) {
  const r = await scan(b, html, { runOnly: R, hooks: ['live'], before: wait, extra });
  console.log(show(name, r, R).replace(/env.listenerHook=undefined /, '').replace(/\n/g, ' |'));
}
await b.close();
