const { scan, errs } = require('./h');
const prop = process.argv[2] || 'parentNode';
const html = `<!doctype html><html lang="en"><head><title>x</title></head><body><main><h1>F</h1><form aria-label="s"><input name="${prop}"></form></main></body></html>`;
let calls = 0; const sites = new Map();
const r = scan(html, { inPage: true, runOnly: process.env.RULE ? [process.env.RULE] : null, before: (w) => {
  const f = w.document.querySelector('form'); const inp = f.querySelector('input');
  const desc = Object.getOwnPropertyDescriptor(w.Node.prototype, prop) || Object.getOwnPropertyDescriptor(w.Element.prototype, prop) || Object.getOwnPropertyDescriptor(w.HTMLElement.prototype, prop);
  Object.defineProperty(f, prop, { get() {
    const st = new Error().stack.split('\n')[3] || '';
    if (!/core\/src\//.test(st)) return desc.get.call(this);
    calls++; const k = st.trim(); sites.set(k, (sites.get(k) || 0) + 1);
    if (calls > 200000) throw new Error('abort-loop');
    return inp; }, configurable: true });
} });
console.log(r.err ? 'THROW ' + r.err.message : 'ok', r.ms, 'calls', calls, errs(r.r).slice(0, 10));
console.log([...sites].sort((a, b) => b[1] - a[1]).slice(0, 8));
