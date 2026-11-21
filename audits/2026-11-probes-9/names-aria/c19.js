const R=['identical-iframes-same-purpose','identical-links-same-purpose','iframe-title-unique'];
module.exports=[
{name:'iframe-case', rules:R, html:'<main><iframe title="Product video" src="https://www.youtube.com/embed/aaa"></iframe><iframe title="product Video" src="https://www.youtube.com/embed/bbb"></iframe></main>'},
{name:'iframe-same-case', rules:R, html:'<main><iframe title="Product video" src="https://www.youtube.com/embed/aaa"></iframe><iframe title="Product video" src="https://www.youtube.com/embed/bbb"></iframe></main>'},
{name:'links-case', rules:R, html:'<main><a href="/a">Read more</a> <a href="/b">read more</a></main>'},
{name:'links-same', rules:R, html:'<main><a href="/a">Read more</a> <a href="/b">Read more</a></main>'},
];
