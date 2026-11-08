/*
  Cosmos theme -- an original blogtini theme: an early-80s vector arcade game, in space.  (For Carl Sagan: look up!)
  All light DOM, like librarian, dossier & the HTML5 UP ports.  No images or fonts to load: it's all svg & system fonts.

  - behind every page: a star field in 3 layers, each scrolling at its own speed (lean in) -- & a pale blue dot
  - homepage: a vector hero -- wireframe mountains, a volcano, a crescent moon, a grid floor rolling toward you
    w/ wireframe pyramids, & the site title in a vector font
  - posts: cards, each w/ its own wireframe planet (from its url), "SECTOR YYYY-MM-DD" (its date -- duh!),
    its tags as star charts, & a FUEL gauge (the reading time)
  - "Mission control" (every page): a radar scope w/ search (matching posts light up as blips), star charts (tags),
    galaxies (categories), & the theme picker ("Warp")
  - HIGH SCORES: the longest posts.  Colophon: "We are made of star-stuff."
  - the footer: our lunar rover (a martini glass up top) rolling over craters, below two ridges of mountains
  - phosphor color: green (default), amber or cyan -- a viewer's pick sticks (localStorage)
  - prefers-reduced-motion: everything holds still
  `<bt-body>` writes those & moves blogtini's content into `#wrapper`; the rest replace themselves w/ plain html.
*/

import {
  cfg, state, url2post, urlify, summarize_markdown, markdown_to_html, imgurl, reveal, word_count,
  reading_time, all_posts,
} from '../../index.js'
import { vrsort } from '../../js/text.js'
import {
  esc, nodes, menu_items, theme_items, social_list, pager, comments, highlight_code,
  histogram_items, tag_cloud, contact_form,
} from '../html5up/shared.js'


const PHOSPHORS = ['green', 'amber', 'cyan']
const PHOSPHOR_KEY = 'bt-cosmos-phosphor'
const BG = '#02040a' // the void -- also what svg shapes fill w/, to hide what's behind them

const reduced = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Is this the homepage's first page? */
function is_home() {
  return state.is_homepage && !location.search
}

/** Returns a post's date as YYYY-MM-DD, or '' */
function ymd(post) {
  try {
    return new Date(post.date).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}


// ---- seeded randomness: same input => same sky, terrain, planet -- every visit

/** Returns a string's hash: a non-negative 32-bit int (FNV-1a) */
function hash(str) {
  let h = 2166136261
  for (const c of str)
    h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

/** Returns a function returning seeded random numbers in [0, 1) -- mulberry32 */
function rng(seed) {
  let a = typeof seed === 'string' ? hash(seed) : seed
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}


// ---- vector font: single strokes on a 4 x 6 grid, like the old vector arcade games

const GLYPHS = {
  A: ['0,6 0,2 2,0 4,2 4,6', '0,4 4,4'],
  B: ['0,6 0,0 3,0 4,1 4,2 3,3 0,3', '3,3 4,4 4,5 3,6 0,6'],
  C: ['4,0 0,0 0,6 4,6'],
  D: ['0,0 2,0 4,2 4,4 2,6 0,6 0,0'],
  E: ['4,0 0,0 0,6 4,6', '0,3 3,3'],
  F: ['4,0 0,0 0,6', '0,3 3,3'],
  G: ['4,1 4,0 0,0 0,6 4,6 4,3 2,3'],
  H: ['0,0 0,6', '4,0 4,6', '0,3 4,3'],
  I: ['0,0 4,0', '2,0 2,6', '0,6 4,6'],
  J: ['4,0 4,6 2,6 0,4'],
  K: ['0,0 0,6', '4,0 0,3 4,6'],
  L: ['0,0 0,6 4,6'],
  M: ['0,6 0,0 2,2 4,0 4,6'],
  N: ['0,6 0,0 4,6 4,0'],
  O: ['0,0 4,0 4,6 0,6 0,0'],
  P: ['0,6 0,0 4,0 4,3 0,3'],
  Q: ['0,0 4,0 4,4 2,6 0,6 0,0', '2,4 4,6'],
  R: ['0,6 0,0 4,0 4,3 0,3', '1,3 4,6'],
  S: ['4,0 0,0 0,3 4,3 4,6 0,6'],
  T: ['0,0 4,0', '2,0 2,6'],
  U: ['0,0 0,6 4,6 4,0'],
  V: ['0,0 2,6 4,0'],
  W: ['0,0 0,6 2,4 4,6 4,0'],
  X: ['0,0 4,6', '4,0 0,6'],
  Y: ['0,0 2,2 4,0', '2,2 2,6'],
  Z: ['0,0 4,0 0,6 4,6'],
  0: ['0,0 4,0 4,6 0,6 0,0', '4,0 0,6'],
  1: ['1,1 2,0 2,6', '1,6 3,6'],
  2: ['0,0 4,0 4,3 0,3 0,6 4,6'],
  3: ['0,0 4,0 4,6 0,6', '1,3 4,3'],
  4: ['0,0 0,3 4,3', '4,0 4,6'],
  5: ['4,0 0,0 0,3 4,3 4,6 0,6'],
  6: ['4,0 0,0 0,6 4,6 4,3 0,3'],
  7: ['0,0 4,0 4,6'],
  8: ['0,0 4,0 4,6 0,6 0,0', '0,3 4,3'],
  9: ['4,3 0,3 0,0 4,0 4,6'],
  '!': ['2,0 2,4', '2,5.4 2,6'],
  '-': ['1,3 3,3'],
  '.': ['2,5.4 2,6'],
  ',': ['2,5.4 1.4,6.8'],
  ':': ['2,1.4 2,2', '2,4.4 2,5'],
  "'": ['2,0 2,1.5'],
  '?': ['0,1 0,0 4,0 4,3 2,3 2,4', '2,5.4 2,6'],
  '/': ['0,6 4,0'],
  '#': ['1,0.5 1,5.5', '3,0.5 3,5.5', '0,2 4,2', '0,4 4,4'],
  '<': ['4,0 0,3 4,6'],
  '>': ['0,0 4,3 0,6'],
  '@': ['4,4 2,4 2,2 4,2 4,6 0,6 0,0 4,0 4,2'],
}

/** Returns an svg path `d` for text in the vector font -- each char 6 units wide, at x0,y0, scaled by s */
function vpath(str, x0 = 0, y0 = 0, s = 1) {
  let d = ''
  ;[...str.toUpperCase()].forEach((c, i) => {
    for (const stroke of GLYPHS[c] ?? []) {
      d += stroke.split(' ').map((p, j) => {
        const [x, y] = p.split(',').map(Number)
        return `${j ? 'L' : 'M'}${(x0 + (x + i * 6 + 1) * s).toFixed(1)},${(y0 + (y + 1) * s).toFixed(1)}`
      }).join('')
    }
  })
  return d
}

/** Returns an inline svg of text in the vector font.  s: px per unit (each char: 6 x 8 units) */
function vtext(str, s = 2) {
  const w = [...str].length * 6
  return `<svg class="vt" viewBox="0 0 ${w} 8" width="${w * s}" height="${8 * s}" role="img" aria-label="${esc(str)}"><path d="${vpath(str)}" stroke-width="${Math.max(0.35, 1.6 / s).toFixed(2)}"/></svg>`
}


// ---- the star field: drawn once, on a fixed tile (no viewBox: user units are px) -- so a resize just shows more or
// less of the same sky.  (Regenerating per window size reshuffled every star on each resize event: a strobe)

const TILE_W = 2000
const TILE_H = 1400
const LAYERS = [ // n: stars per 1280 x 800, r: radius, o: opacity, f: parallax (scroll speed)
  { n: 160, r: 0.6, o: 0.45, f: 0.05 },
  { n: 70, r: 0.9, o: 0.7, f: 0.15 },
  { n: 25, r: 1.4, o: 1, f: 0.3 },
]

function draw_stars(svg) {
  const rand = rng('blogtini stars')
  // eslint-disable-next-line no-param-reassign
  svg.innerHTML = LAYERS.map((L, li) => {
    let dots = ''
    for (let i = 0; i < L.n * (TILE_W * TILE_H) / (1280 * 800); i++) {
      const x = rand() * TILE_W
      const y = rand() * TILE_H
      const tint = ['#fff', '#fff', '#fff', '#cde', '#fed', '#fdd'][Math.floor(rand() * 6)]
      const tw = rand() < 0.25 ? ` class="tw" style="animation-delay:-${(rand() * 3).toFixed(2)}s"` : ''
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${L.r}" fill="${tint}"${tw}/>`
    }
    // look closely: a pale blue dot (for Carl Sagan) -- & a few other "is that a planet?" bodies
    if (li === 1) {
      dots += `
        <g><title>a pale blue dot</title>
          <circle cx="1187" cy="353" r="4" fill="#6fa8ff" opacity=".18"/><circle cx="1187" cy="353" r="1.8" fill="#8cbcff"/>
        </g>
        <g transform="rotate(-18 412 961)" fill="none" stroke="#e8d7a0" stroke-width=".7">
          <circle cx="412" cy="961" r="2.6" fill="#e8d7a0"/><ellipse cx="412" cy="961" rx="6" ry="1.6"/>
        </g>
        <circle cx="1730" cy="1122" r="2.2" fill="#e8846a"/>
        <path d="M688,212 a3.2,3.2 0 1,0 3,4.2 a2.6,2.6 0 1,1 -3,-4.2z" fill="#d9e2f0"/>`
    }
    const tiles = [[0, 0], [TILE_W, 0], [0, TILE_H], [TILE_W, TILE_H]]
      .map(([x, y]) => `<use href="#bt-stars${li}" x="${x}" y="${y}"/>`).join('')
    return `<defs><g id="bt-stars${li}">${dots}</g></defs><g class="layer" opacity="${L.o}">${tiles}</g>`
  }).join('')
}

function parallax(svg) {
  svg.querySelectorAll('.layer').forEach((g, li) => {
    g.setAttribute('transform', `translate(0 ${-((globalThis.scrollY * LAYERS[li].f) % TILE_H)})`)
  })
}


// ---- terrain: periodic midpoint displacement -- endpoints match, so it tiles

function ridge(seed, n, rough, amp) {
  const rand = rng(seed)
  const h = new Array(n + 1).fill(0)
  for (let step = n, a = amp; step > 1; step /= 2, a *= rough) {
    for (let i = step / 2; i < n; i += step)
      h[i] = (h[i - step / 2] + h[i + step / 2]) / 2 + (rand() - 0.5) * a
  }
  return h
}

function ridge_path(h, W, base, close_to) {
  const dx = W / (h.length - 1)
  const pts = h.map((y, i) => `${(i * dx).toFixed(1)},${(base - Math.abs(y)).toFixed(1)}`)
  return `M${pts.join('L')}L${W},${close_to}L0,${close_to}Z`
}


// ---- the homepage hero: mountains, volcano, crescent moon, a grid floor rolling toward you, & wireframe pyramids

const HZ = 230 // horizon
const VP = 500 // vanishing point x
const FLOOR_N = 9
const PYRAMIDS = [[-0.55, 0.15], [0.7, 0.4], [-0.25, 0.75], [0.35, 0.95]] // [x offset, phase]

function draw_hero(svg) {
  const peaks = ridge('battlezone', 64, 0.55, 110)
  const title = (cfg.title ?? '').toUpperCase().slice(0, 18)
  const s = Math.min(9, 900 / Math.max(1, title.length * 6))
  const verticals = Array.from({ length: 25 }, (_, i) => `<line x1="${VP}" y1="${HZ}" x2="${VP + (i - 12) * 160}" y2="380"/>`).join('')
  const horizontals = Array.from({ length: FLOOR_N }, () => '<line x1="0" x2="1000" class="h"/>').join('')
  // eslint-disable-next-line no-param-reassign
  svg.innerHTML = `
    <path d="M840,70 a34,34 0 1,0 34,46 a28,28 0 1,1 -34,-46z"/>
    <path d="${ridge_path(peaks.map((y) => y * 0.6), 1000, HZ, HZ)}" fill="${BG}" opacity=".9"/>
    <path d="M150,${HZ} L215,${HZ - 92} L238,${HZ - 92} L310,${HZ}" fill="${BG}"/>
    <path d="M215,${HZ - 92} l6,-10 m6,4 l2,-14 m6,10 l7,-12" opacity=".8"/>
    <line x1="0" y1="${HZ}" x2="1000" y2="${HZ}"/>
    <g class="floor" stroke-width="1" opacity=".75">${verticals}${horizontals}</g>
    <g class="obstacles" stroke-width="1.2"></g>
    <path d="${vpath(title, 500 - title.length * 3 * s, 300 - 4 * s, s)}" stroke-width="2.2"/>`
}

function frame_hero(svg, t) {
  const roll = (t / 2500) % 1
  svg.querySelectorAll('.floor .h').forEach((l, i) => {
    const k = (i + roll) / FLOOR_N
    const y = (HZ + (380 - HZ) * k * k).toFixed(1)
    l.setAttribute('y1', y)
    l.setAttribute('y2', y)
    l.setAttribute('opacity', (0.25 + 0.75 * k).toFixed(2))
  })
  // eslint-disable-next-line no-param-reassign
  svg.querySelector('.obstacles').innerHTML = PYRAMIDS.map(([xo, ph]) => {
    const k = (ph + roll / 1.5) % 1
    const z = k * k
    const y = HZ + (380 - HZ) * z
    const x = VP + xo * 1400 * z
    const s = 6 + 60 * z
    if (y > 372)
      return ''
    return `<path d="M${x - s},${y} L${x},${y - s * 1.3} L${x + s},${y} M${x},${y - s * 1.3} L${x + s * 0.35},${y - s * 0.25} L${x + s},${y} M${x + s * 0.35},${y - s * 0.25} L${x - s},${y}" opacity="${(0.3 + 0.7 * k).toFixed(2)}"/>`
  }).join('')
}


// ---- the footer: two ridges, cratered ground & our rover, scrolling sideways

const MOON_W = 2048 // one terrain tile

/** Returns our lunar rover: a pressurized cabin, a tipped-back dish, 6 wheels (3 show), & a martini glass antenna */
function rover() {
  const wheels = [14, 38, 66]
  const spokes = (x) => [0, 30, 60, 90, 120, 150].map((a) => {
    const dx = 9 * Math.cos(a * Math.PI / 180)
    const dy = 9 * Math.sin(a * Math.PI / 180)
    return `<line x1="${(x - dx).toFixed(2)}" y1="${(123 - dy).toFixed(2)}" x2="${(x + dx).toFixed(2)}" y2="${(123 + dy).toFixed(2)}" opacity=".7"/>`
  }).join('')
  return `
    <g class="rover glow" transform="translate(60 0)" stroke-width="1.3">
      <defs><linearGradient id="bt-beam" x1="0" x2="1">
        <stop offset="0" stop-color="currentColor" stop-opacity=".35"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/>
      </linearGradient></defs>
      <g class="rover-body">
        <path d="M85,107 L170,96 L170,122 Z" fill="url(#bt-beam)" stroke="none"/>
        <path d="M0,114 L0,94 L3,91 L58,91 L74,101 L84,104 L84,114 Z"/>
        <path d="M59,93.5 L72,101.5 L70,105 L57,105 Z" fill="currentColor" fill-opacity=".25"/>
        <path d="M22,93 V112 M44,93 V112" opacity=".55"/>
        <rect x="27" y="97" width="11" height="5" opacity=".7"/>
        <circle cx="82" cy="108" r="1.6" fill="currentColor"/>
        <path d="M34,91 V84"/>
        <g transform="rotate(30 34 83)">
          <ellipse cx="34" cy="80.5" rx="12" ry="2.6"/>
          <path d="M22,80.5 Q34,90 46,80.5" fill="currentColor" fill-opacity=".15"/>
          <path d="M34,84 V75"/><circle cx="34" cy="74.5" r="1" fill="currentColor"/>
        </g>
        <path d="M18,91 V74"/><path d="M13,69 L23,69 L18,74 Z"/><circle cx="19.8" cy="70.5" r=".9" fill="currentColor"/>
        ${wheels.map((x) => `<path d="M${x - 12},114 A12,12 0 0 1 ${x + 12},114" opacity=".6"/>`).join('')}
      </g>
      ${wheels.map((x) => `
      <g class="wheel" style="transform-origin:${x}px 123px">
        <circle cx="${x}" cy="123" r="9" fill="${BG}"/><circle cx="${x}" cy="123" r="6.5" opacity=".5"/>
        ${spokes(x)}
      </g>`).join('')}
    </g>`
}

function draw_moon(svg) {
  const W = svg.clientWidth || globalThis.innerWidth // capped by the css max-width
  const copies = Math.ceil(W / MOON_W) + 1
  const tile = (d) => Array.from({ length: copies }, (_, i) => `<path d="${d}" transform="translate(${i * MOON_W} 0)"/>`).join('')
  const rand = rng('craters')
  let craters = ''
  for (let i = 0; i < 14; i++) {
    const x = rand() * MOON_W
    const w = 10 + rand() * 22
    craters += `M${x.toFixed(1)},132 q${w / 2},${(8 + rand() * 6).toFixed(1)} ${w.toFixed(1)},0 `
  }
  svg.setAttribute('viewBox', `0 0 ${W} 150`)
  // eslint-disable-next-line no-param-reassign
  svg.innerHTML = `
    <g fill="${BG}" stroke="currentColor" stroke-linejoin="round">
      <g class="far" stroke-width="1" opacity=".45">${tile(ridge_path(ridge('moon far', 128, 0.6, 140).map((y) => y * 0.55), MOON_W, 110, 150))}</g>
      <g class="near glow" stroke-width="1.3" opacity=".8">${tile(ridge_path(ridge('moon near', 128, 0.5, 70).map((y) => y * 0.6), MOON_W, 128, 150))}</g>
      <g class="ground glow" stroke-width="1.5">
        <rect x="0" y="132" width="${W * 2}" height="18" stroke="none"/>
        <line x1="0" y1="132" x2="${W * 2}" y2="132"/>
        ${tile(craters).replace(/<path /g, '<path fill="none" ')}
      </g>
      ${rover()}
    </g>`
}

function frame_moon(svg, t) {
  const x = (f) => -(((t * 0.02) + globalThis.scrollY) * f % MOON_W)
  svg.querySelector('.far')?.setAttribute('transform', `translate(${x(0.25)} 0)`)
  svg.querySelector('.near')?.setAttribute('transform', `translate(${x(0.6)} 0)`)
  svg.querySelector('.ground')?.setAttribute('transform', `translate(${x(1)} 0)`)
}


// ---- planets: one per post, from its url -- size, tilt, hue, rings or craters, bands

/** @param {string} cls  eg: 'big' */
function planet(seed, cls = '') {
  const rand = rng(seed)
  const col = `hsl(${Math.floor(rand() * 360)} 90% 65%)`
  const r = 26 + rand() * 18
  const tilt = (rand() - 0.5) * 50
  const ringed = rand() < 0.5
  const c = 60
  let bands = ''
  for (let i = 1; i <= 3; i++) {
    const y = c + (i - 2) * r * 0.45 + (rand() - 0.5) * 6
    const half = Math.sqrt(Math.max(0, r * r - (y - c) ** 2))
    bands += `<path d="M${(c - half).toFixed(1)},${y.toFixed(1)} A${half.toFixed(1)},${(half * 0.22).toFixed(1)} 0 0 0 ${(c + half).toFixed(1)},${y.toFixed(1)}" opacity=".6"/>`
  }
  let craters = ''
  if (!ringed) {
    for (let i = 0; i < 4; i++) {
      const a = rand() * Math.PI * 2
      const d = rand() * r * 0.6
      craters += `<circle cx="${(c + Math.cos(a) * d).toFixed(1)}" cy="${(c + Math.sin(a) * d).toFixed(1)}" r="${(2 + rand() * 4).toFixed(1)}" opacity=".7"/>`
    }
  }
  const rx = r * 1.75
  const ry = r * 0.38
  const back = ringed ? `<path d="M${c - rx},${c} A${rx},${ry} 0 0 1 ${c + rx},${c}"/>` : ''
  const front = ringed
    ? `<path d="M${c - rx},${c} A${rx},${ry} 0 0 0 ${c + rx},${c}"/>
       <path d="M${c - rx * 0.86},${c} A${rx * 0.86},${ry * 0.86} 0 0 0 ${c + rx * 0.86},${c}" opacity=".5"/>`
    : ''
  return `<svg class="planet ${cls}" viewBox="0 0 120 120" aria-hidden="true" style="color:${col}">
    <g transform="rotate(${tilt.toFixed(1)} 60 60)">
      ${back}
      <circle cx="${c}" cy="${c}" r="${r.toFixed(1)}" fill="${BG}"/>
      <path d="M${c},${(c - r).toFixed(1)} A${(r * 0.45).toFixed(1)},${r.toFixed(1)} 0 0 1 ${c},${(c + r).toFixed(1)}" opacity=".45"/>
      ${bands}${craters}${front}
    </g></svg>`
}


// ---- bits of a post

/** Returns a post's star charts: its category & tag links */
function charts(post) {
  const links = [
    ...(post.categories ?? []).map((e) => `<a href="${esc(state.top_page)}?categories/${esc(e)}" class="galaxy">${esc(e)}</a>`),
    ...(post.tags ?? []).map((e) => `<a href="${esc(state.top_page)}?tags/${esc(e)}" class="star">${esc(e)}</a>`),
  ]
  return links.length ? `<p class="charts">${links.join(' ')}</p>` : ''
}

/** Returns the FUEL gauge: the reading time -- or '' if `reading_time: false` */
function fuel(post, words = false) {
  if (!cfg.reading_time)
    return ''
  const min = reading_time(post)
  const cells = Array.from({ length: 10 }, (_, i) => `<i class="${i < min ? 'on' : ''}"></i>`).join('')
  return `<p class="fuel" title="reading time">${cells}<span>Fuel: ${min} min${words ? ` &middot; ${word_count(post).toLocaleString('en')} words` : ''}</span></p>`
}

/** Returns a post's card, for a list of posts */
function card(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const href = esc(urlify(post.url))
  const summary = nodes(summarize_markdown(post.body_raw ?? '', 240)).textContent.trim()
  return `
<article class="card" ${id ? `id="${esc(id)}"` : ''}>
  <a href="${href}" tabindex="-1" aria-hidden="true">${planet(post.url ?? post.title ?? '')}</a>
  <div>
    ${ymd(post) ? `<p class="sector">Sector ${ymd(post)}</p>` : ''}
    <h2><a href="${href}">${esc(post.title)}</a></h2>
    ${summary ? `<p class="summary">${esc(summary)}</p>` : ''}
    ${charts(post)}
    ${fuel(post)}
  </div>
</article>`
}


/** Returns prior & next links: for pages of posts, or a post's neighbors */
function pagination() {
  const pg = pager()
  if (!pg)
    return ''
  return `
<nav class="sectors">
  ${pg.left_url ? `<a href="${esc(pg.left_url)}" class="prior">${vtext('< Prev sector', 1.8)}${pg.single ? `<small>${esc(pg.left_title)}</small>` : ''}</a>` : '<span></span>'}
  ${pg.rite_url ? `<a href="${esc(pg.rite_url)}" class="next">${vtext('Next sector >', 1.8)}${pg.single ? `<small>${esc(pg.rite_title)}</small>` : ''}</a>` : '<span></span>'}
</nav>`
}


/** Returns "Mission control": radar & search, star charts (tags), galaxies (categories), theme picker */
function mission_control(categories, tags) {
  const entries = cfg.sidebar.categories_by_count
    ? Object.entries(vrsort(categories))
    : Object.entries(categories)
  // a blip for each post -- where, from its url.  (Search lights up the matches)
  const blips = all_posts().slice(0, 150).map((p) => {
    const rand = rng(`blip ${p.url}`)
    const a = rand() * Math.PI * 2
    const d = 10 + rand() * 42
    return `<circle class="blip" data-url="${esc(p.url)}" cx="${(60 + Math.cos(a) * d).toFixed(1)}" cy="${(60 + Math.sin(a) * d).toFixed(1)}" r="1.8"/>`
  }).join('')

  const boxes = [
    cfg.header.search
      ? `
    <div class="box scan">
      <h3>${vtext('Scan', 2)}</h3>
      <div class="scope">
        <svg id="radar" viewBox="0 0 120 120" aria-hidden="true">
          <defs><linearGradient id="bt-trail" x1="0" x2="1">
            <stop offset="0" stop-color="currentColor" stop-opacity="0"/><stop offset="1" stop-color="currentColor" stop-opacity=".35"/>
          </linearGradient></defs>
          <g fill="none" stroke="currentColor" stroke-width="1">
            <circle cx="60" cy="60" r="56"/><circle cx="60" cy="60" r="36" opacity=".5"/><circle cx="60" cy="60" r="16" opacity=".4"/>
            <path d="M60,4 V116 M4,60 H116" opacity=".3"/>
          </g>
          <g class="sweep">
            <path d="M60,60 L60,4 A56,56 0 0,0 21,20 Z" fill="url(#bt-trail)"/>
            <line x1="60" y1="60" x2="60" y2="4" stroke="currentColor" stroke-width="1.5"/>
          </g>
          <g fill="currentColor">${blips}</g>
        </svg>
        <input type="text" id="search-input" placeholder="Scan for posts..." aria-label="Search posts" autocomplete="off" spellcheck="false">
      </div>
      <div id="search-results"></div>
    </div>`
      : '',
    Object.keys(tags).length
      ? `
    <div class="box">
      <h3><a href="${esc(state.top_page)}?tags">${vtext('Star charts', 2)}</a></h3>
      <p class="tagcloud">${tag_cloud(tags, 0.85, 1.5)}</p>
    </div>`
      : '',
    cfg.sidebar.categories && entries.length
      ? `
    <div class="box">
      <h3><a href="${esc(state.top_page)}?categories">${vtext('Galaxies', 2)}</a></h3>
      <ul class="index">${entries.map(([cat, cnt]) => `<li><a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span></li>`).join('')}</ul>
    </div>`
      : '',
    cfg.header.theme
      ? `
    <div class="box">
      <h3>${vtext('Warp', 2)}</h3>
      <ul id="theme-menu" class="warp">${theme_items()}</ul>
    </div>`
      : '',
  ].filter(Boolean)

  if (!boxes.length)
    return ''
  return `
<section id="mission-control" class="mission-control">
  <h2>${vtext('Mission control', 2.6)}</h2>
  <div class="boxes">${boxes.join('')}</div>
</section>`
}

/** Returns HIGH SCORES: the 10 longest posts (score: 10 points a word) */
function high_scores() {
  const posts = all_posts().filter((p) => (p.type ?? 'post') === 'post')
    .map((p) => [p, word_count(p)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  if (!posts.length)
    return ''
  return `
<section class="high-scores">
  <h2>${vtext('High scores', 2.6)}</h2>
  <ol>${posts.map(([p, words], i) => `<li><span>${i + 1}.</span><span>${`${words * 10}`.padStart(6, '0')}</span><a href="${esc(urlify(p.url))}">${esc(p.title)}</a></li>`).join('')}</ol>
</section>`
}

/** Returns the colophon: social links, star-stuff, credits */
function footer() {
  const icon = (cls) => `fa${cls.startsWith('brands') ? 'b' : 's'} ${cls.split(' ').pop()}`
  const social = social_list().map((e) => `<a href="${esc(e.href)}" title="${esc(e.title)}" ${e.title === 'RSS' ? 'type="application/rss+xml"' : `target="_blank" rel="${e.rel}"`}><i class="${icon(e.cls)}"></i></a>`).join(' ')
  const year = state.newest?.slice(0, 4) ?? ''
  return `
<footer class="colophon">
  ${social ? `<p class="social">${social}</p>` : ''}
  <p class="star-stuff">&ldquo;We are made of star-stuff&rdquo; <small>&mdash; Carl Sagan, <i>Cosmos</i></small></p>
  <p>${cfg.copyright ? esc(cfg.copyright) : `&copy; ${esc(year)} ${esc(cfg.author ?? cfg.title)}`}.
    Design: <a href="https://blogtini.com/themes/" target="_blank" rel="noopener">Cosmos by blogtini</a>.
    Powered by <a href="https://blogtini.com/" target="_blank" rel="noopener">blogtini.com</a>.</p>
</footer>
<svg id="moon" aria-hidden="true"></svg>`
}


// ---- phosphor color: the viewer's pick, kept in localStorage (it may be unavailable, eg: private windows)

function phosphor_get() {
  try {
    const val = localStorage.getItem(PHOSPHOR_KEY)
    return PHOSPHORS.includes(val) ? val : PHOSPHORS[0]
  } catch {
    return PHOSPHORS[0]
  }
}

function phosphors(btbody) {
  const set = (val) => {
    document.documentElement.dataset.phosphor = val
    btbody.querySelectorAll('.phosphor button').forEach((b) => b.setAttribute('aria-pressed', `${b.dataset.phosphor === val}`))
  }
  set(phosphor_get())
  btbody.querySelectorAll('.phosphor button').forEach((b) => b.addEventListener('click', () => {
    set(b.dataset.phosphor)
    try {
      localStorage.setItem(PHOSPHOR_KEY, b.dataset.phosphor)
      /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
    } catch {}
  }))
}


/** Lights up the radar blips of the posts in the search results (blogtini's search fills `#search-results`) */
function radar_blips(btbody) {
  const input = btbody.querySelector('#search-input')
  const results = btbody.querySelector('#search-results')
  if (!input || !results)
    return
  const update = () => {
    const q = input.value.trim()
    const hits = new Set([...results.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))
    btbody.querySelectorAll('#radar .blip').forEach((b) => {
      const hit = hits.has(b.dataset.url)
      b.setAttribute('r', hit ? '3.5' : '1.8')
      // eslint-disable-next-line no-param-reassign
      b.style.opacity = q ? (hit ? '1' : '0.15') : ''
    })
  }
  new MutationObserver(update).observe(results, { childList: true, subtree: true })
  input.addEventListener('input', () => requestAnimationFrame(update))
}


customElements.define('bt-body', class extends HTMLElement {
  connectedCallback() {
    if (this.rendered)
      return
    this.rendered = true

    // blogtini's main content -- eg: `<bt-posts>`.  (minus any `<hr>`)
    const content = [...this.childNodes].filter((e) => e.nodeName !== 'HR')

    const categories = JSON.parse(this.getAttribute('categories') || '{}')
    const tags = JSON.parse(this.getAttribute('tags') || '{}')

    this.innerHTML = `
<svg id="stars" aria-hidden="true"></svg>
<header class="console">
  <a href="${esc(state.top_page) || './'}" class="site-title">${vtext(cfg.title ?? '', 3)}</a>
  <nav>
    <ul>
      ${menu_items()}
      <li><a href="#mission-control"><i class="fas fa-satellite-dish"></i> Scan</a></li>
    </ul>
  </nav>
  <span class="phosphor" role="group" aria-label="phosphor color">
    ${PHOSPHORS.map((e) => `<button type="button" data-phosphor="${e}">${e}</button>`).join('')}
  </span>
</header>
${is_home() ? '<svg id="hero" viewBox="0 0 1000 380" class="glow" aria-hidden="true"></svg>' : ''}
<main id="wrapper"></main>`

    this.querySelector('#wrapper').append(...content)
    this.append(nodes(pagination()))
    this.append(nodes(mission_control(categories, tags)))
    this.append(nodes(high_scores()))
    this.append(nodes(footer()))

    phosphors(this)
    radar_blips(this)
    this.scenery()

    // the content's elements render right after this -- then show the page
    requestAnimationFrame(() => reveal())
  }

  /** Stars, hero & moon: drawn, then animated -- unless the viewer prefers reduced motion */
  scenery() {
    const stars = this.querySelector('#stars')
    const hero = this.querySelector('#hero')
    const moon = this.querySelector('#moon')
    draw_stars(stars)
    if (hero)
      draw_hero(hero)
    draw_moon(moon)

    parallax(stars)
    globalThis.addEventListener('scroll', () => parallax(stars), { passive: true })
    let resizing = 0
    globalThis.addEventListener('resize', () => { // at most once a frame
      cancelAnimationFrame(resizing)
      resizing = requestAnimationFrame(() => draw_moon(moon))
    })

    const frame = (t) => {
      if (!this.isConnected)
        return
      if (hero)
        frame_hero(hero, t)
      frame_moon(moon, t)
      if (!reduced())
        requestAnimationFrame(frame)
    }
    requestAnimationFrame(reduced() ? () => frame(0) : frame)
  }
})


customElements.define('bt-posts', class extends HTMLElement {
  connectedCallback() {
    const posts = [...this.querySelectorAll('bt-post')].map((e) => [e.getAttribute('url'), e.id])

    let title = 'Latest transmissions'
    if (state.filter_tag)
      title = `Star chart: #${state.filter_tag}`
    else if (state.filter_cat)
      title = `Galaxy: ${state.filter_cat}`
    if (state.page)
      title += `, page ${state.page + 1}`

    this.replaceWith(nodes(`
<section class="transmissions">
  <h2>${vtext(title, 2.6)}</h2>
  ${posts.map(([url, id]) => card(url, id)).join('')}
</section>`))
  }
})

// (normally inside `<bt-posts>`, which renders them itself)
customElements.define('bt-post', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(card(this.getAttribute('url'), this.id)))
  }
})


customElements.define('bt-post-full', class extends HTMLElement {
  connectedCallback() {
    const post = url2post(this.getAttribute('url'))
    if (!post)
      return
    const body = markdown_to_html(post.body_raw)

    // the homepage's own content: a mission briefing, before the posts
    if (post.type === 'homepage') {
      this.replaceWith(nodes(`
<article class="mission briefing">
  <p class="sector">Mission briefing</p>
  <div class="post-body">${body}</div>
</article>`))
      highlight_code()
      return
    }

    const is_post = !post.type || post.type === 'post'
    const featured = post.featured
      ? `
  <figure class="viewscreen">
    <img src="${esc(imgurl(post, true, true))}" alt="${esc(post.featuredalt ?? '')}">
    ${post.featuredcaption ? `<figcaption>${esc(post.featuredcaption)}</figcaption>` : ''}
  </figure>`
      : ''

    this.replaceWith(nodes(`
<article class="mission">
  ${planet(post.url ?? post.title ?? '', 'big')}
  ${is_post && ymd(post) ? `<p class="sector">Sector ${ymd(post)}</p>` : ''}
  <h1>${esc(post.title)}</h1>
  ${is_post ? fuel(post, true) : ''}
  ${featured}
  <div class="post-body">${body}</div>
  ${charts(post)}
  ${comments(post)}
</article>`))

    highlight_code()
  }
})


customElements.define('bt-histogram', class extends HTMLElement {
  connectedCallback() {
    const type = state.list_tags ? 'tags' : 'categories'
    const histogram = JSON.parse(this.getAttribute('histogram') || '{}')
    this.replaceWith(nodes(`
<article class="mission">
  <h1>${vtext(type === 'tags' ? 'Star charts' : 'Galaxies', 3)}</h1>
  <ul class="index">${histogram_items(type, histogram)}</ul>
</article>`))
  }
})


customElements.define('bt-contact', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`
<article class="mission contact">
  <h1>${vtext('Hailing frequencies', 2.6)}</h1>
  ${contact_form()}
</article>`))
  }
})
