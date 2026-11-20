const { page, runCases } = require('./harness');
const P = page;
const card = '.card{overflow:hidden;border:1px solid} .row{display:flex;width:560px} .row>*{flex:none;width:270px}';
runCases([
  { name: 'carousel w/ display:none radio inputs (CSS-only carousel)', html: P(card, '<div class="card"><div class="row" id="rail"><a href="#a">Slide one</a><a href="#b">Slide two</a><input type="radio" name="s" style="display:none" aria-label="1"><input type="radio" name="s" hidden aria-label="2"></div></div>') },
  { name: 'clipped row, disabled input', html: P(card, '<div class="card"><div class="row" id="rail"><a href="#a">One</a><span><input disabled aria-label="x"></span></div></div>') },
  { name: 'control fully visible, only text cut', html: P(card, '<div class="card"><div class="row" id="rail"><label>Name <input style="width:150px"></label><p>Some help text that is cut off</p></div></div>') },
  { name: 'contenteditable="" (empty) cut', html: P(card, '<div class="card"><div class="row" id="rail"><p>One</p><div contenteditable aria-label="ed">Editable</div></div></div>') },
  { name: 'contenteditable=plaintext-only cut', html: P(card, '<div class="card"><div class="row" id="rail"><p>One</p><div contenteditable="plaintext-only" aria-label="ed">Editable</div></div></div>') },
  { name: 'role=textbox cut', html: P(card, '<div class="card"><div class="row" id="rail"><p>One</p><div role="textbox" tabindex=0 aria-label="ed">x</div></div></div>') },
  { name: 'role=option/menuitemcheckbox cut', html: P(card, '<div class="card"><div class="row" id="rail"><p>One</p><div role="menuitemcheckbox" aria-checked="false" tabindex=0>opt</div></div></div>') },
  { name: 'native button cut (submit)', html: P(card, '<div class="card"><div class="row" id="rail"><p>One</p><button>Submit order</button></div></div>') },
  { name: 'input type=submit cut', html: P(card, '<div class="card"><div class="row" id="rail"><p>One</p><input type="submit" value="Go"></div></div>') },
  { name: 'input in data table in scroller', html: P('table{width:600px}', '<div style="overflow-x:auto"><table id="t"><tr><th>A</th><th>B</th></tr><tr><td><input aria-label="x"></td><td><input aria-label="y" style="width:250px"></td></tr></table></div>') },
  { name: 'form fields cut by viewport edge (body overflow-x:hidden)', html: P('body{overflow-x:hidden}', '<form id="f" style="display:flex;width:600px"><input aria-label="a" style="flex:none;width:280px"><input aria-label="b" style="flex:none;width:280px"></form>') },
  { name: 'form fields making page scroll', html: P('', '<form id="f" style="display:flex;width:600px"><input aria-label="a" style="flex:none;width:280px"><input aria-label="b" style="flex:none;width:280px"></form>') },
  { name: 'scroll-snap wizard: second page wholly past edge with fields', html: P('.w{display:flex;overflow-x:auto;scroll-snap-type:x mandatory} .w>section{flex:0 0 100%;scroll-snap-align:start}', '<div class="w" id="wiz"><section id="s1"><label>Name <input></label></section><section id="s2"><label>Email <input></label><label>Phone <input></label></section></div>') },
  { name: 'tab list scrolled to end (state)', html: P('.tabs{overflow-x:auto;white-space:nowrap}', '<div class="tabs" id="tabs"><div id="inner" style="display:inline-flex;width:700px"><button role="tab">All</button><button role="tab">Executed</button><button role="tab">Rejected</button></div></div>') },
  { name: 'tab list scrolled to end (state) – scrolled', html: P('.tabs{overflow-x:auto;white-space:nowrap}', '<div class="tabs" id="tabs"><div id="inner" style="display:inline-flex;width:700px"><button role="tab">All</button><button role="tab">Executed</button><button role="tab">Rejected</button></div></div>'), opts: { before: (p) => p.evaluate(() => { document.getElementById('tabs').scrollLeft = 10000; }) } },
  { name: 'form in scroll dialog scrolled to end', html: P('.d{overflow-x:auto}', '<div class="d" id="d"><form id="f" style="width:600px"><input aria-label="a" style="width:280px"><input aria-label="b" style="width:280px"></form></div>'), opts: { before: (p) => p.evaluate(() => { document.getElementById('d').scrollLeft = 10000; }) } },
]);
