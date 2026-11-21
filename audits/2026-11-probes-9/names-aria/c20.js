const R=['label-in-name'];
module.exports=[
{name:'cjk-contained', rules:R, html:'<button id=a aria-label="検索する">検索</button><button id=b aria-label="送信">検索</button>'},
{name:'cjk-no-spaces-prefix', rules:R, html:'<button id=a aria-label="商品を検索">検索</button>'},
{name:'rtl', rules:R, html:'<div dir=rtl lang=ar><button id=a aria-label="بحث في الموقع">بحث</button><button id=b aria-label="إرسال">بحث</button></div>'},
{name:'sr-only-extra', rules:R, html:'<style>.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}</style><a id=a href="/" aria-label="Read more about cats">Read more<span class=sr> about cats</span></a>'},
{name:'icon-text', rules:R, html:'<button id=a aria-label="Next page">Next <span aria-hidden=true>→</span></button><button id=b aria-label="Save">💾 Save</button>'},
{name:'shy', rules:R, html:'<button id=a aria-label="Accessibility">Acces&shy;sibility</button>'},
{name:'case-punct', rules:R, html:'<button id=a aria-label="SUBMIT">Submit!</button><button id=b aria-label="Save…">Save...</button>'},
{name:'text-transform', rules:R, html:'<button id=a aria-label="Send message" style="text-transform:uppercase">send</button>'},
{name:'split-word', rules:R, html:'<button id=a aria-label="Sign up">Sign<br>up</button><button id=b aria-label="Signup">Sign up</button>'},
{name:'math-symbol', rules:R, html:'<button id=a aria-label="Close">×</button><button id=b aria-label="Add">+</button><button id=c aria-label="Close dialog">X</button>'},
{name:'digits', rules:R, html:'<a id=a href="/" aria-label="Page 2 of 10">2</a><a id=b href="/" aria-label="Two">2</a>'},
{name:'fullwidth', rules:R, html:'<button id=a aria-label="ABC">ＡＢＣ</button>'},
{name:'label-for-input', rules:R, html:'<label for=i>First name</label><input id=i aria-label="Given name">'},
{name:'placeholder-visible', rules:R, html:'<input id=i placeholder="Search" aria-label="Find products">'},
{name:'visible-text-via-css-before', rules:R, head:'<style>#a::before{content:"Edit"}</style>', html:'<button id=a aria-label="Modify"></button>'},
{name:'hidden-visible-text-in-labelledby', rules:R, html:'<span id=l>Delete item</span><button id=a aria-labelledby=l>Remove</button>'},
];
