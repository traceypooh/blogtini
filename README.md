# blogtini

live at:
- https://blogtini.com
- https://traceypooh.github.io/blogtini/

## Hooks
- Whenever you create or delete a post, we want your `sitemap` updated.
- Whenever someone comments on your site, we run a small script.
- `github` uses `jekyll`, so we need to keep your source files AS IS.

Thus, we suggest you use our "pre commit" and "post merge" `git` 'hooks' to automate the above "housekeeping".  You can set them up like this:
```sh
git config --local core.hooksPath bin/
```

## Best two website/blog setup options
### Blog source repository that uses markdown inside html markup files
- /_site/2022/01/i-baked-a-pie/
- /_site/2022/01/i-baked-a-pie/index.html
  - start with front matter
    - including `comment: <script type="module" src="../../../theme.js"></script>`
  - you can then have the nice url `https://example.com/2022/01/i-baked-a-pie/` where the included JS transforms the markdown to markup
- your `/_site/sitemap.xml` can reference each of your directory urls
- manage your `/_site/sitemap.xml` manually or run the `/bin/sitemap` script any time your create or delete a post.  The `/bin/sitemap` script can be found on the blogtini website.
- have `/_site/theme.js` do an `import` of whatever theme you desire
- create a `/_config.yml` file with (minimally):
```yml
keep_files: [
  sitemap.xml,
  theme.css,
  theme.js,
  "2022",
  "2021",
]
```

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

### Option 2
(any basic static file webserver will do):
```bash
cd _site
( sleep 3; open http://localhost:8000 ) &
python3 -m http.server
```

https://traceypooh.gitlab.io/blogtini/
https://traceypooh.github.io/blogtini/
