const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff} ${css}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable'];
const opts = '<option>First choice</option><option>Second</option>';
export default [
  { name: 'S2b select #767676 native', html: H('#a{color:#767676}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S2c select #6f6f6f native', html: H('#a{color:#707070}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S6 base-select light text', html: H('#a,#a::picker(select){appearance:base-select} #a{color:#aaa}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
];
