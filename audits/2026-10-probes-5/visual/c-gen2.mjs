const P = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px/1.4 Arial;background:#fff;color:#000} ${css}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable'];
export default [
  { name: 'G23b marker content words light', html: P('li::marker{content:"Step: ";color:#bbb}', '<ul><li id=a>One</li></ul>'), rules: R, sample: ['ul'] },
  { name: 'G23c marker content words black on li light', html: P('li{color:#bbb} li::marker{content:"Step: ";color:#000}', '<ul><li id=a><span style="color:#000">One</span></li></ul>'), rules: R },
  { name: 'G23d ol marker default color light li', html: P('li{color:#bbb}', '<ol><li id=a><span style="color:#000">One</span></li></ol>'), rules: R },
  { name: 'G17b quotes words light', html: P('q{quotes:"Quote: " " end"} q::before{content:open-quote;color:#ccc} q::after{content:close-quote;color:#ccc}', '<p><q id=a>quoted</q></p>'), rules: R },
  { name: 'G25b own text-indent', html: P('#a{text-indent:-9999px;color:#eee}', '<p id=a>Hidden text</p>'), rules: R, sample: ['#a'] },
  { name: 'G25c before text-indent', html: P('#a::before{content:"Hidden";color:#eee;display:inline-block;text-indent:-9999px}', '<p id=a>Main text</p>'), rules: R, sample: ['#a'] },
  { name: 'G25d before block text-indent', html: P('#a::before{content:"Hidden";color:#eee;display:block;text-indent:-9999px;overflow:hidden}', '<p id=a>Main text</p>'), rules: R },
  { name: 'G28 before color-mix', html: P('#a::before{content:"Pale ";color:color-mix(in srgb, #000 20%, #fff)}', '<p id=a>Main text</p>'), rules: R },
  { name: 'G29 before inherits light from parent with dark child', html: P('#a{color:#ccc}#a::before{content:"Pale "}', '<p id=a><span style="color:#000">Main text</span></p>'), rules: R },
  { name: 'G30 before over image bg', html: P('#a::before{content:"Tag ";color:#fff;background:linear-gradient(#000,#000)}', '<p id=a>Main text</p>'), rules: R },
  { name: 'G31 before text in shadow host', html: P('', '<div id=h></div><script>const r=h.attachShadow({mode:"open"});r.innerHTML="<style>p::before{content:\'Pale \';color:#ccc}</style><p>Main</p>"</script>'), rules: R },
];
