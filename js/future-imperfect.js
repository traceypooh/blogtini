// deno-lint-ignore-file
/* eslint-disable */
// import $ from './jquery.js'
import lunr from './lunr.js'
import dayjs from './day.js'

import { summarize_markdown } from './text.js'


// Flyout Menu Functions

// Search
let idx;                // Lunr index
let resultDetails = {}; // Will hold the data for the search results (titles and summaries)
let $searchResults;     // The element on the page holding search results
let $searchInput;       // The search box element
let site_cfg;           // config from main blogtini.js

function search_setup(docs, cfg) {
  site_cfg = cfg;
  for (const doc of docs)
    resultDetails[doc.url] = doc

  // Click anywhere outside a flyout to close
  $(document).on("click", function(e) { // xxxxxxxxxxxx
    if ($(e.target).is(".lang-toggle, .lang-toggle span, #lang-menu, .share-toggle, .share-toggle i, .theme-toggle, .theme-toggle i, #share-menu, #theme-menu, .search-toggle, .search-toggle i, #search-input, #search-results .mini-post, .nav-toggle, .nav-toggle i, #site-nav") === false) {
      $(".menu").removeClass("active");
      $("#wrapper").removeClass('overlay');
    }
  });

  const btpage = document.querySelector('bt-body')?.shadowRoot

  if (btpage) {
    // Upon page load if somehow not at the top, show scroll up button
    if (document.documentElement.scrollTop || document.body.scrollTop)
      btpage.querySelector('#back-to-top').style.opacity = 1
    // For any scroll event, check if window isnt top, then display button
    $(window).scroll(function() {
      btpage.querySelector('#back-to-top').style.opacity =
        $(this).scrollTop() ? 1 : 0
    })
  }

  // Get dom objects for the elements we'll be interacting with
  $searchResults = btpage?.querySelector('#search-results');
  $searchInput   = btpage?.querySelector('#search-input');

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
  });

  // Register handler for the search input field
  registerSearchHandler();
};

function registerSearchHandler() {
  $searchInput.oninput = function(event) {
    var query = event.target.value;
    var results = search(query);  // Perform the search

    // Render search results
    renderSearchResults(results);

    // Remove search results if the user empties the search phrase input field
    if ($searchInput.value == '') {
      $searchResults.innerHTML = '';
    }
  }
}

function renderSearchResults(results) {
  // Create a list of results
  var container = document.createElement('div');
  if (results.length > 0) {
    results.forEach(function(result) {
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
    });

    // Remove any existing content so results aren't continually added as the user types
    while ($searchResults.hasChildNodes()) {
      $searchResults.removeChild(
        $searchResults.lastChild
      );
    }
  } else {
    $searchResults.innerHTML = '<article class="mini-post"><main><p>No Results Found...</p></main></a></article>';
  }

  // Render the list
  $searchResults.innerHTML = container.innerHTML;
}

function search(query) {
  return idx.search(query);
}

export default search_setup
