#!/bin/zsh -x

# ensure all Raleway and sourcesanspro fonts load `.woff2` files locally *too*

CSSDIR=../../themes/hugo-future-imperfect-slim/assets/css/


for i in $(egrep -o 'https://[^\)]+' $CSSDIR/fonts.css); do
  f=$(basename "$i")
  [ -e $f ]  ||  wget $i
done


cp  $CSSDIR/fonts.css  fonts.css
for i in  https://fonts.gstatic.com/s/raleway/v14/  https://fonts.gstatic.com/s/sourcesanspro/v13/
  do perl -i -pe "s|$i|/fonts/|" fonts.css
done

# later pulled all the fontawesome *non* .woff2 files (huge, slow, mostly just IE now..)
# and moved `webfonts/*` to `fonts/`

# NOTE: `droid-sans.ttf` got copied in from a poohbot.com star wars page and not presently used
