const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff} #a,#a::picker(select){appearance:base-select} ${css}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable'];
const opts = '<option>First choice</option><option>Second</option>';
export default [
  { name: 'BS1 picker light, closed', html: H('#a::picker(select){color:#ccc}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'BS2 option light, closed', html: H('#a option{color:#ccc}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'BS3 select light, no button', html: H('#a{color:#aaa}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'BS4 auto select, picker irrelevant', html: H('#a,#a::picker(select){appearance:auto} #a{color:#aaa}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
];
