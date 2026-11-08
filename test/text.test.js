// Unit tests for js/text.js -- shared by the browser & the build.  Run: deno task test
import assert from 'node:assert/strict'
import {
  markdown_parse, markdown_to_html, summarize_markdown, friendly_truncate,
  homepage_markdown, vrsort, SKIP_DIRS,
} from '../js/text.js'


Deno.test('markdown_parse: front matter & body', () => {
  const [fm, body] = markdown_parse('---\ntitle: Pie\ndate: 2026-01-15\ntags:\n  - baking\n---\nIt was *good*.\n')
  assert.equal(fm.title, 'Pie')
  assert.deepEqual(fm.tags, ['baking'])
  assert.equal(body.trim(), 'It was *good*.')
})

Deno.test('markdown_parse: skips the build\'s head line, before the front matter', () => {
  const [fm, body] = markdown_parse('<!DOCTYPE html><title>Pie</title>\n---\ntitle: Pie\n---\nyum\n')
  assert.equal(fm.title, 'Pie')
  assert.equal(body.trim(), 'yum')
})

Deno.test('markdown_parse: a `---` in the body stays in the body', () => {
  const [, body] = markdown_parse('---\ntitle: x\n---\nabove\n---\nbelow\n')
  assert.match(body, /above\n---\nbelow/)
})

Deno.test('markdown_parse: a duplicate key -- the last one wins (no throw)', () => {
  const [fm] = markdown_parse('---\ntitle: one\ntitle: two\n---\n')
  assert.equal(fm.title, 'two')
})

Deno.test('markdown_parse: unparseable front matter => [undefined, undefined]', () => {
  assert.deepEqual(markdown_parse('---\ntitle: [unclosed\n---\nbody\n'), [undefined, undefined])
})

Deno.test('markdown_to_html: markdown, tables & youtube shortcodes', () => {
  assert.match(markdown_to_html('*hi*'), /<em>hi<\/em>/)
  assert.match(markdown_to_html('| a |\n|---|\n| 1 |'), /<table>/)
  assert.match(markdown_to_html('{{< youtube abc123 >}}'), /youtube\.com\/embed\/abc123/)
})

Deno.test('summarize_markdown: the 1st paragraph, & no longer than maxlen (+ "...")', () => {
  const s = summarize_markdown('First para here.\n\nSecond para.')
  assert.match(s, /First para here/)
  assert.doesNotMatch(s, /Second/)
  assert.ok(summarize_markdown(`${'word '.repeat(200)}`, 50).length <= 50 + '<p>...'.length)
})

Deno.test('friendly_truncate: cuts at a space, w/ "..."', () => {
  assert.equal(friendly_truncate('short', 10), 'short')
  assert.equal(friendly_truncate('hello there world', 13), 'hello there...')
  assert.equal(friendly_truncate('abcdefghij', 5), 'abc..') // no space: a hard cut
  assert.equal(friendly_truncate('🌱🌱🌱🌱', 4), '🌱🌱🌱🌱') // counts characters, not bytes
})

Deno.test('homepage_markdown: whatever is inside <body>', () => {
  assert.equal(homepage_markdown('<html><head><title>x</title></head><body class="homepage">\n# Hi\n</body></html>'), '# Hi')
  assert.equal(homepage_markdown('no body here'), undefined)
})

Deno.test('vrsort: by value, biggest first', () => {
  assert.deepEqual(Object.keys(vrsort({ a: 1, b: 3, c: 2 })), ['b', 'c', 'a'])
})

Deno.test('SKIP_DIRS: dirs that are never posts', () => {
  for (const dir of ['theme', 'js', 'img', 'test', 'research', 'preview'])
    assert.ok(SKIP_DIRS.has(dir), dir)
})
