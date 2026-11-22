const { four, page, close } = require('./h.js');
const ids=['contrast-minimum'];
const W=`<style>.star-rating{float:right;overflow:hidden;position:relative;height:1em;line-height:1;font-size:1em;width:5.4em;font-family:sans-serif;color:#ccc}.star-rating::before{content:"\\2605\\2605\\2605\\2605\\2605";float:left;top:0;left:0;position:absolute}.star-rating span{overflow:hidden;float:left;top:0;left:0;position:absolute;padding-top:1.5em}.star-rating span::before{content:"\\2605\\2605\\2605\\2605\\2605";top:0;position:absolute;left:0;color:#e2a500}</style>`;
const cases=[
 ['closed details body text', '<details><summary>More info</summary><p style="color:#aaa">Hidden body</p></details>'],
 ['content-visibility:hidden', '<div style="content-visibility:hidden;color:#aaa">Hidden text</div>'],
 ['WooCommerce .star-rating markup', W+'<div class="star-rating" role="img" aria-label="Rated 4.00 out of 5"><span style="width:80%">Rated <strong class="rating">4.00</strong> out of 5</span></div>'],
];
(async()=>{ for(const [l,b] of cases) await four(l,page(b),ids,{},['v117','main','br']); await close();})();
