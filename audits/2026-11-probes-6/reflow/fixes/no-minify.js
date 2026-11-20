// Preloaded into the browser build: hands it an esbuild whose transform
// doesn't minify, so a profile of the bundle names its functions.
const Module = require('module');
const load = Module._load;
Module._load = function (request, parent, isMain) {
  const mod = load.apply(this, arguments);
  if (request !== 'esbuild') return mod;
  return {
    ...mod,
    transformSync: (src, opts) =>
      mod.transformSync(src, { ...opts, minify: false, minifyIdentifiers: false, minifySyntax: false, minifyWhitespace: false })
  };
};
