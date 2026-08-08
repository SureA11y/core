# Security policy

## Scope

surea11y is a library: it reads a DOM tree and computed styles and returns structured findings. It does not execute, evaluate, or transmit any content from the page it scans, and it makes no network requests of its own. The main things worth a security-conscious look:

- **Untrusted HTML/DOM as input.** By design, this engine is meant to be pointed at arbitrary pages, including ones you don't control. Rule implementations read attributes, text content, and computed styles — if you find a case where scanning a page causes anything beyond reading that data (e.g. unexpected code execution, prototype pollution, unbounded resource consumption), that's a real security issue, not just a correctness one.
- **The generated `src/core.js` bundle.** Every rule's `runInPage(ctx)` is serialized via `fn.toString()` and re-evaluated as source text in the page/browser context (see [`docs/RULE_AUTHORING.md`](./docs/RULE_AUTHORING.md) and [`docs/INTEGRATION.md`](./docs/INTEGRATION.md)). This is an intentional part of the design (it's what makes `runa11yCoreInPage` work with `page.evaluate`), but it means the bundle's own integrity matters — verify you're installing from the real npm package / a trusted build.
- **Dependencies.** This package has zero runtime dependencies — its `dependencies` field is empty, so installing it adds nothing else to your tree, and `src/core.js` is fully self-contained after build and never loads anything else at require-time. The engine reads a DOM you supply; it never constructs one, which is why no DOM implementation is installed on your behalf. As of 1.4.0 the CLI — the one part that does need to parse HTML into a DOM, and therefore needs `jsdom` — ships as the separate [`@surea11y/cli`](https://github.com/SureA11y/cli) package, so that dependency is only ever installed by people who install the CLI. No other rule engine is a dependency of this package, dev or otherwise; internal dev-tooling comparisons against other engines are handled entirely outside this repository, and only the `files` allowlist in `package.json` ships in the published package.

## Reporting a vulnerability

If you find a security issue, please report it privately rather than opening a public issue — email rumoroso.a11y@gmail.com with a description and, if possible, a minimal reproduction.

You can expect an acknowledgement within five working days. This is a solo-maintained project, so please allow 90 days from that acknowledgement before public disclosure, and get in touch again if you haven't heard back.

There is no bug bounty program.

## Supported versions

Only the latest published version on npm receives security fixes. See [`CHANGELOG.md`](./CHANGELOG.md) for release history.
