const R=['contrast-minimum','contrast-computable'];
require('./h').run([
 ['own opacity w/ own bg (white text on black, op .5, 30px) real ~3.95 large => pass', '<p style="opacity:.5;background:#000;color:#fff;font-size:30px">Large heading text</p>'],
 ['text-fill-color overrides color', '<p style="color:#eee;-webkit-text-fill-color:#000">Readable black text</p>'],
 ['first-line', '<style>.f{color:#bbb}.f::first-line{color:#000}</style><p class="f">Single line paragraph black</p>'],
 ['svg viewBox scaled', '<svg viewBox="0 0 100 20" width="800" height="160"><text x="0" y="12" font-size="10" fill="#888">Big SVG words</text></svg>'],
 ['transform scale 2 on 12px', '<p style="color:#888;font-size:12px;transform:scale(2);transform-origin:0 0">Scaled text here</p>'],
 ['zoom 2 on 12px', '<p style="color:#888;font-size:12px;zoom:2">Zoomed text here</p>'],
 ['text-stroke thick', '<p style="color:#ddd;-webkit-text-stroke:2px #000;font-size:30px">Stroked text</p>'],
 ['opacity 0 text', '<p style="opacity:0;color:#eee">Invisible text</p>'],
],R);
