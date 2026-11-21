const R=['td-has-header','table-fake-caption','empty-table-header','table-th-has-data-cells','deprecated-elements-not-used','scope-attr-valid'];
module.exports=[
{name:'email-layout', rules:R, html:'<table width="100%" cellpadding=0 cellspacing=0 border=0 bgcolor="#eee"><tr><td align=center><table width=600><tr><td><img src=logo.png alt="ACME" width=120></td><td align=right><a href="/v">View online</a></td></tr><tr><td colspan=2><h1>Hello</h1><p>Your order shipped.</p></td></tr><tr><td colspan=2><font size=1>Unsubscribe</font></td></tr></table></td></tr></table>'},
{name:'data-no-th-numbers', rules:R, html:'<table><tr><td>Jan</td><td>100</td><td>200</td></tr><tr><td>Feb</td><td>150</td><td>250</td></tr><tr><td>Mar</td><td>120</td><td>210</td></tr></table>'},
{name:'nested-table-headers', rules:R, html:'<table><tr><th>Outer</th></tr><tr><td><table><tr><td>inner a</td><td>inner b</td></tr><tr><td>c</td><td>d</td></tr></table></td></tr></table>'},
{name:'th-in-tfoot', rules:R, html:'<table><thead><tr><th>Item</th><th>Price</th></tr></thead><tbody><tr><td>A</td><td>1</td></tr></tbody><tfoot><tr><th>Total</th><td>1</td></tr></tfoot></table>'},
{name:'th-with-td-role-columnheader', rules:R, html:'<table><tr><td role=columnheader>Name</td><td role=columnheader>Age</td></tr><tr><td>Bob</td><td>3</td></tr></table>'},
{name:'table-aria-hidden-th', rules:R, html:'<table><tr><th><span class=sr>Select</span></th><th>Name</th></tr><tr><td><input type=checkbox aria-label=s></td><td>Bob</td></tr></table>'},
];
