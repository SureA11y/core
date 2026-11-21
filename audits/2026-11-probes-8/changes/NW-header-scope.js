// header/footer scoping through shadow trees: engine landmark verdicts vs Chromium's AX roles
const { launch, runCase } = require(process.env.OLD ? './nharness-old' : './nharness');
const R = ['landmark-no-duplicate-banner', 'landmark-no-duplicate-contentinfo', 'landmark-banner-is-top-level', 'landmark-contentinfo-is-top-level', 'landmark-unique'];
const full = (b) => `<!doctype html><html lang=en><head><title>T</title></head><body>${b}</body></html>`;
const def = (name, inner) => `customElements.define('${name}', class extends HTMLElement{constructor(){super(); this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(inner)};}});`;
const cases = [
  { id: 'shadow-header-at-top (page banner inside a component) + light header', html: full(`<x-top></x-top><header data-t=light>Site</header><main>m</main>`), setup: new Function(def('x-top', '<header data-t=sh>Brand</header>')) },
  { id: 'component header in <main> (light parent main, no shadow sectioning)', html: full(`<header data-t=top>Site</header><main><x-c></x-c></main>`), setup: new Function(def('x-c', '<header data-t=c>Card head</header>')) },
  { id: 'component header slotted into a shadow <section>', html: full(`<header data-t=top>Site</header><x-s><header data-t=sl>Section head</header></x-s><main>m</main>`), setup: new Function(def('x-s', '<section aria-label="S"><slot></slot></section>')) },
  { id: 'header in shadow, host slotted into <article> of another component', html: full(`<header data-t=top>Site</header><x-a><x-c></x-c></x-a><main>m</main>`), setup: new Function(def('x-a', '<article><slot></slot></article>') + def('x-c', '<header data-t=c>Card head</header>')) },
  { id: 'header with role=generic sectioning via role=article on host', html: full(`<header data-t=top>Site</header><div role="article"><x-c></x-c></div><main>m</main>`), setup: new Function(def('x-c', '<header data-t=c>Card head</header>')) },
  { id: 'unslotted light header (not rendered) in a component', html: full(`<header data-t=top>Site</header><x-n><header data-t=un>Unslotted</header></x-n><main>m</main>`), setup: new Function(def('x-n', '<div>no slot</div>')) },
];
(async () => {
  const b = await launch();
  for (const c of cases) {
    const out = await runCase(b, c, R);
    console.log('== ' + c.id + '\n   AX: ' + JSON.stringify(out.ax) + '\n   ' + out.res.map(r => r.ruleId.replace('landmark-', '') + '=' + r.outcome + (r.occ.length ? '[' + r.occ.map(o => o.rc).join(',') + ']' : '')).join(' '));
  }
  await b.close();
})();
