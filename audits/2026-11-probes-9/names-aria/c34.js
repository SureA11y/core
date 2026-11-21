const R=['form-control-label-quality','form-control-programmatic-label-quality','link-name-quality','link-name-quality-link-only','label-title-only','control-name-title-only'];
module.exports=[
{name:'label-quality', rules:R, html:'<main><label for=a>*</label><input id=a><label for=b>Field</label><input id=b><label for=c>Label</label><input id=c><label for=d>input_email</label><input id=d><label for=e>:</label><input id=e><input id=f aria-label="text"></main>'},
{name:'link-quality', rules:R, html:'<main><a href="/a">click here</a> <a href="/b">More</a> <a href="https://example.com/x">https://example.com/x</a> <a href="/c">here</a> <a href="/d">Learn more about pricing</a> <a href="/e">ここをクリック</a> <a href="/f">Cliquez ici</a> <a href="/g">Read more<span class=x> about cats</span></a></main>'},
{name:'link-quality-context', rules:R, html:'<main><p>To see pricing, <a href="/b">click here</a>.</p><ul><li>Our plans <a href="/c">More</a></li></ul><table><tr><th>Plan</th><td><a href="/d">Details</a></td></tr></table></main>'},
{name:'title-only', rules:R, html:'<main><input id=a title="Email"><select id=b title="Size"><option>S</option></select><button id=c title="Close"></button><a id=d href="/" title="Home"></a><input id=e title="Email" placeholder="you@x.com"></main>'},
];
