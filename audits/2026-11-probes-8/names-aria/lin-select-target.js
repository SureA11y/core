// label-in-name: an aria-labelledby target that IS a drop-down <select> reads every option as visible label
const { runAll } = require('./harness');
runAll([
 { id:'lb-to-select', html:`<select id="s" aria-label="Sort"><option>Price</option><option selected>Rating</option></select><button data-t="b" aria-labelledby="s">Rating</button>` },
 { id:'lb-to-select-first', html:`<select id="s" aria-label="Sort"><option>Price</option><option>Rating</option></select><button data-t="b" aria-labelledby="s"></button>` },
 { id:'lb-to-textarea', html:`<textarea id="t" aria-label="N">Hello there</textarea><button data-t="b" aria-labelledby="t"></button>` },
], ['label-in-name']);
