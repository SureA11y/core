const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff} ${css}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable', 'link-in-text-block'];
const mq = '.badge{background:#f80;color:#fff;padding:2px} @media (forced-colors: active){.badge{background:Canvas;color:CanvasText;border:1px solid}}';
const body = '<p>Status <span class=badge>New</span></p>';
const mk = (n, css, b) => [
  { name: n + ' off', html: H(css, b), rules: R },
  { name: n + ' FORCED', html: H(css, b), rules: R, context: { forcedColors: 'active' } },
];
export default [
  ...mk('FC1 forced-colors media query badge', mq, body),
  ...mk('FC2 plain grey text', 'p{color:#999}', '<p>grey</p>'),
  ...mk('FC3 dark page, dark grey text', 'body{background:#000} p{color:#333}', '<p>dark grey</p>'),
  ...mk('FC4 system color GrayText text', 'p{color:GrayText}', '<p>gray text sys</p>'),
  ...mk('FC5 forced-color-adjust none on element by page', '.k{forced-color-adjust:none;color:#aaa}', '<p class=k>kept</p>'),
  ...mk('FC6 prefers-contrast more MQ', 'p{color:#999} @media (prefers-contrast: more){p{color:#000}}', '<p>pc</p>'),
];
