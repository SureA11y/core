const R=['target-size-minimum'];
const H=`<style>.h{all:unset;position:relative;display:inline-block;width:16px;height:16px;background:#ccc}.h::before{content:"";position:absolute;inset:-4px}.n{all:unset;display:inline-block;width:24px;height:24px;background:#999}</style>`;
require('./h').run([
 ['16px btn w/ 24x24 ::before hit area, 4px from a 24px button', H+`<div style="display:flex;gap:4px;margin:40px;align-items:center"><button class=h>a</button><button class=n>b</button></div>`],
 ['toolbar of 3 such icon buttons, 8px gap', H+`<div style="display:flex;gap:8px;margin:40px"><button class=h>a</button><button class=h>b</button><button class=h>c</button></div>`],
],R);
