
# changes
- `storage_loop()` incrementally fill out `url2post()` data into `state`

# single post
loop once sees post, can body =>
  main content
  sidebar w/ EMPTY: tags, cats, recent posts
    - start with attrs blanked -- and simply update once post loop is done to re-`render()`!

# posts
everything needs to wait until all posts looped over
- store `state.urls_filtered` list
- can write out full attr cats/tags/recents components