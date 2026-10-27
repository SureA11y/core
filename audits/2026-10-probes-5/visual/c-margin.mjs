const H = (body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff;color:#000}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-enhanced'];
export default [
  { name: 'M1 #707070 4.952 (no margin)', html: H('<p style="color:#707070">text</p>'), rules: R },
  { name: 'M2 #717171 4.881 (margin)', html: H('<p style="color:#717171">text</p>'), rules: R },
  { name: 'M3 large #8d8d8d 3.319 (no margin)', html: H('<p style="color:#8d8d8d;font-size:24px">text</p>'), rules: R },
  { name: 'M4 large #8e8e8e 3.276 (margin)', html: H('<p style="color:#8e8e8e;font-size:24px">text</p>'), rules: R },
  { name: 'M5 #535353 7.69 (AAA margin)', html: H('<p style="color:#535353">text</p>'), rules: R },
  { name: 'M6 #525252 (AAA none)', html: H('<p style="color:#525252">text</p>'), rules: R },
  { name: 'M7 black + a large #8e8e8e: closest', html: H('<p>black</p><p style="color:#717171">n</p><p style="color:#8e8e8e;font-size:24px">L</p>'), rules: R },
  { name: 'M8 fail + near pass', html: H('<p style="color:#999">fail</p><p style="color:#717171">near</p>'), rules: R },
  { name: 'M9 only black', html: H('<p>black</p>'), rules: R },
  { name: 'M10 rgba text alpha giving 4.6', html: H('<p style="color:rgba(0,0,0,.54)">text</p>'), rules: R },
];
