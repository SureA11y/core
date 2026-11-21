// target-size-minimum: small icon buttons whose face is a custom icon element drawing its SVG in a shadow root
// (<button><ion-icon></ion-icon></button>, as Ionic / Shoelace icons do). Old vs new.
const { run, show, close } = require('./h');
const R = ['target-size-minimum', 'target-size-enhanced'];
const def = `<script>customElements.define('x-icon', class extends HTMLElement { constructor(){ super(); this.attachShadow({mode:'open'}).innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" style="display:block"><rect width="16" height="16"/></svg>'; } });</script>`;
const b = (l) => `<button aria-label="${l}" style="all:unset;display:inline-block;width:16px;height:16px"><x-icon></x-icon></button>`;
const plain = (l) => `<button aria-label="${l}" style="all:unset;display:inline-block;width:16px;height:16px"><svg viewBox="0 0 16 16" width="16" height="16" style="display:block"><rect width="16" height="16"/></svg></button>`;
(async () => { if (process.argv[2] === "mixed") return;
  for (const core of ['old', 'new']) {
    show('plain svg icons, ' + core, await run(`<div style="display:flex;gap:2px;margin:20px">${plain('a')}${plain('b')}${plain('c')}</div>`, R, { core }));
    show('shadow icons, ' + core, await run(`${def}<div style="display:flex;gap:2px;margin:20px">${b('a')}${b('b')}${b('c')}</div>`, R, { core }));
  }
  await close();
})();
(async () => {
  for (const core of ['old', 'new']) show('mixed: plain, shadow-icon, plain (' + core + ')', await run(`${def}<div style="display:flex;gap:2px;margin:20px">${plain('a')}${b('b')}${plain('c')}</div>`, ['target-size-minimum'], { core }));
  await close();
})();
