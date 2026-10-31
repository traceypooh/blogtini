import lunr from 'https://esm.archive.org/lunr@2.3.9'
import dayjs from 'https://esm.archive.org/dayjs@1.11.13'

import { summarize_markdown } from './text.js'


// Flyout Menu Functions

// Search
let idx                // Lunr index
let $searchResults     // The element on the page holding search results
let $searchInput       // The search box element
let site_cfg           // config from main index.js
const resultDetails = {} // Will hold the data for the search results (titles and summaries)
let closer_added = false

/**
 * Returns where a theme's `<bt-body>` keeps its markup: its shadow root (eg: future-imperfect),
 * or the element itself, for light DOM themes (eg: editorial).  Null until the theme has defined it.
 */
function btbody_root() {
  const btbody = document.querySelector('bt-body')
  return btbody?.shadowRoot ?? (btbody?.matches(':defined') ? btbody : null)
}

function search_setup(docs, cfg) {
  site_cfg = cfg
  for (const doc of docs)
    resultDetails[doc.url] = doc

  // Click anywhere outside a flyout to close.  (Once -- we get called again after each theme switch)
  if (!closer_added) {
    closer_added = true
    document.addEventListener('click', (e) => {
      const windowWidth = globalThis.innerWidth
      if (e.clientX < windowWidth - 177) {
        const btbod = btbody_root()
        if (btbod) {
          // esp. when search is open, additionally require the click be below bottom of search input
          const search_bottom = btbod.querySelector('#search-input')?.getBoundingClientRect()?.bottom
          if (e.clientY > search_bottom) {
            btbod.querySelector('#wrapper')?.classList.remove('overlay')
            btbod.querySelectorAll('.menu.active').forEach((o) => o.classList.remove('active'))
          }
        }
      }
    })
  }

  // Get dom objects for the elements we'll be interacting with
  const btbody = btbody_root()
  $searchResults = btbody?.querySelector('#search-results')
  $searchInput   = btbody?.querySelector('#search-input')
  if (!$searchInput)
    return // eg: `header.search: false` in config.yml

  // Build the index so Lunr can search it.  The `ref` field will hold the URL
  // to the page/post.  title, excerpt, and body will be fields searched.
  idx = lunr(function adder() {
    this.ref('url')
    this.field('title')
    this.field('date') // (the theme this came from had 'data' -- so date search silently never worked)
    this.field('body_raw')
    this.field('tags')
    this.field('categories')

    // Loop through all documents and add them to index so they can be searched
    for (const doc of docs)
      this.add(doc)
  })

  // Register handler for the search input field

  registerSearchHandler()
}

function registerSearchHandler() {
  $searchInput.oninput = (event) => {
    const query = event.target.value

    const results = search(query)  // Perform the search

    // Render search results

    renderSearchResults(results)

    // Remove search results if the user empties the search phrase input field
    if ($searchInput.value === '') {
      $searchResults.innerHTML = ''
    }
  }
}

function renderSearchResults(results) {
  // Create a list of results
  const container = document.createElement('div')
  if (results.length > 0) {
    results.forEach((result) => {
      // Create result item
      container.innerHTML += `
        <article class="mini-post">
          <a href="${result.ref}">
            <header>
              <h2>${resultDetails[result.ref].title}</h2>
              <time class="published" datetime="">
                ${dayjs(resultDetails[result.ref].date).format('MMM D, YYYY')}
              </time>
            </header>
            <main>
              <p>
                ${summarize_markdown(resultDetails[result.ref].body_raw, site_cfg.summary_length)}
              </p>
            </main>
          </a>
        </article>`
    })

    // Remove any existing content so results aren't continually added as the user types
    while ($searchResults.hasChildNodes()) {
      $searchResults.removeChild(
        $searchResults.lastChild,
      )
    }
  } else {
    $searchResults.innerHTML = '<article class="mini-post"><main><p>No Results Found...</p></main></article>'
  }

  // Render the list
  $searchResults.innerHTML = container.innerHTML
}

function search(query) {
  return idx.search(query)
}

export default search_setup
export { btbody_root }
