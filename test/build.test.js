// Tests for bin/build.js: run it on a copy of the tiny fixture site, & check the index.xml it writes.
// Run: deno task test
import { assertEquals, assertMatch } from 'https://esm.archive.org/jsr/@std/assert@1'

const BUILD = new URL('../bin/build.js', import.meta.url).pathname
const FIXTURE = new URL('./fixtures/site/', import.meta.url).pathname

/** Copies a dir, recursively */
function copy_dir(from, to) {
  Deno.mkdirSync(to, { recursive: true })
  for (const e of Deno.readDirSync(from)) {
    if (e.isDirectory)
      copy_dir(`${from}/${e.name}`, `${to}/${e.name}`)
    else
      Deno.copyFileSync(`${from}/${e.name}`, `${to}/${e.name}`)
  }
}

/** Runs the build in a dir; returns its index.xml */
async function build(dir, ...args) {
  const out = await new Deno.Command(Deno.execPath(), {
    cwd: dir,
    args: ['run', '--no-lock', '--allow-read=.', '--allow-write=.', '--allow-env=GITHUB_REPOSITORY',
           '--allow-import=esm.archive.org:443', BUILD, ...args],
  }).output()
  assertEquals(out.code, 0, new TextDecoder().decode(out.stderr))
  return Deno.readTextFileSync(`${dir}/index.xml`)
}

/** Returns the feed's `<item>`s, eg: [{ title, link, type, xml }] */
function items(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, e]) => ({
    title: e.match(/<title>(.*?)<\/title>/)?.[1],
    link: e.match(/<link>(.*?)<\/link>/)?.[1],
    type: e.match(/<category domain="type">(.*?)<\/category>/)?.[1] ?? 'post',
    xml: e,
  }))
}


Deno.test('build: index.xml has every post & page -- & the homepage, as a page', async () => {
  const dir = Deno.makeTempDirSync({ prefix: 'bt-build-' })
  copy_dir(FIXTURE, dir)
  const got = items(await build(dir))

  const by_title = Object.fromEntries(got.map((e) => [e.title, e]))
  assertEquals(Object.keys(by_title).sort(),
               ['About the kitchen', 'I baked a pie', 'Test Kitchen: recipes &amp; more', 'Then, a cake'])

  // newest first: the 2 posts -- then the pages (the homepage gets the oldest date)
  assertEquals(got[0].title, 'Then, a cake')
  assertEquals(got[1].title, 'I baked a pie')

  // links: from config.yml site_url
  assertEquals(by_title['I baked a pie'].link, 'https://example.com/kitchen/2026-01-pie/')
  assertEquals(by_title['Test Kitchen: recipes &amp; more'].link, 'https://example.com/kitchen/')

  // types, tags, categories, the featured image & its caption, the markdown body
  assertEquals(by_title['About the kitchen'].type, 'page')
  assertEquals(by_title['Test Kitchen: recipes &amp; more'].type, 'page')
  const pie = by_title['I baked a pie'].xml
  assertMatch(pie, /<category domain="tag">pie<\/category>/)
  assertMatch(pie, /<category domain="category">baking<\/category>/)
  assertMatch(pie, /<media:content url="https:\/\/example\.com\/kitchen\/img\/pie\.svg"/)
  assertMatch(pie, /<media:description>A pie, cooling<\/media:description>/)
  assertMatch(pie, /It was \*delicious\*/)

  // authors: a post's own, in order -- else config.yml's.  pages: none
  const creators = (title) => [...by_title[title].xml.matchAll(/<dc:creator>(.*?)<\/dc:creator>/g)].map((e) => e[1])
  assertEquals(creators('Then, a cake'), ['Ann Oven', 'Bo Whisk'])
  assertEquals(creators('I baked a pie'), ['Pat Baker'])
  assertEquals(creators('About the kitchen'), [])
})

Deno.test('build: a `draft: true` post is left out of index.xml', async () => {
  const dir = Deno.makeTempDirSync({ prefix: 'bt-build-' })
  copy_dir(FIXTURE, dir)
  Deno.mkdirSync(`${dir}/2026-03-tart`)
  Deno.writeTextFileSync(`${dir}/2026-03-tart/index.html`,
                         '---\ntitle: A tart, someday\ndate: 2026-03-01\ndraft: true\n---\nNot yet.\n')
  const xml = await build(dir)

  assertEquals(items(xml).some((e) => e.title === 'A tart, someday'), false)
  assertEquals(xml.includes('2026-03-tart'), false) // sitemap & search, too
})


Deno.test('build: rerunning it changes nothing', async () => {
  const dir = Deno.makeTempDirSync({ prefix: 'bt-build-' })
  copy_dir(FIXTURE, dir)
  assertEquals(await build(dir), await build(dir))
})

Deno.test('build --seo: a head line atop each post -- & still parses', async () => {
  const dir = Deno.makeTempDirSync({ prefix: 'bt-build-' })
  copy_dir(FIXTURE, dir)
  await build(dir, '--seo')
  const pie = Deno.readTextFileSync(`${dir}/2026-01-pie/index.html`)
  assertMatch(pie.split('\n')[0], /^<!DOCTYPE html><title>I baked a pie<\/title>/)
  // & a 2nd run doesn't stack a 2nd head line
  await build(dir, '--seo')
  assertEquals(Deno.readTextFileSync(`${dir}/2026-01-pie/index.html`), pie)
})
