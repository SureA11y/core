const { four, page, close } = require('./h.js');
const ids = ['symbol-graphic-contrast','contrast-minimum'];
const G='color:#ccc';
const SR='position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
const cases = [
 ['stars + sr-only "4 of 5"', `<span style="${G}">★★★★☆<span style="${SR}">Rated 4 out of 5</span></span>`],
 ['stars + clip-path inset sr-only', `<span style="${G}">★★★☆☆<span style="position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden">3 of 5</span></span>`],
 ['stars + visible count "(12)" in child', `<span style="${G}">★★★★☆<span style="color:#000"> (12)</span></span>`],
 ['stars + aria-hidden visible count', `<span style="${G}">★★★★☆<span aria-hidden="true" style="color:#000">12</span></span>`],
 ['stars + text-indent -9999 child text', `<span style="${G}">★★★★☆<span style="display:inline-block;text-indent:-9999px;overflow:hidden;width:0">4 of 5</span></span>`],
 ['stars + opacity:0 child text', `<span style="${G}">★★★★☆<span style="opacity:0">4 of 5</span></span>`],
 ['stars + font-size:0 child text', `<span style="${G}">★★★★☆<span style="font-size:0">4 of 5</span></span>`],
 ['stars + closed details child', `<span style="${G}">★★★★☆<details><summary></summary>4 of 5</details></span>`],
 ['WooCommerce star-rating (::before stars + sr text)', `<style>.star-rating{position:relative;overflow:hidden;width:5.4em;height:1em;color:#ccc}.star-rating::before{content:"\\2605\\2605\\2605\\2605\\2605";position:absolute;top:0;left:0}.star-rating span{overflow:hidden;position:absolute;top:0;left:0;padding-top:1.5em}</style><div class="star-rating" role="img" aria-label="Rated 4.00 out of 5"><span style="width:80%">Rated <strong>4.00</strong> out of 5</span></div>`],
 ['stars + hidden attr child', `<span style="${G}">★★★★☆<span hidden>4 of 5</span></span>`],
 ['symbol arrow + content-visibility hidden child', `<span style="${G}">→<span style="content-visibility:hidden">Next</span></span>`],
 ['stars text node, digit count text node in child (gap?)', `<p style="color:#000"><span style="${G}">★★★★☆<span style="color:#000">12</span></span></p>`],
];
(async () => { for (const [l, b] of cases) await four(l, page(b), ids); await close(); })();
