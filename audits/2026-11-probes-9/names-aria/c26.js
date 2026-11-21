const A=['autocomplete-valid'];
module.exports=[
{name:'honeypot-mailchimp', rules:A, html:'<form><label for=e>Email</label><input id=e type=email autocomplete=email><div style="position:absolute;left:-5000px" aria-hidden="true"><input id=hp type=text name="b_123" tabindex="-1" value="" autocomplete="nope"></div></form>'},
{name:'honeypot-aria-hidden-only', rules:A, html:'<div aria-hidden="true"><input id=hp type=text tabindex="-1" autocomplete="nope"></div>'},
{name:'honeypot-offscreen-only', rules:A, html:'<div style="position:absolute;left:-5000px"><input id=hp aria-label=x type=text autocomplete="nope"></div>'},
];
