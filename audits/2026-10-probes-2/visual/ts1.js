const R=['target-size-minimum'];
const b='style="all:unset;display:inline-block;width:16px;height:16px;background:#ccc"';
require('./h').run([
 ['two 16px adjacent', `<div><button ${b}>a</button><button ${b}>b</button></div>`],
 ['two 16px centers 24 apart', `<div style="display:flex;gap:8px"><button ${b}>a</button><button ${b}>b</button></div>`],
 ['16px centers 23.9 apart', `<div style="display:flex;gap:7.9px"><button ${b}>a</button><button ${b}>b</button></div>`],
 ['exact 24 adjacent', `<div style="display:flex"><button style="all:unset;width:24px;height:24px;background:#ccc">a</button><button style="all:unset;width:24px;height:24px;background:#ccc">b</button></div>`],
 ['24 via 12pt? 23.99 subpixel', `<div style="display:flex"><button style="all:unset;width:23.99px;height:24px;background:#ccc">a</button><button style="all:unset;width:24px;height:24px;background:#ccc">b</button></div>`],
 ['hit area enlarged ::before', `<style>.h{all:unset;position:relative;display:inline-block;width:16px;height:16px;background:#ccc}.h::before{content:"";position:absolute;inset:-4px}</style><div style="display:flex;gap:4px"><button class=h>a</button><button class=h>b</button></div>`],
 ['disabled small adjacent', `<div><button disabled ${b}>a</button><button disabled ${b}>b</button></div>`],
 ['small adjacent, one hidden under overlay', `<div style="position:relative"><button ${b}>a</button><button ${b}>b</button><div style="position:absolute;inset:0;background:#fff"></div></div>`],
],R);
