module.exports = [
 ['first-letter id', `<style>.dc::first-letter{color:#ddd;font-size:48px;float:left}</style><p id=t class=dc style="color:#000;background:#fff;font:16px Arial">Once upon a time there was text.</p>`],
 ['first-letter noid', `<style>.dc::first-letter{color:#ddd}</style><div><p class=dc style="color:#000;background:#fff;font:16px Arial">Once upon a time there was text.</p></div>`],
 ['first-line', `<style>.dc::first-line{color:#ddd}</style><p id=t class=dc style="color:#000;background:#fff;font:16px Arial">Once upon a time there was text.</p>`],
 ['first-line both fail agree', `<style>.dc::first-line{color:#ccc}</style><p id=t class=dc style="color:#bbb;background:#fff;font:16px Arial">Once upon a time there was text.</p>`],
];
