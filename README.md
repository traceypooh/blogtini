# blogtini

## Slides / presentation
https://traceypooh.github.io/slides/dweb-2022
(tracey talk at https://dwebcamp.org)

Site live at:
- https://blogtini.com
- https://traceypooh.github.io/blogtini/

## Hooks
- Whenever you create or delete a post, we want your `sitemap` updated.
- Whenever someone comments on your site, we run a small script.

Thus, we suggest you use our "pre commit" and "post merge" `git` 'hooks' to automate the above "housekeeping".  You can set them up like this:
```sh
git config --local core.hooksPath bin/
```

### RSS
If you'd like a RSS `index.xml` file generated with the [bin/sitemap](bin/sitemap) script,
during each "pre commit" hook (above), you'll need to have the
[yq](https://github.com/mikefarah/yq#install) script installed on your machine.



## Best two website/blog setup options
### Blog source repository that uses markdown inside html markup files
- /2022/01/i-baked-a-pie/
- /2022/01/i-baked-a-pie/index.html
  - start with front matter
    - including `comment: <script src="../theme.js" type="module" charset="utf-8"></script>`
  - you can then have the nice url `https://example.com/2022/01/i-baked-a-pie/` where the included JS transforms the markdown to markup
- your `/sitemap.xml` can reference each of your directory urls
- manage your `/sitemap.xml` manually or run the `/bin/sitemap` script any time your create or delete a post.  The `/bin/sitemap` script can be found on the blogtini website.
- have `/theme.js` do an `import` of whatever theme you desire


### Blog source repository that uses markdown files
- /2022/01/i-baked-a-pie.md
  - `jekyll` will automatically transform your markdown to markup and to an url like `https://example.com/2022/01/i-baked-a-pie.html`
  - **tracey is working with `jekyll` to get https://example.com/2022/01/i-baked-a-pie.md urls to also get copied in verbatim from your source -- so the original markdown with front matter can be used and parsed**



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
- `git grep xxx`
- xxx switch light/dark to css vars that pass into WC
