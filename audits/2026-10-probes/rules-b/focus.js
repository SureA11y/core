const h = require('./h.js'); const { jscan } = require('./j.js');
const R = ['css-focus-indicator-suppressed','css-hidden-focus'];
const cases = {
  focus_none_fv_replace: ':focus{outline:none}:focus-visible{outline:2px solid blue}',
  focus_not_fv: ':focus:not(:focus-visible){outline:none}',
  a_none: 'a{outline:none}',
  a_none_focus_shadow: 'a{outline:none}a:focus{box-shadow:0 0 0 3px blue}',
  focus_none_layer: '@layer base{a:focus{outline:none}}',
  focus_none_media: '@media screen{a:focus{outline:none}}',
  focus_none_nested: 'a{&:focus{outline:none}}',
  focus_within_parent: 'a:focus{outline:none}p:focus-within{background:yellow}',
  outline_color_same_as_bg: 'a:focus{outline-color:#fff}html{background:#fff}',
  outline_width_0: 'a:focus{outline-width:0}',
  outline_style_none_fv: 'a:focus-visible{outline-style:none}',
  where_selector: ':where(a):focus{outline:none}',
  is_selector: ':is(a,button):focus{outline:none}',
};
(async () => {
  for (const [k, c] of Object.entries(cases)) {
    const body = `<style>${c}</style><p>Text <a href="#">link</a></p><button>B</button>`;
    const a = await h.scan(body, { rules: R }); const b = jscan(body, { rules: R });
    console.log(k.padEnd(24), R.map(id => `${id.replace('css-','')}=${a[id].outcome}/${b[id].outcome}[${a[id].occ.map(o=>o.sel.split(' > ').pop()).join(',')}]`).join('  '));
  }
  await h.close();
})();
