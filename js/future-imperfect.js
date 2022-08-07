/* eslint-disable */
import $ from 'https://esm.archive.org/jquery'
import lunr from 'https://esm.archive.org/lunr'
import dayjs from 'https://esm.archive.org/dayjs'

import { summarize_markdown } from './text.js'


// Flyout Menu Functions
let toggles = {
  ".search-toggle": "#search-input",
  ".lang-toggle": "#lang-menu",
  ".share-toggle": "#share-menu",
  ".nav-toggle": "#site-nav-menu"
};

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

  $.each(toggles, function(toggle, menu) {
    $(toggle).on("click", function() {
      if ($(menu).hasClass("active")) {
        $(".menu").removeClass("active");
        $("#wrapper").removeClass("overlay");
      } else {
        $("#wrapper").addClass("overlay");
        $(".menu").not($(menu + ".menu")).removeClass("active");
        $(menu).addClass("active");
        if (menu == "#search-input") {$("#search-results").toggleClass("active");}
      }
    });
  });

  // Click anywhere outside a flyout to close
  $(document).on("click", function(e) {
    if ($(e.target).is(".lang-toggle, .lang-toggle span, #lang-menu, .share-toggle, .share-toggle i, #share-menu, .search-toggle, .search-toggle i, #search-input, #search-results .mini-post, .nav-toggle, .nav-toggle i, #site-nav") === false) {
      $(".menu").removeClass("active");
      $("#wrapper").removeClass('overlay');
    }
  });

  // Check to see if the window is top if not then display button
  $(window).scroll(function() {
    if ($(this).scrollTop()) {
      $('#back-to-top').fadeIn();
    } else {
      $('#back-to-top').fadeOut();
    }
  });

  // Click event to scroll to top
  $('#back-to-top').click(function() {
    $('html, body').animate({scrollTop: 0}, 1000);
    return false;
  });


  // Get dom objects for the elements we'll be interacting with
  $searchResults = document.getElementById('search-results');
  $searchInput   = document.getElementById('search-input');

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
