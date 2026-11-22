'use strict';

// The property names the round 12 final review found the engine reading or
// setting through Object.prototype, and a page with a finding for each
// (round 12, F12-4, F12-5). Shared by object-prototype-values.test.js and
// its Chromium twin.

const NAMES = [
  // A read-only value stopped the whole scan.
  'i18n',
  'sharedCache',
  'rollupIds',
  'signals',
  'whyKey',
  'separators',
  'animationsAtScanStart',
  'paintContainedByContentVisibility',
  '__instance',
  'limit',
  'atScanStart',
  'paintContained',
  // A read-only value made a rule report an error, or changed it.
  '__node',
  '__elBlockerCache',
  'key',
  'width',
  'index',
  // A plain value changed a result.
  'pseudo',
  'ask',
  'also',
  'button',
  'navigation',
  'colorScheme',
  // Found by the same probe once those were fixed.
  'unknown',
  'sizeScaledBy',
  'rgba'
];

const PAGE =
  '<!doctype html><html lang=en><head><title>Shop page</title><style>.lo{color:#999}a.u{text-decoration:none;color:#36c}button:focus{outline:none}</style></head><body><header><nav aria-label=Main><a href=/>Home</a></nav></header><main><h1>Title</h1><img src=a.png><img src=b.png alt="photo"><p class=lo>Low contrast text</p><p>Read <a class=u href=/x>more here</a> now.</p>\n<div aria-hidden=true><a href=#z>hidden link</a></div><input type=text><label>Name <input id=n></label><button></button><button>OK</button><div role=button onclick="x()">Go</div><span style="color:#ccc">€</span>45\n<table><tr><th>A</th></tr><tr><td>1</td></tr></table><ul role=navigation><li><a href=#>a</a></li></ul><svg width=100 height=30><rect width=100 height=30 fill="#fff"/><text x=2 y=20 fill="#eee">Hi</text></svg><select><option>1</option></select><p lang=xx>t</p><a href=#>click here</a><a href=#>click here</a><h3>Skipped</h3><div tabindex=5>t</div></main><footer>f</footer></body></html>';

module.exports = { NAMES, PAGE };
