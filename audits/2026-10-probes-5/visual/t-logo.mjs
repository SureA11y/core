import { launch, run, serve } from './probe.mjs';
const b = await launch();
const P = (body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff}.lo{color:#aaa}</style></head><body>${body}</body></html>`;
const cases = {
  btnBrand: '<button class="btn btn-brand lo">Buy now</button>',
  textBrand500: '<p class="text-brand-500 lo">Shipping is free over 50 euros.</p>',
  brandSection: '<section class="brand-story"><div><div><p class="lo">We were founded in 1990 and sell shoes.</p></div></div></section>',
  skipLinkHeader: '<header><a href="#main" class="lo">Skip to content</a><nav><a href="/about">About</a></nav></header><main id=main>x</main>',
  homeTextNav: '<header><nav><a href="/" class="lo">Home</a> <a href="/about">About</a></nav></header>',
  homeQuery: '<header><a href="/?lang=en" class="lo">English</a></header>',
  langRootLink: '<header><a href="/fr/" class="lo">Français</a> <a href="/">Acme</a></header>',
  realLogo: '<header><a href="/" class="lo">Acme Inc</a></header>',
  marcaWord: '<div class="marca-agua"><p class="lo">Texto normal del artículo con poco contraste.</p></div>',
};
for (const [k, body] of Object.entries(cases)) {
  const o = await run(b, '', { rules: ['contrast-minimum'], url: serve('/' + k, P(body)) });
  const occ = o.raw.checksResults[0].occurrences.filter((x) => x.data?.details?.reasonCode);
  console.log(k, occ.map((x) => `${x.selector} ${x.data.details.reasonCode} logo=${x.data.details.looksLikeLogo}`).join(' | '));
}
await b.close();
