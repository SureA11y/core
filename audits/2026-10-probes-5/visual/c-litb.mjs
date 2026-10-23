const H = (c) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff;color:#000} a{color:${c};text-decoration:none}</style></head><body><p>Some text with <a href=#x>a link</a> inside the sentence.</p></body></html>`;
const R = ['link-in-text-block'];
export default [
  { name: 'L1 #5d5d5d', html: H('#5d5d5d'), rules: R },
  { name: 'L2 #646464', html: H('#646464'), rules: R },
  { name: 'L3 #555', html: H('#555'), rules: R },
];
