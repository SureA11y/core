// Is unslotted light DOM (not rendered, no box) treated as hidden by other rules? A sample of rules on unslotted content.
const { launch, runCase } = require(process.env.OLD ? './nharness-old' : './nharness');
const full = (b) => `<!doctype html><html lang=en><head><title>T</title></head><body><header>Site</header><main><h1>t</h1>${b}</main></body></html>`;
const setup = () => customElements.define('x-n', class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: 'open' }).innerHTML = '<div>no slot</div>'; } });
(async () => {
  const b = await launch();
  const out = await runCase(b, { html: full('<x-n><img src="a.png"><button></button><nav>n</nav><footer>f</footer></x-n>'), setup }, ['img-alt-present', 'button-name-present', 'landmark-no-duplicate-contentinfo', 'landmark-unique', 'region']);
  console.log(out.res.map(r => r.ruleId + '=' + r.outcome).join(' '));
  await b.close();
})();
