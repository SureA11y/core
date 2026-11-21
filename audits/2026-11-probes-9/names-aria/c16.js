const T=['td-has-header','table-headers-attr-valid','table-th-has-data-cells','empty-table-header','scope-attr-valid','table-duplicate-name','table-fake-caption'];
module.exports=[
{name:'headers-to-td', rules:T, html:'<table><tr><th id=h1>Name</th><th id=h2>Age</th></tr><tr><td id=d1>Bob</td><td headers="h2 d1">3</td></tr></table>'},
{name:'headers-other-table', rules:T, html:'<table><tr><th id=x>X</th></tr></table><table><tr><th>Y</th></tr><tr><td headers=x>1</td></tr></table>'},
{name:'headers-self', rules:T, html:'<table><tr><th>Y</th></tr><tr><td id=s headers=s>1</td></tr></table>'},
{name:'th-no-data-thead', rules:T, html:'<table><thead><tr><th>A</th><th>B</th><th>C</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>'},
{name:'th-colspan', rules:T, html:'<table><tr><th colspan=2>AB</th></tr><tr><td>1</td><td>2</td></tr></table>'},
{name:'th-rowheader', rules:T, html:'<table><tr><th>Q</th><td>1</td></tr><tr><th>R</th><td>2</td></tr></table>'},
{name:'th-empty', rules:T, html:'<table><tr><th></th><th>Jan</th></tr><tr><th>Sales</th><td>1</td></tr></table>'},
{name:'th-scope-bogus', rules:T, html:'<table><tr><th scope="column">A</th><th scope=ROW>B</th><td scope=col>c</td></tr><tr><td>1</td><td>2</td><td>3</td></tr></table>'},
{name:'caption-same-summary', rules:T, html:'<table summary="Prices"><caption>Prices</caption><tr><th>A</th></tr><tr><td>1</td></tr></table>'},
{name:'caption-fake', rules:T, html:'<table><tr><td colspan=3><b>Prices 2024</b></td></tr><tr><th>A</th><th>B</th><th>C</th></tr><tr><td>1</td><td>2</td><td>3</td></tr></table>'},
{name:'layout-table-presentation', rules:T, html:'<table role=presentation><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>'},
{name:'aria-table-no-header', rules:T, html:'<div role=table><div role=row><div role=cell>1</div><div role=cell>2</div></div><div role=row><div role=cell>3</div><div role=cell>4</div></div></div>'},
{name:'grid-cells', rules:T, html:'<table role=grid><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>'},
{name:'td-in-th-only-col-thead-rowspan', rules:T, html:'<table><tr><th rowspan=2>A</th><th>B</th></tr><tr><td>2</td></tr><tr><td>1</td><td>3</td></tr></table>'},
{name:'th-td-aria-hidden', rules:T, html:'<table><tr><th>A</th><th aria-hidden=true>B</th></tr><tr><td>1</td><td>2</td></tr></table>'},
{name:'th-role-cell', rules:T, html:'<table><tr><th role=cell>A</th></tr><tr><td>1</td></tr></table>'},
];
