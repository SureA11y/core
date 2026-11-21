const { runAll } = require('./harness');
runAll([
 { id:'mui-container', html:`<div data-t="p" role="presentation" tabindex="-1"><div role="dialog" aria-label="d">x</div></div>` },
 { id:'pres-tabindex0', html:`<div data-t="p" role="presentation" tabindex="0">x</div>` },
 { id:'none-li', html:`<ul role="tablist" aria-label="t"><li data-t="li" role="none"><button role="tab" aria-selected="true">A</button></li></ul>` },
 { id:'pres-img-title', html:`<img data-t="i" src="x.png" role="presentation" title="Tip">` },
 { id:'pres-aria-describedby', html:`<span id="d">desc</span><div data-t="p" role="none" aria-describedby="d">x</div>` },
], ['presentation-role-conflict','aria-allowed-role'], {}, false);
