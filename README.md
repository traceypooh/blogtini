# blogtini

## Slides / presentation
https://tracey.archive.org/dweb-2022
(tracey talk at https://dwebcamp.org)

Site live at:
- https://blogtini.com
- https://traceypooh.github.io/blogtini/

## Build (optional)
The [bin/build](bin/build) step ([bin/build.js](bin/build.js), needs only [deno](https://deno.com)) makes your site
better for everything that doesn't run JS: link previews, crawlers, RSS readers, and people w/o JS.
It writes:
- `index.xml` -- RSS feed of every post & page.  Also your sitemap and the client's content/search index.
- a tiny head line atop each post (title, image, and a style that shows the text even w/o JS)
- `comments/` JSON files

Our GitHub Action runs it for you on each push.  To run it locally, from the top of your site repo:
```sh
deno run --reload=https://blogtini.com --allow-read=. --allow-write=. --allow-env=GITHUB_REPOSITORY \
  --allow-import=blogtini.com:443,esm.ext.archive.org:443  https://blogtini.com/bin/build.js
```
or, if you have a blogtini checkout next to your site repo:
```sh
../blogtini/bin/build
```
(In this blogtini repo itself, it's just `./bin/build`.)

## Hooks
Whenever someone comments on your site, we run a small script (just the comments part of the build).

Thus, we suggest you use our "pre commit" and "post merge" `git` 'hooks' to automate the above "housekeeping".  You can set them up like this:
```sh
git config --local core.hooksPath bin/
```



## Best two website/blog setup options
### Blog source repository that uses markdown inside html markup files
- /2022/01/i-baked-a-pie/
- /2022/01/i-baked-a-pie/index.html
  - start with front matter
    - including `comment: <script src="../theme.js" type="module" charset="utf-8"></script>`
  - you can then have the nice url `https://example.com/2022/01/i-baked-a-pie/` where the included JS transforms the markdown to markup
- the [build](#build-optional) step lists every post in your `/index.xml`.  Or, w/o a build, either:
  - make/manage your own RSS `/index.xml` -- each `<item>` needs `<title>`, `<link>`, `<pubDate>`, and your
    markdown body in `<content:encoded>` (for summaries & search).  See the build's output for the full shape.
  - manage a `/sitemap.xml` that references each of your directory urls
- have `/theme.js` do an `import` of whatever theme you desire


## Releases
https://github.com/traceypooh/blogtini/releases

You can find the [Draft a new release] button at the top right, to enter notes for a release,
if you dont have the `gh` pkg/binary installed.

Commit the files like normal.

### make a release in one shot *with* `gh`:
to allow markdown headers for longer release notes, `;` for comment lines in commit message that drop
```sh
V=1.0.7 &&\
  which gh &&\
  git -c core.commentChar=';' tag -a ${V?} &&\
  git push --follow-tags &&\
  gh release create ${V?}  --verify-tag --title ${V?} --notes-from-tag
```

### make a release in one shot *without* `gh`:
to allow markdown headers for longer release notes, `;` for comment lines in commit message that drop
```sh
V=1.0.7 &&\
  git -c core.commentChar=';' tag -a ${V?} &&\
  git push --follow-tags
```


## Local development
### Option 1
`safari` is nice, you can run the site locally by just
- Developer Tools enabled
- `Develop` menu
  - check `Disable Cross-Origin Restrictions` during development
  - reload html page
  - uncheck `Disable Cross-Origin Restrictions` when done
- example: file:///Users/tracey/dev/blogtini/index.html

### Option 2
(any basic static file webserver will do):
```bash
( sleep 3; open http://localhost:8000 ) &
python3 -m http.server
```

You can force a re-parse of posts & pages by adding optional CGI arg `?recache=1`

## Example urls using GitHub or GitLab pages
If you use https://github.com or https://gitlab.com free 'Pages' integration, you will get urls you can like this:
- https://traceypooh.github.io/blogtini/
- https://traceypooh.gitlab.io/blogtini/

You can choose to use your own domain name (typically ~$20 USD/year) for a shorter/nicer url that points to the Pages deployment above (this is what https://blogtini.com does)


## To Do / Fixmes
- `git grep xxxxx` highest priorities
- `git grep xxxx` medium priorities
- `git grep xxx` priorities
- staticman (reduced down) via netlify edge functions xxx
- document `?contact` xxx
- document github action xxx
- dark mode search input not visible xxx
