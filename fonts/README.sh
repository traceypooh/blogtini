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
