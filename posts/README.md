```bash
IFS=$'\n'; for i in $(egrep ^date: $(find ../content/post/20* -name '*.md') |perl -pe 's/:date: / /'); do f=$(echo "$i"|cut -f1 -d' '); ymd=$(echo "$i"|cut -f2 -d' '); j=$(echo "$f"|perl -pe "s=^.*/20\d\d/\d\d=$ymd=");  ln -s "$f" "$j"; done; unset IFS
```
