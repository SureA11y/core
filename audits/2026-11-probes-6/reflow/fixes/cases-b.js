module.exports = (page) => [
  ['carousel of fitting cards in a scroller', page('.s{overflow-x:auto;width:290px} .row{display:flex;gap:8px;width:max-content} .row>a{flex:none;width:260px}', '<div class="s"><div class="row" id="row"><a href="#1">One</a><a href="#2">Two</a><a href="#3">Three</a></div></div>')],
  ['row of too-wide items in a scroller', page('.s{overflow-x:auto;width:290px} .row{display:flex;width:max-content} .row>p{flex:none;width:400px}', '<div class="s"><div class="row" id="row"><p>One wide</p><p>Two wide</p></div></div>')],
  ['role=grid wide', page('#g{width:600px}', '<div role="grid" id="g"><div role="row"><div role="gridcell">A</div></div></div>')],
  ['role=application map wide', page('#m{width:600px;height:200px}', '<div role="application" id="m" aria-label="Map">Map</div>')],
  ['long math formula', page('', '<p>Formula: <math id="f"><mi>a</mi><mo>+</mo><mi>b</mi><mo>+</mo><mi>c</mi><mo>+</mo><mi>d</mi><mo>+</mo><mi>e</mi><mo>+</mo><mi>f</mi><mo>+</mo><mi>g</mi><mo>+</mo><mi>h</mi><mo>+</mo><mi>i</mi><mo>+</mo><mi>j</mi><mo>+</mo><mi>k</mi><mo>+</mo><mi>l</mi><mo>+</mo><mi>m</mi><mo>+</mo><mi>n</mi><mo>+</mo><mi>o</mi><mo>+</mo><mi>p</mi><mo>+</mo><mi>q</mi><mo>+</mo><mi>r</mi><mo>+</mo><mi>s</mi><mo>+</mo><mi>t</mi></math></p>')],
  ['body min-width', page('body{min-width:600px}', '<header id="h">Head</header><main id="m">Main</main><footer id="f">Foot</footer>')],
  ['nowrap nav', page('nav{white-space:nowrap}', '<nav id="n"><a href="#">Home</a> <a href="#">Products and services</a> <a href="#">About us</a> <a href="#">Contact</a></nav>')],
  ['overflow-clip-margin within margin', page('.c{overflow:clip;overflow-clip-margin:30px;width:280px} .w{width:300px}', '<div class="c"><div class="w" id="w">Twenty pixels over, within the margin</div></div>')],
  ['clip-path hidden text, root clipped', page('body{overflow-x:hidden} .vh{position:absolute;clip-path:inset(50%);width:400px;white-space:nowrap}', '<span class="vh" id="v">Visually hidden text that runs long past the edge</span><p>Shown</p>')],
  ['frameset', '<!doctype html><html><head><title>t</title></head><frameset cols="50%,50%"><frame src="about:blank"><frame src="about:blank"></frameset></html>'],
  ['55 wide paragraphs (cap)', page('p{width:400px;margin:0}', Array.from({ length: 55 }, (_, i) => `<p>Paragraph ${i}</p>`).join('').replace(/<p>/g, () => '<div style="position:relative"><p>').replace(/<\/p>/g, '</p></div>'))]
];
