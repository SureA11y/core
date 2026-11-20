#!/bin/bash
# Point pack-rgaa's and pack-raweb's @surea11y/core at the core in $1.
set -eu
TARGET="${1:?core path}"
FAMILY=/tmp/surea11y-audit/family
for r in pack-rgaa pack-raweb; do
  ln -sfn "$TARGET" "$FAMILY/$r/node_modules/@surea11y/core"
done
