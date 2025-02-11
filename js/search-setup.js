import lunr from 'https://esm.ext.archive.org/lunr@2.3.9'
import dayjs from 'https://esm.ext.archive.org/dayjs@1.11.13'

import { summarize_markdown } from './text.js'


// Flyout Menu Functions

// Search
let idx                // Lunr index
let $searchResults     // The element on the page holding search results
let $searchInput       // The search box element
let site_cfg           // config from main index.js
const resultDetails = {} // Will hold the data for the search results (titles and summaries)

function search_setup(docs, cfg) {
  site_cfg = cfg
  for (const doc of docs)
    resultDetails[doc.url] = doc

  // Click anywhere outside a flyout to close
  document.addEventListener('click', (e) => {
    const windowWidth = globalThis.innerWidth
    if (e.clientX < windowWidth - 177) {
      const btbod = document.querySelector('bt-body')?.shadowRoot
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

  // Get dom objects for the elements we'll be interacting with
  const btbody = document.querySelector('bt-body')?.shadowRoot
  $searchResults = btbody?.querySelector('#search-results')
  $searchInput   = btbody?.querySelector('#search-input')

  // Build the index so Lunr can search it.  The `ref` field will hold the URL
  // to the page/post.  title, excerpt, and body will be fields searched.
  idx = lunr(function adder() {
    this.ref('url')
    this.field('title')
    this.field('date') // xxx typo in source!
    this.field('body_raw')
    this.field('tags')
    this.field('categories')

    // Loop through all documents and add them to index so they can be searched
    for (const doc of docs)
      this.add(doc)
  })

  // Register handler for the search input field
  // eslint-disable-next-line no-use-before-define
  registerSearchHandler()
}

function registerSearchHandler() {
  $searchInput.oninput = (event) => {
    const query = event.target.value
    // eslint-disable-next-line no-use-before-define
    const results = search(query)  // Perform the search

    // Render search results
    // eslint-disable-next-line no-use-before-define
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
    $searchResults.innerHTML = '<article class="mini-post"><main><p>No Results Found...</p></main></a></article>'
  }

  // Render the list
  $searchResults.innerHTML = container.innerHTML
}

function search(query) {
  return idx.search(query)
}

export default search_setup
