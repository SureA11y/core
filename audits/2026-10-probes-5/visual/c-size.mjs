const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font-family:Arial;background:#fff} p{color:#949494;margin:4px} ${css}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum'];
const t = (style) => `<p style="${style}">Sample text here</p>`;
export default [
  { name: 'Z1 24px normal (large)', html: H('', t('font-size:24px')), rules: R },
  { name: 'Z2 23.99px normal (not large)', html: H('', t('font-size:23.99px')), rules: R },
  { name: 'Z3 18pt', html: H('', t('font-size:18pt')), rules: R },
  { name: 'Z4 14pt bold', html: H('', t('font-size:14pt;font-weight:700')), rules: R },
  { name: 'Z5 18.66px bold (just below 14pt)', html: H('', t('font-size:18.66px;font-weight:700')), rules: R },
  { name: 'Z6 18.67px bold', html: H('', t('font-size:18.67px;font-weight:700')), rules: R },
  { name: 'Z7 16px zoom 1.5 (24px drawn)', html: H('', t('font-size:16px;zoom:1.5')), rules: R },
  { name: 'Z8 16px in zoom 1.5 ancestor', html: H('', '<div style="zoom:1.5">' + t('font-size:16px') + '</div>'), rules: R },
  { name: 'Z9 1.5rem with html font-size 16px', html: H('', t('font-size:1.5rem')), rules: R },
  { name: 'Z10 clamp to 24px', html: H('', t('font-size:clamp(10px, 10vw, 24px)')), rules: R },
  { name: 'Z11 cqi container 400px * 6cqi = 24px', html: H('.c{container-type:inline-size;width:400px}', '<div class=c>' + t('font-size:6cqi') + '</div>'), rules: R },
  { name: 'Z12 synthetic bold <b> 18.67px', html: H('', '<p style="font-size:18.67px"><b>Bold sample</b></p>'), rules: R },
  { name: 'Z13 font-weight bolder from 400 parent', html: H('', '<p style="font-size:19px"><span style="font-weight:bolder">Bolder sample</span></p>'), rules: R },
  { name: 'Z14 font: 700 via shorthand, -webkit-text-stroke fake bold', html: H('', t('font-size:19px;-webkit-text-stroke:1px #949494')), rules: R },
  { name: 'Z15 transform scale 1.5 on 16px', html: H('', t('font-size:16px;transform:scale(1.5);transform-origin:0 0')), rules: R },
  { name: 'Z16 h1 default 2em = 32px', html: H('h1{color:#949494}', '<h1>Heading</h1>'), rules: R },
  { name: 'Z17 svg text scaled via viewBox', html: H('', '<svg width=300 height=60 viewBox="0 0 150 30"><text x=0 y=20 font-size=12 fill="#949494">SVG text</text></svg>'), rules: R },
  { name: 'Z18 font-size 24px with font-size-adjust small', html: H('', t('font-size:24px;font-size-adjust:0.3')), rules: R },
  { name: 'Z19 text-size-adjust / minimum font size n/a; small-caps 24px', html: H('', t('font-size:24px;font-variant:small-caps')), rules: R },
  { name: 'Z20 18.67px weight 700 via font-variation-settings only', html: H('', t('font-size:18.67px;font-variation-settings:"wght" 700')), rules: R },
];
