const R=['aria-hidden-body','aria-hidden-focus'];
module.exports=[
{name:'html-aria-hidden', rules:R, html:'<!doctype html><html lang=en aria-hidden="true"><head><title>T</title></head><body><main><a href="/">x</a></main></body></html>', ax:['a']},
{name:'body-aria-hidden-false', rules:R, html:'<!doctype html><html lang=en><head><title>T</title></head><body aria-hidden="false"><main>x</main></body></html>'},
{name:'body-aria-hidden-TRUE', rules:R, html:'<!doctype html><html lang=en><head><title>T</title></head><body aria-hidden="TRUE"><main><a href="/">x</a></main></body></html>', ax:['a']},
];
