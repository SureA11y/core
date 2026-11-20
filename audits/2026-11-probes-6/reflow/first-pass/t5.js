const { page, runCases } = require('./harness');
const { devices } = require('/home/user/core/node_modules/playwright');
const P = page;
const wide = P('', '<div id="w" style="width:600px">Wide</div>');
const wideMeta = '<!doctype html><html lang="en"><head><title>t</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="w" style="width:600px">Wide</div></body></html>';
const noMeta = '<!doctype html><html lang="en"><head><title>t</title></head><body><div id="w" style="width:600px">Wide</div></body></html>';
const fixedMeta = '<!doctype html><html lang="en"><head><title>t</title><meta name="viewport" content="width=1024"></head><body><div id="w" style="width:600px">Wide</div></body></html>';
runCases([
  { name: '1280 wide page', html: wide, opts: { pageOptions: { viewport: { width: 1280, height: 800 } } } },
  { name: '1280 at deviceScaleFactor 4 (not zoom)', html: wide, opts: { pageOptions: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 4 } } },
  { name: '321 viewport', html: wide, opts: { pageOptions: { viewport: { width: 321, height: 640 } } } },
  { name: '320 viewport', html: wide, opts: { pageOptions: { viewport: { width: 320, height: 640 } } } },
  { name: '319 viewport', html: wide, opts: { pageOptions: { viewport: { width: 319, height: 640 } } } },
  { name: 'dpr 2 at 320', html: wide, opts: { pageOptions: { viewport: { width: 320, height: 640 }, deviceScaleFactor: 2 } } },
  { name: 'dpr 3 at 320 with subpixel 320.5 element', html: P('', '<div id="w" style="width:305.4px;margin-left:7.3px">x</div>'), opts: { pageOptions: { viewport: { width: 320, height: 640 }, deviceScaleFactor: 3 } } },
  { name: 'iPhone SE device, meta viewport, wide', html: wideMeta, opts: { pageOptions: { ...devices['iPhone SE'], viewport: { width: 320, height: 568 } } } },
  { name: 'isMobile 320, NO meta viewport, wide', html: noMeta, opts: { pageOptions: { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true } } },
  { name: 'isMobile 320, meta width=1024', html: fixedMeta, opts: { pageOptions: { viewport: { width: 320, height: 568 }, isMobile: true } } },
  { name: 'isMobile 320, meta device-width, wide', html: wideMeta, opts: { pageOptions: { viewport: { width: 320, height: 568 }, isMobile: true } } },
  { name: 'isMobile 320, meta device-width, fits', html: wideMeta.replace('width:600px', 'width:100px'), opts: { pageOptions: { viewport: { width: 320, height: 568 }, isMobile: true } } },
  { name: 'body removed', html: P('', '<p>x</p>'), opts: { before: (p) => p.evaluate(() => document.body.remove()) } },
  { name: 'frameset doc', html: '<!doctype html><html><head><title>t</title></head><frameset cols="*"><frame src="about:blank"></frameset></html>' },
]);
