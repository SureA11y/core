const { page, runCases } = require('./harness');
const P = page;
runCases([
  // false negatives
  { name: 'FN long unbroken URL in p', html: P('', '<p id="p">https://example.org/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</p>') },
  { name: 'FN fixed-width layout div', html: P('', '<div id="l" style="width:960px;margin:auto"><p>Hi</p></div>') },
  { name: 'body min-width with 3 children', html: P('body{min-width:600px}', '<header id="h">H</header><main id="m"><p>t</p></main><footer id="f">F</footer>') },
  { name: 'body min-width text only', html: P('body{min-width:600px}', 'Just text') },
  { name: 'nowrap nav', html: P('nav{white-space:nowrap}', '<nav id="n"><a href=#>Home</a> <a href=#>Products and services</a> <a href=#>About our company</a> <a href=#>Contact</a></nav>') },
  { name: 'wide img no max-width', html: P('', '<img id="i" width="800" height="100" alt="x">') },
  { name: 'flex row no wrap', html: P('.r{display:flex}.r>div{flex:none;width:150px}', '<div class="r" id="r"><div>a</div><div>b</div><div>c</div></div>') },
  { name: 'grid fixed cols', html: P('.g{display:grid;grid-template-columns:200px 200px}', '<div class="g" id="g"><div>a</div><div>b</div></div>') },
  { name: 'RTL root, element overflowing left', html: P('.w{width:600px}', '<div class="w" id="w">x</div>', 'dir="rtl"') },
  { name: 'body dir=rtl only, wide element (content off left, unreachable)', html: '<!doctype html><html lang="ar"><head><title>t</title></head><body dir="rtl" style="margin:8px"><div id="w" style="width:600px;background:#eee">بداية النص هنا ... نهاية</div></body></html>' },
  { name: 'LTR negative margin-left pushes text off left edge', html: P('', '<p id="neg" style="margin-left:-120px">Important text whose start is cut off at the left edge of the screen</p>') },
  { name: 'LTR relative left:-100px', html: P('', '<div id="rel" style="position:relative;left:-100px">Start of this sentence is lost off the left side</div>') },
  { name: 'fixed banner wider than viewport (no scroll)', html: P('', '<p>Content</p><div id="cookie" style="position:fixed;bottom:0;left:0;width:600px;background:#ffc;display:flex;gap:8px"><span style="flex:none;width:300px">We use cookies</span><button>Accept</button><button>Reject</button></div>') },
  { name: 'fixed input row wider (no scroll)', html: P('', '<form id="fx" style="position:fixed;top:0;left:0;width:640px"><input style="width:300px" aria-label="a"><input style="width:300px" aria-label="b"></form>') },
  { name: 'html overflow-y:scroll + body overflow-x:hidden', html: P('html{overflow-y:scroll} body{overflow-x:hidden}', '<div id="w" style="width:600px">Wide content cut off by body</div>') },
  { name: 'body overflow-x:hidden only', html: P('body{overflow-x:hidden}', '<div id="w" style="width:600px">Wide content cut</div>') },
  { name: 'html overflow-x:hidden only', html: P('html{overflow-x:hidden}', '<div id="w" style="width:600px">Wide content cut</div>') },
  { name: 'body writing-mode vertical-rl', html: P('body{writing-mode:vertical-rl}', '<p>縦書きの文章です。</p><p>もう一つ</p><p>三つ目</p><p>四</p><p>五</p><p>六</p><p>七</p><p>八</p><p>九</p><p>十</p><p>十一</p><p>十二</p><p>十三</p><p>十四</p><p>十五</p><p>十六</p><p>十七</p><p>十八</p><p>十九</p><p>二十</p><p>21</p><p>22</p><p>23</p><p>24</p><p>25</p><p>26</p><p>27</p><p>28</p>', 'lang="ja"') },
]);
