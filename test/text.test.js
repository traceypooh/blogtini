// Unit tests for js/text.js -- shared by the browser & the build.  Run: deno task test
import { assert, assertEquals, assertMatch, assertNotMatch } from 'https://esm.archive.org/jsr/@std/assert@1'
import {
  markdown_parse, markdown_to_html, summarize_markdown, friendly_truncate,
  homepage_markdown, vrsort, SKIP_DIRS,
} from '../js/text.js'


Deno.test('markdown_parse: front matter & body', () => {
  const [fm, body] = markdown_parse('---\ntitle: Pie\ndate: 2026-01-15\ntags:\n  - baking\n---\nIt was *good*.\n')
  assertEquals(fm.title, 'Pie')
  assertEquals(fm.tags, ['baking'])
  assertEquals(body.trim(), 'It was *good*.')
})

Deno.test('markdown_parse: skips the build\'s head line, before the front matter', () => {
  const [fm, body] = markdown_parse('<!DOCTYPE html><title>Pie</title>\n---\ntitle: Pie\n---\nyum\n')
  assertEquals(fm.title, 'Pie')
  assertEquals(body.trim(), 'yum')
})

Deno.test('markdown_parse: a `---` in the body stays in the body', () => {
  const [, body] = markdown_parse('---\ntitle: x\n---\nabove\n---\nbelow\n')
  assertMatch(body, /above\n---\nbelow/)
})

Deno.test('markdown_parse: a duplicate key -- the last one wins (no throw)', () => {
  const [fm] = markdown_parse('---\ntitle: one\ntitle: two\n---\n')
  assertEquals(fm.title, 'two')
})

Deno.test('markdown_parse: unparseable front matter => [undefined, undefined]', () => {
  assertEquals(markdown_parse('---\ntitle: [unclosed\n---\nbody\n'), [undefined, undefined])
})

Deno.test('markdown_to_html: markdown, tables & youtube shortcodes', () => {
  assertMatch(markdown_to_html('*hi*'), /<em>hi<\/em>/)
  assertMatch(markdown_to_html('| a |\n|---|\n| 1 |'), /<table>/)
  assertMatch(markdown_to_html('{{< youtube abc123 >}}'), /youtube\.com\/embed\/abc123/)
})

Deno.test('markdown_to_html: a picture alone in its paragraph is a photo (full width, or #half etc)', () => {
  assertMatch(markdown_to_html('![a pie](pie.jpg)'), /<img class="bt-photo" src="pie\.jpg" alt="a pie">/)
  assertMatch(markdown_to_html('[![a pie](pie.jpg)](pie/)'), /<a href="pie\/"><img class="bt-photo" src="pie\.jpg"/)
  // a size: the fragment comes off the url
  assertMatch(markdown_to_html('![a pie](pie.jpg#half)'), /<img class="bt-photo size-half" src="pie\.jpg"/)
  assertMatch(markdown_to_html('![a pie](pie.jpg#two-thirds)'), /class="bt-photo size-two-thirds" src="pie\.jpg"/)
  // not ours: other fragments stay
  assertMatch(markdown_to_html('![a pie](pie.jpg#top)'), /<img class="bt-photo" src="pie\.jpg#top"/)
  // left alone: in a line of text, or w/ its own width or class
  assertNotMatch(markdown_to_html('a pie ![a pie](pie.jpg) for you'), /bt-photo/)
  assertNotMatch(markdown_to_html('<img src="pie.jpg" width="300" height="200">'), /bt-photo/)
  assertNotMatch(markdown_to_html('<img src="pie.jpg" class="mine">'), /bt-photo/)
})

Deno.test('summarize_markdown: the 1st paragraph, & no longer than maxlen (+ "...")', () => {
  const s = summarize_markdown('First para here.\n\nSecond para.')
  assertMatch(s, /First para here/)
  assertNotMatch(s, /Second/)
  assert(summarize_markdown(`${'word '.repeat(200)}`, 50).length <= 50 + '<p>...'.length)
})

Deno.test('friendly_truncate: cuts at a space, w/ "..."', () => {
  assertEquals(friendly_truncate('short', 10), 'short')
  assertEquals(friendly_truncate('hello there world', 13), 'hello there...')
  assertEquals(friendly_truncate('abcdefghij', 5), 'abc..') // no space: a hard cut
  assertEquals(friendly_truncate('🌱🌱🌱🌱', 4), '🌱🌱🌱🌱') // counts characters, not bytes
})

Deno.test('homepage_markdown: whatever is inside <body>', () => {
  assertEquals(homepage_markdown('<html><head><title>x</title></head><body class="homepage">\n# Hi\n</body></html>'), '# Hi')
  assertEquals(homepage_markdown('no body here'), undefined)
})

Deno.test('vrsort: by value, biggest first', () => {
  assertEquals(Object.keys(vrsort({ a: 1, b: 3, c: 2 })), ['b', 'c', 'a'])
})

Deno.test('SKIP_DIRS: dirs that are never posts', () => {
  for (const dir of ['theme', 'js', 'img', 'test', 'research', 'preview'])
    assert(SKIP_DIRS.has(dir), dir)
})
