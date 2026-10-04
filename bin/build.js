#!/usr/bin/env -S deno run --no-lock --allow-read=. --allow-write=. --allow-env=GITHUB_REPOSITORY --allow-import=esm.ext.archive.org:443
/*
  The (optional) blogtini build step.  Makes your site better for everything that doesn't run JS:
  link previews, crawlers, RSS readers, and people w/o JS.

  Run from the top of your site repo (where `config.yml` is), eg:
    ../blogtini/bin/build            # everything
    ../blogtini/bin/build comments   # just the comments part (git hooks use this)

  Writes:
    index.xml             RSS feed of every post & page.  Also our sitemap and the client's content/search index.
    robots.txt            (only if missing) pointing crawlers to index.xml
    <post>/index.html     prepends one head line: title, og:image, and the fail-open style
    comments/index.txt, comments/<post>/index.json

  Idempotent: rerunning replaces its own head lines, so running twice changes nothing.
  See V2.md for the why of all of it.
*/
import yml from 'https://esm.ext.archive.org/js-yaml@4.1.0'
import { markdown_parse, markdown_to_html, friendly_truncate } from '../js/text.js'

// hides body for up to 3s (so no flash of raw markdown before JS renders), then shows it regardless.
// `pre-wrap` so a no-JS reader still sees the markdown's line breaks.  JS undoes both: `reveal()` in index.js
const STYLE = '<style>body{white-space:pre-wrap;animation:h 3s}@keyframes h{0%,to{visibility:hidden}}</style>'
// the head line the old `bin/seo` wrote -- remove it if a local checkout still has one
const OLD_HEAD_START = '<!DOCTYPE html><html><head><style>body{display:none}</style>'
// max chars for a post's RSS `<description>` one-liner (when front matter has no `description:`)
const RSS_DESCRIPTION_MAXLEN = 300
// dirs that are never posts
const SKIP_DIRS = new Set(['node_modules', 'test', 'theme', 'js', 'img', 'comments'])

// eslint-disable-next-line no-console
const log = console.log.bind(console)


function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function exists(path) {
  try {
    Deno.statSync(path)
    return true
  } catch {
    return false
  }
}

/** writes file only if contents changed (keeps mtimes & `git status` quiet) */
function write(path, contents) {
  if (exists(path) && Deno.readTextFileSync(path) === contents) return
  Deno.writeTextFileSync(path, contents)
  log('wrote', path)
}


/** @returns {string} the live site's url, ending in '/' */
function site_url(cfg) {
  let url = cfg.site_url
  if (!url && exists('CNAME')) url = `https://${Deno.readTextFileSync('CNAME').trim()}/`
  if (!url) {
    // eg: GITHUB_REPOSITORY=traceypooh/blogtini
    const [owner, repo] = (Deno.env.get('GITHUB_REPOSITORY') ?? '').split('/')
    if (owner && repo)
      url = repo === `${owner}.github.io` ? `https://${repo}/` : `https://${owner}.github.io/${repo}/`
  }
  if (!url) throw Error('set `site_url:` in config.yml, eg: site_url: https://example.com/')
  return url.endsWith('/') ? url : `${url}/`
}


/** @returns {string[]} paths to every `index.html` in a subdir (the top `index.html` is the homepage) */
function find_files(dir = '.') {
  const ret = []
  for (const e of Deno.readDirSync(dir)) {
    const path = dir === '.' ? e.name : `${dir}/${e.name}`
    if (e.isDirectory && !e.name.startsWith('.') && !e.name.startsWith('_') && !SKIP_DIRS.has(e.name))
      ret.push(...find_files(path))
    else if (e.isFile && e.name === 'index.html' && dir !== '.')
      ret.push(path)
  }
  return ret.sort()
}


/**
 * like `imgurl()` in index.js.
 * Keeps any `#top` / `#bottom` (the theme uses it to position the image) -- strip it for `og:image`.
 */
function featured_url(fm, site) {
  // hugo uses 'images' array
  const featured = (fm.featured || fm.featured_image || [fm.images].flat()[0] || '').trim()
  if (!featured) return ''
  return featured.startsWith('https://') ? featured : `${site}img/${featured}`
}


/**
 * The one-liner for RSS `<description>`: front matter `description:`, else the start of the body's
 * first paragraph that has any text (skipping eg: an image-only one), as plain text.
 */
function description(fm, body) {
  if (fm.description) return String(fm.description).trim()
  for (const [para] of markdown_to_html(body).matchAll(/<p[\s>][\s\S]*?<\/p>/g)) {
    const text = para.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
    if (text) return friendly_truncate(text, RSS_DESCRIPTION_MAXLEN)
  }
  return ''
}


/**
 * Prepends the head line to each post/page and returns the feed items.
 */
function posts(cfg, site) {
  const items = []
  for (const path of find_files()) {
    let text = Deno.readTextFileSync(path)

    // remove any head line a prior run wrote
    const nl = text.indexOf('\n')
    const line1 = text.slice(0, nl)
    if ((line1.startsWith('<!DOCTYPE html><title>') && line1.endsWith(STYLE)) ||
      (line1.startsWith(OLD_HEAD_START) && line1.endsWith('</head><body>')))
      text = text.slice(nl + 1)

    // posts & pages start with front matter.  anything else is someone else's html -- leave it be
    if (!text.startsWith('---')) continue
    const [fm, body] = markdown_parse(text)
    if (!fm) {
      log('skipping, unparseable front matter:', path)
      continue
    }

    const img = featured_url(fm, site)
    const og_image = img.replace(/#(bottom|top)$/, '') || (cfg.img_site ? `${site}${cfg.img_site}` : '')
    const head = '<!DOCTYPE html>'.concat(
      `<title>${esc(fm.title || cfg.title || 'blogtini')}</title>`,
      og_image ? `<meta property="og:image" content="${esc(og_image)}">` : '',
      STYLE,
    )
    write(path, `${head}\n${text}`)

    const date = new Date(fm.date || fm.created_at || '')
    if (isNaN(date)) {
      log('not in index.xml, no front matter `date:`', path)
      continue
    }
    items.push({ path, fm, body, img, date })
  }

  // newest first; ties by path, so output is deterministic
  return items.sort((a, b) => (b.date - a.date) || (a.path < b.path ? 1 : -1))
}


function rss(cfg, site, items) {
  const title = cfg.title || 'blogtini'
  const newest = items.length ? items[0].date.toUTCString() : ''

  const xml_items = items.map(({ path, fm, body, img, date }) => {
    const link = `${site}${path.replace(/index\.html$/, '')}`
    const cats = [
      ...[fm.categories ?? []].flat().map((e) => `<category domain="category">${esc(e)}</category>`),
      ...[fm.tags ?? []].flat().map((e) => `<category domain="tag">${esc(e)}</category>`),
      ...(fm.type && fm.type !== 'post' ? [`<category domain="type">${esc(fm.type)}</category>`] : []),
    ]
    const desc = description(fm, body)
    return `
    <item>
      <title>${esc(fm.title ?? '')}</title>
      <link>${esc(link)}</link>
      <guid>${esc(link)}</guid>
      <pubDate>${date.toUTCString()}</pubDate>${cats.map((e) => `\n      ${e}`).join('')}${
        desc ? `\n      <description>${esc(desc)}</description>` : ''}${

        !img
          ? ''
          : !fm.featuredcaption
            ? `\n      <media:content url="${esc(img)}" medium="image"/>`
            : `
      <media:content url="${esc(img)}" medium="image">
        <media:description>${esc(fm.featuredcaption)}</media:description>
      </media:content>`}
      <content:encoded><![CDATA[${body.trim().replaceAll(']]>', ']]]]><![CDATA[>')}]]></content:encoded>
    </item>`
  })

  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${esc(title)}</title>
    <link>${esc(site)}</link>
    <description>Recent content in ${esc(title)}</description>
    <lastBuildDate>${newest}</lastBuildDate>
    <atom:link href="${esc(site)}index.xml" rel="self" type="application/rss+xml"/>
    <generator>blogtini.com</generator>${xml_items.join('')}
  </channel>
</rss>
`
}


/**
 * Merges each post's comment files (one JSON file per comment, from staticman) into one
 * `comments/<post>/index.json`, so the client makes one request per post.
 */
function comments() {
  if (!exists('comments')) return

  const dirs = [...Deno.readDirSync('comments')].filter((e) => e.isDirectory).map((e) => e.name).sort()
  write('comments/index.txt', dirs.map((e) => `${e}\n`).join(''))

  for (const dir of dirs) {
    const files = [...Deno.readDirSync(`comments/${dir}`)]
      .map((e) => e.name)
      .filter((e) => e.endsWith('.json') && e !== 'index.json')
      .sort()
    const all = files.flatMap((e) => JSON.parse(Deno.readTextFileSync(`comments/${dir}/${e}`)))
      .map((comment) => Object.fromEntries(
        Object.entries(comment)
          .filter(([key]) => key !== 'replyThread' && key !== 'replyName')
          .map(([key, val]) => [key === '_id' ? 'id' : key, val]),
      ))
    write(`comments/${dir}/index.json`, `${JSON.stringify(all, null, 2)}\n`)
  }
}


function main() {
  if (!exists('config.yml')) {
    log('run this from the top of your site repo (where config.yml is)')
    Deno.exit(1)
  }

  comments()
  if (Deno.args.includes('comments')) return

  const cfg = yml.load(Deno.readTextFileSync('config.yml')) ?? {}
  const site = site_url(cfg)

  const items = posts(cfg, site)
  write('index.xml', rss(cfg, site, items))
  log(items.length, 'posts & pages in index.xml')

  if (!exists('robots.txt'))
    write('robots.txt', `Sitemap: ${site}index.xml\n`)
}

main()
