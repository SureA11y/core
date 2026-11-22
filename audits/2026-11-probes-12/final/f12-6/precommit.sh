#!/bin/bash
# run in /home/user/r12-speed with working tree == index (stash --keep-index)
cd /home/user/r12-speed
npm run --silent format:check >/dev/null 2>&1 && echo format-ok || echo FORMAT-FAIL
npx eslint . 2>&1 | grep -q " error " && echo LINT-FAIL || echo lint-ok
npm run --silent validate:rules >/dev/null 2>&1 && echo rules-ok || echo RULES-FAIL
for f in "$@"; do node scripts/validate-rule.js $f >/dev/null 2>&1 && echo "rule-ok $f" || echo "RULE-FAIL $f"; done
npm run --silent i18n:check >/dev/null 2>&1 && echo i18n-ok || echo I18N-FAIL
