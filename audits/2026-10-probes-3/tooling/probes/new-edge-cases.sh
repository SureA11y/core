#!/bin/sh
# Runs `surea11y-pack new` with edge-case arguments; prints exit code, first stderr line, and files written.
BIN=/Users/jorgefernandorumorososolana/dev/surea11y/core/bin/surea11y-pack.js
cd "$1" || exit 1
run() { label="$1"; shift; out=$(node "$BIN" "$@" 2>/tmp/sp_err); code=$?; n=$(printf "%s" "$out" | grep -c wrote); echo "[$label] exit=$code wrote=$n stderr=$(head -c 300 /tmp/sp_err | tr '\n' ' ')"; }
run no-args
run help --help
run new-help new --help
run new-no-folder new
run bad-kind new k1 --kind foo
run kind-missing-value new k2 --kind
run unknown-flag new k3 --frobnicate
run unknown-cmd frob
run spaces new "my pack"
run upper new MyPack
run traversal new ../escaped-pack
run abs new "$PWD/abs-pack"
run ns-invalid new n1 --namespace Acme
run ns-wcag new n2 --namespace wcag2x
run ns-dash new n3 --namespace a--b
run ns-core-id new n4 --namespace contrast
run name-scope-odd new s1 --name "@@weird!/x"
run name-inject new i1 --name "x';process.exit(1)//"
run title-quote new t1 --title "Bob's Policy"
run title-dq new t2 --title 'The "Best" Policy'
run title-tpl new t3 --title 'A `${process.exit(9)}` policy'
run title-backslash new t4 --title 'C:\new\path'
run title-newline new t5 --title "Line1
const x = 1;"
run winpath new 'sub\win-pack'
run name-dollar new d1 --name 'pkg$&x'
run title-dollar new d2 --title 'cost $& $1 $$'
run name-flag-eats-next new f1 --name --kind standard
mkdir -p nonempty && echo keep > nonempty/README.md && run nonempty new nonempty
touch afile && run folder-is-file new afile
