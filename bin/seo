#!/bin/zsh -eu

mydir=${0:a:h}

if [ ! -e config.yml ]; then
  echo run this script from the top-level of your repo
  exit 1
fi


function list-posts() {
  find . -mindepth 2 -name index.html |cut -f2- -d/ |sort -r |egrep -v ^_blogtini
}


for FILE in $(
  grep -nE '^\-\-\-' $(list-posts) |grep -F :1:--- |rev |cut -f3- -d: |rev
); do
  (
    set -x
    deno run -A  $mydir/../js/blogtini.js  $FILE
  )
done
