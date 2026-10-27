const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff} ${css}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable'];
const opts = '<option>First choice</option><option>Second</option>';
export default [
  { name: 'S1 default select', html: H('', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S2 select light color', html: H('#a{color:#aaa}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S3 select dark bg light text good', html: H('#a{color:#fff;background:#333}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S4 select with option light color (shown option)', html: H('#a option{color:#bbb}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S5 selected option styled light (shown)', html: H('#a option:checked{color:#ccc}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S6 base-select light text', html: H('#a,#a::picker(select){appearance:base-select} #a{color:#aaa}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S7 base-select good', html: H('#a,#a::picker(select){appearance:base-select} #a{color:#000}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S8 base-select with button and selectedcontent light', html: H('#a,#a::picker(select){appearance:base-select} #a button{color:#bbb}', `<label>L <select id=a><button><selectedcontent></selectedcontent></button>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S9 select disabled light', html: H('#a{color:#ccc}', `<label>L <select id=a disabled>${opts}</select></label>`), rules: R },
  { name: 'S10 select appearance none bg image arrow', html: H('#a{appearance:none;background:#fff url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22%3E%3Cpath d=%22M0 0l5 5 5-5%22/%3E%3C/svg%3E") no-repeat right 4px center;padding-right:20px;color:#000;border:1px solid #000}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S11 select dark scheme default', html: H(':root{color-scheme:dark} body{background:#121212}', `<label style="color:#fff">L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S12 select empty first option shown', html: H('#a{color:#aaa}', `<label>L <select id=a><option value=""></option><option>Choose</option></select></label>`), rules: R, sample: ['#a'] },
  { name: 'S13 select multiple', html: H('#a{color:#aaa}', `<label>L <select id=a multiple>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S14 select transparent bg on dark page', html: H('body{background:#000;color:#fff} #a{background:transparent;color:#fff}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S15 select size=1 shown option hidden attr', html: H('#a{color:#000}', `<label>L <select id=a><option hidden selected>Pick one</option>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S16 select bg rgba translucent', html: H('body{background:#000} label{color:#fff} #a{background:rgba(255,255,255,.2);color:#fff}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S17 select option bg dark, select default', html: H('#a option{background:#000;color:#fff}', `<label>L <select id=a>${opts}</select></label>`), rules: R, sample: ['#a'] },
  { name: 'S18 optgroup label light', html: H('#a optgroup{color:#ccc}', `<label>L <select id=a><optgroup label=Group><option>One</option></optgroup></select></label>`), rules: R, sample: ['#a'] },
];
