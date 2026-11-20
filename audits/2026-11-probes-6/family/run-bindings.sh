#!/bin/bash
# The browser bindings, one test file at a time, so a file that waits on a
# browser this container lacks (Firefox, WebKit, a matching chromedriver)
# can't hide the others' results. Logs under logs/<tag>/<binding>-<file>.log.
S=/tmp/surea11y-audit
TAG="${1:?tag}"
mkdir -p "$S/logs/$TAG"
for r in playwright puppeteer selenium; do
  (
    cd "$S/family/$r" || exit
    for f in tests/*.test.js; do
      name=$(basename "$f" .test.js)
      CI=1 PUPPETEER_EXECUTABLE_PATH="$S/chrome-nosandbox.sh" PLAYWRIGHT_BROWSERS_PATH="$S/pw-browsers" \
        timeout 300 node --test "$f" > "$S/logs/$TAG/$r-file-$name.log" 2>&1
      echo "$r $name exit=$? ok=$(grep -c '^ok ' "$S/logs/$TAG/$r-file-$name.log") notok=$(grep -c '^not ok' "$S/logs/$TAG/$r-file-$name.log")"
    done
  ) &
done
wait
