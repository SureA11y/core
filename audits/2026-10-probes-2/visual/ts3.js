const R=['target-size-minimum'];
require('./h').run([
 ['hit area enlarged ::before, 8px gap -> each 24x24 disjoint', `<style>.h{all:unset;position:relative;display:inline-block;width:16px;height:16px;background:#ccc}.h::before{content:"";position:absolute;inset:-4px}</style><div style="display:flex;gap:8px;margin:40px"><button class=h>a</button><button class=h>b</button></div>`],
 ['same without pseudo (8px gap -> centers 24 apart) ', `<style>.h{all:unset;position:relative;display:inline-block;width:16px;height:16px;background:#ccc}</style><div style="display:flex;gap:8px;margin:40px"><button class=h>a</button><button class=h>b</button></div>`],
 ['icon btn 16 with ::before inset -4 next to 40px button 4px away', `<style>.h{all:unset;position:relative;display:inline-block;width:16px;height:16px;background:#ccc}.h::before{content:"";position:absolute;inset:-4px}</style><div style="display:flex;gap:4px;margin:40px;align-items:center"><button class=h>a</button><button style="all:unset;width:60px;height:40px;background:#ccc;margin-left:4px">Big</button></div>`],
],R);
