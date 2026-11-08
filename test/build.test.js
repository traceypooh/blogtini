// Tests for bin/build.js: run it on a copy of the tiny fixture site, & check the index.xml it writes.
// Run: deno task test
import assert from 'node:assert/strict'

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
  assert.equal(out.code, 0, new TextDecoder().decode(out.stderr))
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
  assert.deepEqual(Object.keys(by_title).sort(),
                   ['About the kitchen', 'I baked a pie', 'Test Kitchen: recipes &amp; more', 'Then, a cake'])

  // newest first: the 2 posts -- then the pages (the homepage gets the oldest date)
  assert.equal(got[0].title, 'Then, a cake')
  assert.equal(got[1].title, 'I baked a pie')

  // links: from config.yml site_url
  assert.equal(by_title['I baked a pie'].link, 'https://example.com/kitchen/2026-01-pie/')
  assert.equal(by_title['Test Kitchen: recipes &amp; more'].link, 'https://example.com/kitchen/')

  // types, tags, categories, the featured image & its caption, the markdown body
  assert.equal(by_title['About the kitchen'].type, 'page')
  assert.equal(by_title['Test Kitchen: recipes &amp; more'].type, 'page')
  const pie = by_title['I baked a pie'].xml
  assert.match(pie, /<category domain="tag">pie<\/category>/)
  assert.match(pie, /<category domain="category">baking<\/category>/)
  assert.match(pie, /<media:content url="https:\/\/example\.com\/kitchen\/img\/pie\.svg"/)
  assert.match(pie, /<media:description>A pie, cooling<\/media:description>/)
  assert.match(pie, /It was \*delicious\*/)
})

Deno.test('build: rerunning it changes nothing', async () => {
  const dir = Deno.makeTempDirSync({ prefix: 'bt-build-' })
  copy_dir(FIXTURE, dir)
  assert.equal(await build(dir), await build(dir))
})

Deno.test('build --seo: a head line atop each post -- & still parses', async () => {
  const dir = Deno.makeTempDirSync({ prefix: 'bt-build-' })
  copy_dir(FIXTURE, dir)
  await build(dir, '--seo')
  const pie = Deno.readTextFileSync(`${dir}/2026-01-pie/index.html`)
  assert.match(pie.split('\n')[0], /^<!DOCTYPE html><title>I baked a pie<\/title>/)
  // & a 2nd run doesn't stack a 2nd head line
  await build(dir, '--seo')
  assert.equal(Deno.readTextFileSync(`${dir}/2026-01-pie/index.html`), pie)
})
