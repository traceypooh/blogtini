#!/bin/zsh -eux

mydir=${0:a:h}

if [ ! -e config.yml ]; then
  echo run this script from the top-level of your repo
  exit 1
fi

for FILE in $(
  grep -nE '^\-\-\-' $(find . -name '*index.html') |grep -F :1:--- |rev |cut -f3- -d: |rev
); do
  deno run -A  $mydir/../js/blogtini.js  $FILE
done
