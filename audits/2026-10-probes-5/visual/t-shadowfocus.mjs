import { launch, run } from './probe.mjs';
const b = await launch();
const skip = '.skip{position:absolute;top:-40px} .skip:focus{top:0}';
const page = (js) => `<!doctype html><html lang=en><head><title>t</title></head><body><x-head></x-head><main id=main><p>Hello</p></main><script>${js}</script></body></html>`;
for (const [k, js] of [
  ['shadow <style>', `const r=document.querySelector('x-head').attachShadow({mode:'open'});r.innerHTML='<style>${skip}</style><a class=skip href=#main>Skip</a>'`],
  ['shadow adopted', `const r=document.querySelector('x-head').attachShadow({mode:'open'});const s=new CSSStyleSheet();s.replaceSync('${skip}');r.adoptedStyleSheets=[s];r.innerHTML='<a class=skip href=#main>Skip</a>'`],
  ['shadow adopted, no focus rule (true hidden)', `const r=document.querySelector('x-head').attachShadow({mode:'open'});const s=new CSSStyleSheet();s.replaceSync('.skip{position:absolute;top:-40px}');r.adoptedStyleSheets=[s];r.innerHTML='<a class=skip href=#main>Skip</a>'`],
]) {
  const o = await run(b, page(js), { rules: ['css-hidden-focus'] });
  console.log(k.padEnd(45), o.res.map((r) => r.outcome + ' ' + r.occ.map((x) => x.reason || '').join(',')).join(' | '));
}
await b.close();
