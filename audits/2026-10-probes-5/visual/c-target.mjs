const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;margin:20px} button{padding:0;border:0;background:#036;color:#fff;font-size:10px;box-sizing:border-box;margin:0;vertical-align:top} ${css}</style></head><body>${body}</body></html>`;
const R = ['target-size-minimum'];
const btn = (s, t = 'x') => `<button style="${s}" aria-label="b">${t}</button>`;
export default [
  { name: 'T1 30x30 alone (margin expected)', html: H('', btn('width:30px;height:30px')), rules: R },
  { name: 'T2 31x31 alone (no margin)', html: H('', btn('width:31px;height:31px')), rules: R },
  { name: 'T3 24x24 alone (margin 0)', html: H('', btn('width:24px;height:24px')), rules: R },
  { name: 'T4 20x20 zoom 1.25 = 25 pair adjacent', html: H('', btn('width:20px;height:20px;zoom:1.25') + btn('width:20px;height:20px;zoom:1.25')), rules: R },
  { name: 'T5 30x30 scale .7 pair adjacent', html: H('', btn('width:30px;height:30px;transform:scale(.7)') + btn('width:30px;height:30px;transform:scale(.7)')), rules: R },
  { name: 'T6 20x20 centres 24 apart', html: H('', btn('width:20px;height:20px;margin-right:4px') + btn('width:20px;height:20px')), rules: R },
  { name: 'T7 20x20 centres 23 apart', html: H('', btn('width:20px;height:20px;margin-right:3px') + btn('width:20px;height:20px')), rules: R },
  { name: 'T8 inline buttons in a sentence', html: H('p button{all:unset;color:#00e;text-decoration:underline;cursor:pointer} p{font-size:12px}', '<p>Choose <button>yes</button>/<button>no</button> for this sentence of text.</p>'), rules: R },
  { name: 'T9 inline links in a sentence', html: H('p{font-size:12px}', '<p>Choose <a href=#y>yes</a>/<a href=#n>no</a> for this sentence of text.</p>'), rules: R },
  { name: 'T10 20x20 inside zoom .5 container pair (10px rendered)', html: H('', '<div style="zoom:.5">' + btn('width:40px;height:40px') + btn('width:40px;height:40px') + '</div>'), rules: R },
  { name: 'T11 rotate 45 deg 20x20 pair', html: H('', btn('width:22px;height:22px;transform:rotate(45deg);margin:4px') + btn('width:22px;height:22px;transform:rotate(45deg);margin:4px')), rules: R },
  { name: 'T12 checkbox native in label row pair', html: H('', '<input type=checkbox aria-label=a><input type=checkbox aria-label=b>'), rules: R },
  { name: 'T13 rounded 24x24 circle pair adjacent', html: H('', btn('width:24px;height:24px;border-radius:50%') + btn('width:24px;height:24px;border-radius:50%')), rules: R },
  { name: 'T14 30px button 28px tall margin?', html: H('', btn('width:40px;height:28px')), rules: R },
];
