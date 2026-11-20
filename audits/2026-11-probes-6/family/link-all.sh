#!/bin/bash
# Point every @surea11y/core in the family's packages (nested copies too) at
# the core in $1, and @surea11y/binding-base and @surea11y/pack-rgaa at the
# local clones. A real directory in the way is moved aside, never deleted.
set -eu
TARGET="${1:?core path}"
FAMILY=/tmp/surea11y-audit/family
link() {
  local at="$1" to="$2"
  if [ -d "$at" ] && [ ! -L "$at" ]; then mv "$at" "$at.moved-aside.$$"; fi
  ln -sfn "$to" "$at"
}
for r in binding-base cli test-matchers playwright puppeteer selenium cypress webdriverio pack-rgaa pack-raweb pack-en301549 pack-wai-aria; do
  base="$FAMILY/$r/node_modules/@surea11y"
  [ -d "$base" ] || continue
  while IFS= read -r dir; do link "$dir" "$TARGET"; done < <(find "$FAMILY/$r/node_modules" -path "*/@surea11y/core" -not -path "*moved-aside*" 2>/dev/null)
  [ -e "$base/binding-base" ] && [ "$r" != binding-base ] && link "$base/binding-base" "$FAMILY/binding-base"
  [ -e "$base/pack-rgaa" ] && [ "$r" != pack-rgaa ] && link "$base/pack-rgaa" "$FAMILY/pack-rgaa"
done
echo "linked to $TARGET"
