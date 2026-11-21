const { runAll } = require('./harness');
const P = (b)=>`<!doctype html><html lang="en"><head><title>LM</title></head><body>${b}</body></html>`;
runAll([
 { id:'role-form-unnamed', html:P(`<main><h1>T</h1><div role="form"><input aria-label="a"></div><section aria-labelledby="nope">x</section><div role="region">y</div></main>`) },
 { id:'cookie-banner-fixed-outside', html:P(`<header>h</header><main><h1>T</h1></main><footer>f</footer><div class="cookie" style="position:fixed;bottom:0"><p>We use cookies</p><button>Accept</button></div>`) },
 { id:'region-skip-link-outside', html:P(`<a href="#m" class="skip">Skip to content</a><header>h</header><main id="m"><h1>T</h1></main>`) },
 { id:'toast-status-outside', html:P(`<main><h1>T</h1></main><div role="status">Saved</div><div aria-live="polite">Polite msg</div>`) },
 { id:'modal-dialog-outside', html:P(`<main><h1>T</h1></main><div role="alertdialog" aria-modal="true" aria-label="Confirm"><p>Sure?</p></div>`) },
 { id:'body-text-direct', html:P(`Loose text<main><h1>T</h1></main>`) },
], ['region','landmark-role-name-present','landmark-unique']);
