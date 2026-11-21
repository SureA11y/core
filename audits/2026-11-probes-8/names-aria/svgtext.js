// An SVG <text> as a control's only content: Chromium names the control "", the engine names it from the text
const { runAll } = require('./harness');
runAll([
 { id:'a-svg-text', html:`<a href="#" data-t="a"><svg data-t="s" width="40" height="20"><text data-t="t" x="0" y="15">Go</text></svg></a>` },
 { id:'button-svg-text', html:`<button data-t="b"><svg data-t="s" width="40" height="20"><text x="0" y="15">Save</text></svg></button>` },
 { id:'button-svg-text-aria-hidden-false', html:`<button data-t="b"><svg data-t="s" role="img" width="40" height="20"><text x="0" y="15">Save</text></svg></button>` },
 { id:'h2-svg-text', html:`<h2 data-t="h"><svg width="80" height="20"><text x="0" y="15">Logo text</text></svg></h2>` },
], ['link-name-present','button-name-present','empty-heading','svg-text-alternative-present','role-img-text-alternative-present'], {}, true);
