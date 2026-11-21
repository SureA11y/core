// canvas with fallback content: two rules disagree about what it exposes
const { runAll } = require('./harness');
runAll([{ id:'canvas-fallback', html:`<canvas data-t="c" width="10" height="10"><p data-t="p">Chart of sales</p></canvas><canvas data-t="c3" width="10" height="10">Plain fallback</canvas>` }], ['img-alt-decorative','canvas-text-alternative-present','canvas-text-alternative-quality'], {}, true);
