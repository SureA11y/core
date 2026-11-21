const A=['aria-roles-valid','aria-allowed-attr','aria-required-attr','aria-valid-attr-value','aria-valid-attr','aria-prohibited-attr','aria-deprecated-role','aria-conditional-attr','aria-allowed-role'];
module.exports=[
{name:'role-fallback', rules:A, html:'<div id=a role="foo button" tabindex=0>x</div><div id=b role="  ">x</div><div id=c role="BUTTON" tabindex=0>x</div>', ax:['#a','#b','#c']},
{name:'dpub-graphics', rules:A, html:'<section id=a role="doc-chapter" aria-label="Ch1">x</section><svg id=b role="graphics-document" aria-label="d"><g role="graphics-symbol" aria-label="s"></g></svg>', ax:['#a','#b']},
{name:'heading-no-level', rules:A, html:'<div id=a role=heading>Title</div>', ax:['#a']},
{name:'slider-no-valuenow', rules:A, html:'<div id=a role=slider tabindex=0 aria-label=v></div><div id=b role=scrollbar aria-label=s></div><div id=c role=separator tabindex=0 aria-label=sep></div><div id=d role=meter aria-label=m></div>', ax:['#a','#b','#c','#d']},
{name:'combobox-no-expanded', rules:A, html:'<input id=a role=combobox aria-label=c><div id=b role=combobox tabindex=0 aria-label=c></div>', ax:['#a','#b']},
{name:'checkbox-role-native', rules:A, html:'<input id=a type=checkbox role=switch aria-label=s><div id=b role=checkbox tabindex=0 aria-label=c></div><div id=c role=option aria-label=o></div>', ax:['#a','#b','#c']},
{name:'idref-partial', rules:A, html:'<button id=a aria-controls="p missing">x</button><div id=p></div><button id=b aria-controls="gone">x</button><button id=c aria-describedby="gone2">x</button>', ax:['#a','#b','#c']},
{name:'token-case', rules:A, html:'<button id=a aria-expanded="TRUE">x</button><button id=b aria-pressed="Mixed">x</button><a id=c href="/" aria-current="foo">x</a><input id=d aria-invalid="bogus" aria-label=d>', ax:['#a','#b','#c','#d']},
{name:'numbers', rules:A, html:'<div id=a role=slider tabindex=0 aria-label=s aria-valuenow="1e2" aria-valuemin="0" aria-valuemax="200"></div><div id=b role=heading aria-level="2.0">x</div><div id=c role=heading aria-level="0">x</div><li id=d aria-posinset=" 3" aria-setsize=5>x</li><div id=e role=heading aria-level="-1">x</div>', ax:['#a','#b','#c','#d','#e']},
{name:'relevant-etc', rules:A, html:'<div id=a aria-live=polite aria-relevant="additions removals">x</div><div id=b aria-live=polite aria-relevant="all text">x</div><div id=c aria-haspopup="menu">x</div><div id=d role=columnheader aria-sort="other">x</div>', ax:['#a','#b']},
{name:'prohibited-naming', rules:A, html:'<span id=a aria-label="star">*</span><i id=b class=fa aria-label="star"></i><p id=c aria-label="intro">x</p><code id=d aria-label="c">x</code><div id=e aria-label="div">x</div><b id=f aria-labelledby=e>x</b>', ax:['#a','#b','#c','#d','#e']},
{name:'prohibited-naming2', rules:A, html:'<div id=a role=presentation aria-label="x">t</div><del id=b aria-label=x>t</del><sup id=c aria-label=x>2</sup><caption>no</caption><label id=d aria-label="L">t</label><legend id=e aria-label=l>x</legend>', ax:['#a','#b','#c','#d','#e']},
{name:'global-on-none', rules:A, html:'<table role=none id=t><tr><td id=a aria-label="x">t</td></tr></table>', ax:['#t','#a']},
{name:'deprecated', rules:A, html:'<div id=a role=directory>x</div><button id=b aria-grabbed=false>x</button><div id=c aria-dropeffect=copy>x</div><button id=d aria-disabled=true aria-errormessage=e>x</button><span id=e>err</span>', ax:['#a','#b']},
];
