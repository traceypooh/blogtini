#!/bin/zsh -eux

mydir=${0:a:h}

cd $mydir/..

for FILE in $(
  grep -nE '^\-\-\-' $(find . -name '*index.html') |grep -F :1:--- |rev |cut -f3- -d: |rev
); do
  deno run -A  js/blogtini.js  $FILE
done
