const { runa11yCoreOnHtml } = require('/home/user/core-r9/src/testing.js');
const html=`<!doctype html><html lang="ja"><head><title>t</title></head><body><main>
<button id=ja aria-label="商品を検索">検索</button>
<a id=zh lang=zh href="/cart" aria-label="查看购物车">购物车</a>
<button id=ja2 aria-label="カートに追加する">カートに追加</button>
</main></body></html>`;
const r=runa11yCoreOnHtml(html,{runOnly:['label-in-name'],entryPointParity:false}).checksResults[0];
console.log(r.outcome);for(const o of r.occurrences) console.log(o.selector,o.data.details.reasonCode,JSON.stringify(o.data.details.tokenized),'|',o.summary);
