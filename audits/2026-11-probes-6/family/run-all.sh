#!/bin/bash
# Run every step of each published package's test script on its own, against
# whatever core link-all.sh linked, skipping lifecycle hooks (they download
# browsers the network blocks). Logs under logs/<tag>/, a summary per package.
S=/tmp/surea11y-audit
TAG="${1:?tag}"
mkdir -p "$S/logs/$TAG"
run_pkg() {
  local r="$1"
  cd "$S/family/$r" || return
  local steps
  steps=$(node -e "console.log(require('./package.json').scripts.test.split('&&').map(s=>s.trim()).join('\n'))")
  local i=0
  : > "$S/logs/$TAG/summary-$r.txt"
  while IFS= read -r step; do
    i=$((i+1))
    CI=1 CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium \
      PUPPETEER_EXECUTABLE_PATH=$S/chrome-nosandbox.sh PLAYWRIGHT_BROWSERS_PATH=$S/pw-browsers \
      timeout 900 bash -c "$(echo "$step" | sed 's/^npm run /npm run --ignore-scripts /')" > "$S/logs/$TAG/$r-$i.log" 2>&1
    local code=$?
    local counts
    counts=$(grep -hE "^# (pass|fail) |^ℹ (pass|fail) |Tests:|passing|failing" "$S/logs/$TAG/$r-$i.log" | tail -3 | tr '\n' ' ')
    echo "$r [$i] exit=$code  $step  $counts" >> "$S/logs/$TAG/summary-$r.txt"
  done <<< "$steps"
}
export -f run_pkg; export S TAG
printf '%s\n' ${PKGS:-binding-base cli test-matchers playwright puppeteer selenium cypress webdriverio pack-rgaa pack-raweb pack-en301549 pack-wai-aria} \
  | xargs -P 4 -I{} bash -c 'run_pkg {}'
cat "$S"/logs/"$TAG"/summary-*.txt
