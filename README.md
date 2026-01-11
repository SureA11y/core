# a11yCore-core

Small DOM based accessibility rules engine.

Current rules:
- a11yCore-img-alt
- a11yCore-form-label
- manual-review

## Install (local)

From this folder:

```bash
npm install
```

## CLI usage

Run on a local HTML file:

```bash
npx a11yCore path/to/file.html
```

Or from this folder:

```bash
node bin/a11yCore.js path/to/file.html
```

The CLI prints a JSON summary of rule outcomes.
