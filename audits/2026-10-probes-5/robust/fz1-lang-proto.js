// FZ-1 recheck: lang values named like inherited Object properties, at html and element level.
const { scan, sum } = require('./j.js');
const body = `<h1>Overview of cats</h1><h2>Untitled</h2><label for=i>Your name</label><input id=i><label for=k>Label</label><input id=k><a href=/x>Cat food guide</a><a href="/a">click here</a><a href="/b">more</a><img src=a.png alt="image"><img src="IMG_1234.jpg" alt="IMG_1234.jpg"><img src="b.png" alt="picture of a cat"><input type="image" alt="submit" src="x.png"><map name="m"><area href="#" alt="image" shape="rect" coords="0,0,1,1"></map><img usemap="#m" src="m.png" alt="map"><button>button</button>`;
const langs = ['en', 'xx', '__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', '__defineGetter__', '__lookupGetter__', 'CONSTRUCTOR', 'constructor-US', '__proto__-x', 'en-constructor', 'prototype', 'length', 'name', 'caller'];
const rules = null;
const norm = s => s.replace(/(lang|LANG)[^\]]*/g, '');
let base;
for (const where of ['html', 'main']) {
  for (const titleS of ['Home', 'Untitled', 'Home | Brand', 'Cats and dogs']) {
    base = null;
    for (const l of langs) {
      const html = where === 'html'
        ? `<!doctype html><html lang="${l}"><head><title>${titleS}</title></head><body><main>${body}</main></body></html>`
        : `<!doctype html><html lang="en"><head><title>${titleS}</title></head><body><main lang="${l}">${body}</main></body></html>`;
      const r = scan(html);
      const errs = r.checksResults.filter(c => c.error).map(c => c.ruleId + ': ' + String(c.error.message || c.error).slice(0, 90));
      const q = sum(r, ['form-control-label-quality', 'heading-quality', 'link-name-quality', 'page-title-patterns', 'img-alt-quality', 'area-alt-quality', 'input-image-alt-quality', 'button-name-quality', 'control-name-title-only']);
      if (l === 'xx') base = q;
      const tag = l === 'en' ? 'EN' : (l === 'xx' ? 'XX' : (q === base ? 'same-as-xx' : 'DIFFERS-from-xx'));
      if (errs.length || (tag === 'DIFFERS-from-xx')) console.log(`[${where} title=${titleS}] lang=${l} ${tag} errs=${JSON.stringify(errs)}`);
      if (tag === 'DIFFERS-from-xx' && process.argv[2]) console.log(q, '\n--- xx:\n', base);
    }
  }
}
console.log('done');
