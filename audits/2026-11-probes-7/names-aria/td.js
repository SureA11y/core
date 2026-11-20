const {run,show}=require('./jsd');
const R=['td-has-header','table-th-has-data-cells','table-headers-attr-valid','empty-table-header','scope-attr-valid','table-fake-caption','table-duplicate-name'];
const cases=[
 ['2x2-th-row', '<main><table><tr><th>Item</th><th>Price</th></tr><tr><td>Tea</td><td>2</td></tr></table></main>'],
 ['2x2-noth', '<main><table><tr><td>Item</td><td>Price</td></tr><tr><td>Tea</td><td>2</td></tr></table></main>'],
 ['2x2-th-col', '<main><table><tr><th>Mon</th><td>9-5</td></tr><tr><th>Tue</th><td>9-5</td></tr></table></main>'],
 ['3x2-th-row-thead', '<main><table><thead><tr><th>Item</th><th>Price</th></tr></thead><tbody><tr><td>Tea</td><td>2</td></tr><tr><td>Cake</td><td>3</td></tr></tbody></table></main>'],
 ['layout-role-pres', '<main><table role=presentation><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table></main>'],
 ['layout-noattrs-images', '<main><table><tr><td><img src=a.png alt="Logo"></td><td><a href=/>Home</a></td></tr><tr><td><p>Hello</p></td><td><p>World</p></td></tr></table></main>'],
 ['th-row-plus-rowheader-mixed', '<main><table><tr><td></td><th>A</th><th>B</th></tr><tr><th>x</th><td>1</td><td>2</td></tr><tr><th>y</th><td>3</td><td>4</td></tr></table></main>'],
 ['th-row-colspan', '<main><table><tr><th colspan=2>Prices</th></tr><tr><td>Tea</td><td>2</td></tr></table></main>'],
 ['td-scope-col', '<main><table><tr><td scope=col>Item</td><td scope=col>Price</td></tr><tr><td>Tea</td><td>2</td></tr></table></main>'],
 ['role-columnheader', '<main><table><tr><td role=columnheader>Item</td><td role=columnheader>Price</td></tr><tr><td>Tea</td><td>2</td></tr></table></main>'],
 ['headers-attr', '<main><table><tr><td id=h1>Item</td><td id=h2>Price</td></tr><tr><td headers=h1>Tea</td><td headers=h2>2</td></tr></table></main>'],
 ['th-first-row-empty-corner', '<main><table><tr><th></th><th>Q1</th></tr><tr><th>Sales</th><td>5</td></tr></table></main>'],
 ['form-layout-table', '<main><form><table><tr><td><label for=a>Name</label></td><td><input id=a></td></tr><tr><td><label for=b>Mail</label></td><td><input id=b></td></tr></table></form></main>'],
 ['nested-table', '<main><table><tr><th>A</th><th>B</th></tr><tr><td><table><tr><td>x</td><td>y</td></tr><tr><td>z</td><td>w</td></tr></table></td><td>2</td></tr></table></main>'],
 ['td-empty-cells', '<main><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td></td></tr></table></main>'],
 ['rowspan-th', '<main><table><tr><th rowspan=2>Group</th><td>a</td></tr><tr><td>b</td></tr></table></main>'],
 ['caption-only', '<main><table><caption>Hours</caption><tr><td>Mon</td><td>9-5</td></tr><tr><td>Tue</td><td>9-5</td></tr></table></main>'],
 ['grid-role', '<main><table role=grid aria-label=g><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table></main>'],
];
(async()=>{ for (const [id,h,ex] of cases) console.log(show(id, await run(h,R,ex||{}))); })();
