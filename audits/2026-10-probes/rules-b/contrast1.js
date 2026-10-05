const h = require('./h.js');
const R = ['contrast-minimum','contrast-enhanced','contrast-computable'];
const W = '<style>html{background:#fff}</style>';
const cases = {
  solid_pass: `${W}<p id=t style="color:#767676">Hello</p>`,  // 4.54
  solid_fail: `${W}<p id=t style="color:#777">Hello</p>`,  // 4.48
  group_opacity_black_body: `<style>html{background:#000}</style><div style="opacity:.5"><p id=t style="background:#fff;color:#000">Hello</p></div>`, // expect 5.32 pass
  group_opacity_nobg: `${W}<div style="opacity:.5"><p id=t style="color:#000">Hello</p></div>`, // black .5 on white = 128 vs white -> 3.95 fail
  rgba_text: `${W}<p id=t style="color:rgba(0,0,0,.6)">Hello</p>`, // 102 -> 5.74? 
  bg_alpha_stack: `<style>html{background:#000}</style><div style="background:rgba(255,255,255,.5)"><div style="background:rgba(255,255,255,.5)"><p id=t style="color:#fff">Hello</p></div></div>`,
  positioned_over_sibling: `${W}<div style="position:relative"><div style="background:#000;height:100px"></div><p id=t style="position:absolute;top:0;margin:0;color:#ddd">Hello on black</p></div>`,
  negative_margin_over: `${W}<div style="background:#000;height:60px"></div><p id=t style="margin-top:-50px;color:#eee;position:relative">Hello on black</p>`,
  oklch: `${W}<p id=t style="color:oklch(0.2 0 0)">Hello</p>`,
  lab: `${W}<p id=t style="color:lab(20 0 0)">Hello</p>`,
  p3: `${W}<p id=t style="color:color(display-p3 0 0 0)">Hello</p>`,
  colormix: `${W}<p id=t style="color:color-mix(in srgb, black 80%, white)">Hello</p>`,
  hsla: `${W}<p id=t style="color:hsl(0 0% 0% / .6)">Hello</p>`,
  cssvar_currentColor: `${W}<div style="--c:#000;color:var(--c)"><p id=t style="border:1px solid currentColor">Hello</p></div>`,
  light_dark: `<style>:root{color-scheme:light;background:#fff}</style><p id=t style="color:light-dark(#000,#fff)">Hello</p>`,
  svg_text_fill: `${W}<svg width=200 height=50><text id=t x=0 y=30 fill="#000" style="color:#eee">Hello SVG</text></svg>`,
  svg_text_fill_low: `${W}<svg width=200 height=50><text id=t x=0 y=30 fill="#eee" style="color:#000">Hello SVG</text></svg>`,
  select_options: `${W}<select><option>One option</option><option id=t style="color:#ccc">Two option</option></select>`,
  select_options_bg: `${W}<select style="color:#000;background:#fff"><option>One option</option><option id=t style="color:#ccc">Two</option></select>`,
  visibility_hidden: `${W}<p id=t style="visibility:hidden;color:#eee">Hello</p>`,
  offscreen: `${W}<p id=t style="position:absolute;left:-9999px;color:#eee">Hello</p>`,
  sronly: `${W}<p id=t style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;color:#eee">Hello</p>`,
  sronly_clippath: `${W}<p id=t style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;color:#eee">Hello</p>`,
  disabled_btn: `${W}<button disabled style="color:#ddd;background:#fff">Hello</button>`,
  disabled_fieldset: `${W}<fieldset disabled><label>Name <input></label></fieldset>`,
  input_value: `${W}<input id=t value="Typed text" style="color:#ddd;background:#fff">`,
  textarea: `${W}<textarea id=t style="color:#ddd;background:#fff">Typed text</textarea>`,
  placeholder: `${W}<input id=t placeholder="Placeholder" style="background:#fff">`,
  input_submit: `${W}<input type=submit value="Send" style="color:#ccc;background:#fff">`,
  text_shadow: `${W}<p id=t style="color:#ccc;text-shadow:0 0 2px #000">Hello</p>`,
  blend: `${W}<p id=t style="color:#ccc;mix-blend-mode:difference">Hello</p>`,
  filter_invert: `${W}<div style="filter:invert(1)"><p id=t style="color:#fff;background:#000">Hello</p></div>`,
  gradient: `${W}<p id=t style="color:#777;background:linear-gradient(#fff,#eee)">Hello</p>`,
  bgimage_url: `${W}<p id=t style="color:#777;background:url(data:image/gif;base64,R0lGODlhAQABAAAAACw=)">Hello</p>`,
  img_behind: `${W}<div style="position:relative"><img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='80'><rect width='300' height='80' fill='black'/></svg>"><p id=t style="position:absolute;top:0;margin:0;color:#ddd">Over image</p></div>`,
  pseudo_before: `${W}<p id=t class=x>Hello</p><style>.x::before{content:'';position:absolute;inset:0;background:#000;z-index:-1}.x{position:relative;color:#eee;z-index:0}</style>`,
  color_scheme_dark_nobg: `<style>:root{color-scheme:dark}</style><p id=t style="color:#bbb">Hello</p>`,
  logo_text: `${W}<a href="/" aria-label="Acme"><span style="color:#eee">Acme Inc</span></a>`,
  emoji_only: `${W}<p style="color:#eee">✔✔</p>`,
  details_closed: `${W}<details><summary>Sum</summary><p id=t style="color:#eee">Hidden content</p></details>`,
  hidden_until_found: `${W}<div hidden="until-found"><p id=t style="color:#eee">Hidden content</p></div>`,
  content_visibility: `${W}<div style="content-visibility:hidden"><p id=t style="color:#eee">Hidden content</p></div>`,
  zero_size_font: `${W}<p id=t style="font-size:0;color:#eee">Hello</p>`,
  transparent_text: `${W}<p id=t style="color:transparent">Hello</p>`,
  overflow_clipped_child: `${W}<div style="height:0;overflow:hidden"><p id=t style="color:#eee">Hello</p></div>`,
  opacity0: `${W}<p id=t style="opacity:0;color:#eee">Hello</p>`,
  inert: `${W}<div inert><p style="color:#eee">Hello</p></div>`,
  aria_hidden_drawn: `${W}<p aria-hidden=true style="color:#eee">Hello</p>`,
};
(async () => {
  for (const [k, body] of Object.entries(cases)) {
    try {
      const r = await h.scan(body, { rules: R });
      const s = R.map(id => { const x = r[id]; if (!x) return id+':-'; const o = x.occ.filter(o=>o.rc && o.rc!=='ALL_ABOVE_THRESHOLD').map(o => `${o.rc}${o.d&&o.d.metrics&&o.d.metrics.ratio?'@'+o.d.metrics.ratio.toFixed(3):''}${o.d&&o.d.colors?'('+o.d.colors.foregroundHex+'/'+o.d.colors.backgroundHex+')':''}`).join(','); return `${id.replace('contrast-','')}=${x.outcome}${o?'['+o+']':''}${x.margin?' m='+x.margin.value.toFixed(3):''}`; }).join('  ');
      console.log(k.padEnd(28), s);
    } catch (e) { console.log(k, 'ERR', e.message); }
  }
  await h.close();
})();
