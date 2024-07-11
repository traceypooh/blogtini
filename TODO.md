
xxx socnet icons hover should blue color


add storj, codepen, etc.

xxx add either:
```html
<meta property="og:type" content="website">
<meta property="og:type" content="article">
```

xxx move <style> to bottom to avoid leaks:    fgrep '<style>' $(finddot html)
xxx autogen rss
xxx mobile size tables

Your posts or directories of posts, should ideally natural sort in time order, examples:
  2022-11-03-a-birthday.md
  2020-10-31-halloween-fun.md

  2022/11/03/a-birthday.md
  2020/10/31/halloween-fun.md


goals: 0 config/0 build; pull in info from multiple blogs; parents can do it

wget -qO- 'https://api.github.com/repos/traceypooh/blogtini/git/trees/main?recursive=true'

tech terminal try-out:
  wget https://raw.githubusercontent.com/traceypooh/test1/main/index.html
  wget https://raw.githubusercontent.com/traceypooh/test1/main/README.md
  [edit 1st real post in README.md]
  [open in Safari; Developer Menu; check `Disable Cross-Origin Restrictions` during development
  open index.html
  [Developer Menu; uncheck `Disable Cross-Origin Restrictions` when done


existing GH repo try-out: /?preview=github/repo-name    (we'll use GH API to find .md files)
existing WP try-out: /?preview=URL/feed (atom or RSS)

could host entire thing in codepen, etc.?!

xxx go to blogtini.com -> enter in your username and repo and show them how it looks!

nav search box that prefills google search site:xxx AND ..


xxx gist: either: public GH repo w/ dir of .md files *or* WP/private and parse atom feed..
xxx JS/CSS versioning..

github.com cookie: dotcom_user
https://jekyll.github.io/github-metadata/site.github/

minimum:
setup GH account
visit: https://github.com/traceypooh/blogtini
press [Y Fork] button in upper right
(fork to your account)
hit [⚙️ Settings] in upper right
[🗂️ Pages] left menu
enable GH actions xxx

[pipeline will start..]

wait a few minutes, visit your site at:
https://[YOUR-GITHUB-USERNAME].github.io/blogtini/?setup


# parse username from location.host/name ;-)


# make a new file, 'Name your file....' like YYYY-MM-DD-first-test-post.md
https://github.com/xxx/blogtini/new/main/posts
---
title: first test post
date: xxx
tags: blogging, testing, blogtini
---
# scroll down, hit [Commit new file]

https://github.com/xxx/blogtini/edit/main/posts/2022-02-02.md
[<> Code] upper left tab
[📁  posts]
click 2022-02-02.md
upper-mid right [✏️] (hover shows "Edit this file")

change, to taste:
title:
date:
tags:

(scroll down, find [Commit changes] button and press)

https://github.com/xxx/blogtini/edit/main/config.yml
change, to taste:
`title`
`user`
(scroll down, find [Commit changes] button and press)
---

PAT / tokens for ~30/hr => ~5k/hr rate limits
- https://github.com/settings/tokens
- https://api.github.com/repos/traceypooh/blogtini/git/trees/main?recursive=true&token=TOKEN
- https://raw.githubusercontent.com/traceypooh/blogtini/main/README.md?token=TOKEN


[layout]
posts
img

pages
css
js


- 15y, 112 posts, 500k txt, 60k gzip (twitter tp cold load 2.7MB)
- xxx SEO!?
- xxx presently assumes posts list has filenames that are reverse sorted by date/time YYYY-MM-DD-..
- import xxx from 'https://esm.archive.org/blogtini'
- xxx can still use site w/o .md copied into webroot via api
  https://api.github.com/repos/traceypooh/blogtini/contents look for type: dir and dir with 20\d\d...md

- fill out nav & sidebar
- parse 10 most recent posts, fill out main page
- parse front-matter from remaining posts for tag cloud, category list (fills-in later) (cache)
  - consider range requests for ~just front-matter retrieval & parsing?
  - GH pages serves over http2 at least

- put into local storage (cache <= 24h): each post's: title, date, tags, cats, img
  - ... but we only need to parse most recent 2-10 posts from each subscriber
- top page: show most recent 10 posts' summaries
  - page 2: posts 10..20, etc.
- open followers' websites /posts dir to parse their 2-10 most recent .md, eg:
  - https://api.github.com/repos/ajaquith/securitymetrics/contents/source/_posts
  - https://hunterleebrown.com/blog/feed
  - https://blog.archive.org/feed/
  - https://hugo-fresh.vercel.app/blog/index.xml
  - https://feeds.feedburner.com/securitymetrics-org

  xxx posts w/o dates examples
  - eg: https://api.github.com/repos/stefma/hugo-fresh/contents/exampleSite/content/blog
        https://github.com/StefMa/hugo-fresh/tree/master/exampleSite/content/blog
        https://hugo-fresh.vercel.app/blog/index.xml   ** BUT! :) **


jekyll (GitHub Pages) plugins:
  https://pages.github.com/versions/
  https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll#plugins

   could be useful vv, but not in accept list ^^ :(
  https://github.com/jekyll/jekyll-sitemap
  https://github.com/jekyll/jekyll-feed

  https://jekyll.github.io/github-metadata/site.github/
