const { cr, js, rule, brief, page, close } = require('./h.js');
const ID = 'contrast-minimum';
const C = [
 ['opacity .3 parent, black text', '<div style="opacity:.3"><p style="color:#000">Faded paragraph text for testing</p></div>', 'fail'],
 ['aria-disabled button light', '<button aria-disabled="true" style="color:#ccc;background:#fff;border:1px solid">Submit</button>', 'notApplicable/pass?'],
 ['disabled fieldset input value light', '<fieldset disabled><input value="Read only" style="color:#ccc;background:#fff" aria-label="x"></fieldset>', 'notApplicable'],
 ['text-shadow halo makes it readable', '<p style="color:#fff;background:#fff;text-shadow:0 0 2px #000,0 0 2px #000">Haloed text that is readable</p>', 'cantTell'],
 ['-webkit-text-fill-color overrides color', '<p style="color:#000;-webkit-text-fill-color:#eee;background:#fff">Fill color text</p>', 'fail'],
 ['gradient text bg-clip text', '<p style="background:linear-gradient(#eee,#ddd);-webkit-background-clip:text;background-clip:text;color:transparent">Gradient text</p>', 'cantTell'],
 ['color transparent text (invisible)', '<p style="color:transparent">Invisible text</p>', 'notApplicable/pass'],
 ['placeholder light', '<input placeholder="Email address" aria-label="Email" style="background:#fff">', 'fail?'],
 ['visually hidden text', '<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);color:#eee">Hidden text</span>', 'notApplicable'],
 ['text behind solid overlay', '<div style="position:relative"><p style="color:#eee">Covered</p><div style="position:absolute;inset:0;background:#000"></div></div>', 'notApplicable/cantTell'],
 ['mix-blend-mode difference', '<p style="color:#fff;mix-blend-mode:difference;background:transparent">Blended text</p>', 'cantTell'],
 ['large bold 14pt light 3.1', '<p style="font-size:18.67px;font-weight:700;color:#959595">Large bold text</p>', 'pass'],
 ['logo text in link with img+text', '<a href="/"><span style="color:#eee">Brand</span></a>', 'fail'],
 ['text in svg', '<svg width="200" height="30"><text x="0" y="20" fill="#eee">SVG text label</text></svg>', 'fail/cantTell'],
 ['select option light', '<select aria-label="x" style="color:#ddd"><option>Pick</option></select>', 'fail'],
 ['inline color via font color attr', '<p><font color="#eeeeee">Old font tag</font></p>', 'fail'],
 ['currentColor bg', '<p style="color:#777;background:currentColor">Same as bg</p>', 'fail'],
 ['color-mix', '<p style="color:color-mix(in srgb, #fff 90%, #000)">Mixed</p>', 'fail'],
 ['oklch light', '<p style="color:oklch(0.95 0 0)">OKLCH text</p>', 'fail'],
 ['bg via ::before pseudo overlay', '<p class="pb" style="color:#fff;position:relative">On pseudo bg</p>', 'pass/cantTell', '<style>.pb::before{content:"";position:absolute;inset:0;background:#000;z-index:-1}</style>'],
 ['text over image bg', '<p style="color:#fff;background:url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==)">Over image</p>', 'cantTell'],
];
(async () => {
  for (const [l, b, exp, head] of C) {
    const h = page(b, head || '');
    let a, c; try { a = brief(rule(js(h, [ID]), ID)); } catch (e) { a = 'THROW ' + e.message; }
    c = brief(rule(await cr(h, [ID]), ID));
    console.log('### ' + l + '  (exp ' + exp + ')\n  chrome: ' + c.slice(0, 260) + (a.split(' ')[0] !== c.split(' ')[0] ? '\n  JSDOM : ' + a.slice(0, 260) : ''));
  }
  await close();
})();
