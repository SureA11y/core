const R=['region'];
module.exports=[
{name:'skip-link-outside', rules:R, html:'<a href="#m" class=skip>Skip to content</a><header>h</header><main id=m>x</main><footer>f</footer>'},
{name:'dialog-cookie', rules:R, html:'<header>h</header><main>x</main><div role=dialog aria-label="Cookies"><p>We use cookies</p><button>OK</button></div><dialog open aria-label="Promo"><p>Sale</p></dialog>'},
{name:'alert-toast', rules:R, html:'<header>h</header><main>x</main><div role=alert>Saved</div><div role=status>3 items</div><div aria-live=polite>Updated</div>'},
{name:'decorative-outside', rules:R, html:'<header>h</header><main>x</main><img src=x.png alt=""><div aria-hidden=true>bg</div><hr><br>'},
{name:'iframe-outside', rules:R, html:'<header>h</header><main>x</main><iframe title="chat" srcdoc="hi"></iframe>'},
{name:'popover-open-menu', rules:R, html:'<header>h</header><main>x</main><div popover id=p>Popover text</div><script>document.getElementById("p").showPopover()</script>'},
{name:'tooltip-outside', rules:R, html:'<header>h</header><main><button aria-describedby=t>i</button></main><div role=tooltip id=t>Tip text</div>'},
{name:'sr-only-outside', rules:R, html:'<header>h</header><main>x</main><div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Page loaded</div>'},
];
