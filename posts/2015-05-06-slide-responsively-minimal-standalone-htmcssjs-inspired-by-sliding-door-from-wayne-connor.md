---
title: “slide-responsively” — minimal standalone HTM/CSS/JS inspired by “sliding-door” from Wayne Connor
url: 2015/05/slide-responsively-minimal-standalone-htm-css-js-inspired-by-sliding-door-from-wayne-connor
author: tracey pooh
type: post
date: 2015-05-06
featured: slide-responsively.jpg
categories:
  - coding
  - technical
  - website
tags:
  - coding
  - geek
  - javascript
aliases:
  - /2015/05/06/slide-responsively-minimal-standalone-htmcssjs-inspired-by-sliding-door-from-wayne-connor/
  - /slide-responsively.htm
---
**I made new "slide-responsively" for image menus, which is minimal standalone HTM/CSS/JS inspired by "[sliding-door](https://wordpress.org/themes/sliding-door/)" from Wayne Connor**

<div class="slide-responsively">
  <ul>
    <li>
      <a href="//poohbot.com/2015/05/slide-responsively-minimal-standalone-htm-css-js-inspired-by-sliding-door-from-wayne-connor/" style="background-image:url(/img/nav/about.jpg)     ">about</a>
    </li>
    <li>
      <a href="/biking/"    style="background-image:url(/img/nav/biking.jpg)    ">biking</a>
    </li>
    <li>
      <a href="/favorites/" style="background-image:url(/img/nav/favorites.jpg) ">favorites</a>
    </li>
    <li>
      <a href="/quotes/"    style="background-image:url(/img/nav/quotes.jpg)    ">quotes</a>
    </li>
    <li>
      <a href="/lapses/"    style="background-image:url(/img/nav/timelapses.jpg)">lapses</a>
    </li>
    <li>
      <a href="/video/"     style="background-image:url(/img/nav/video.jpg)     ">video</a>
    </li>
    <li>
      <a href="/photos/"    style="background-image:url(/img/nav/photos.jpg)    ">photos</a>
    </li>
  </ul>
</div>

I've just kept the sliding door idea, and made it independent of a WordPress theme so it can be added to a site using another theme.  Hover over some of the images just above ☝🏽 to see it in action.

Try shrinking the width of the browser or rotating your mobile device.

[My **github repo** of this plugin](https://github.com/traceypooh/slide-responsively).

Just replace the 7 images and links and go!

Here's how simple it all is (for example standalone usage, wordpress not required..):
```html
<!-- slide-responsibly @tracey_pooh 2015: Insipred by wordpress "sliding-door" theme - rewritten to be responsive -->
<div class="slide-responsively">
  <ul>
    <li><a href="//poohBot.com/2015/05/06/slide-responsively-minimal-standalone-htmcssjs-inspired-by-sliding-door-from-wayne-connor"
                              style="background-image:url(https://poohBot.com/img/nav/about.jpg)     ">about</a></li>
    <li><a href="/biking/"    style="background-image:url(https://poohBot.com/img/nav/biking.jpg)    ">biking</a></li>
    <li><a href="/favorites/" style="background-image:url(https://poohBot.com/img/nav/favorites.jpg)">favorites</a></li>
    <li><a href="/quotes/"    style="background-image:url(https://poohBot.com/img/nav/quotes.jpg)    ">quotes</a></li>
    <li><a href="/lapses/"    style="background-image:url(https://poohBot.com/img/nav/timelapses.jpg)">lapses</a></li>
    <li><a href="/video/"     style="background-image:url(https://poohBot.com/img/nav/video.jpg)     ">video</a></li>
    <li><a href="/photos/"    style="background-image:url(https://poohBot.com/img/nav/photos.jpg)    ">photos</a></li>
  </ul>
</div>


<style>
.slide-responsively {
  overflow: hidden;
  border-style: none;
  padding: 8px 0 20px 0px;
  margin: 0;
  max-width:1000px;
 }

.slide-responsively ul {
  list-style: none;
  display: block;
  height: 200px;
  padding: 0;
  margin: 0;
}

.slide-responsively ul li {
  float: left;
  -webkit-transition: width 0.5s ease;
     -moz-transition: width 0.5s ease;
       -o-transition: width 0.5s ease;
          transition: width 0.5s ease;
}

.slide-responsively ul li a {
  text-indent: -1000px;
  background:#FFFFFF none repeat scroll 0%;
  border-right: 2px solid #fff;
  display:block;
  overflow:hidden;
  height: 200px;
  margin: 0;
  padding: 0;
  vertical-align: baseline;
  /* better nonrepeated noninline CSS */
  background-position: 0% 50%;
  background-repeat: repeat;
  background-attachment: scroll;
}

.slide-responsively ul li:last-child a {
  border-right-style: none;
}

/* THE RESPONSIVE WIDTHS */

.slide-responsively ul li       { width:14%;   } /* 100% / 7  (using 7 images) */
.slide-responsively ul li.in    { width:31%;   } /* about 1/3 total width */
.slide-responsively ul li.out   { width:11.5%; } /* (100% - 31%) / 6 */

@media (max-width:700px) { /* for quite narrow viewports, eg: phones */
  .slide-responsively ul li.in  { width:50%;   } /* about 1/2 total width */
  .slide-responsively ul li.out { width:8.3%;  } /* (100% - 51%) / 6 */
}
</style>



<script src="https://code.jquery.com/jquery-3.4.1.slim.min.js"></script>
<script>
( function ($) {
  $(document).ready(function() {
    // DOM ready, page still (likely) loading images, etc...
    $('.slide-responsively li').mouseenter(function(e) {
      $('.slide-responsively li').addClass('out')
      $(this).removeClass('out').addClass('in')
    })
    $('.slide-responsively li').mouseleave(function(e) {
      $('.slide-responsively li').removeClass('out')
      $(this).removeClass('in')
    })
  })
}) ( jQuery )
</script>
```


<style> code.hljs { line-height: 1 } </style>
<link rel="stylesheet" href="/css/slide-responsively.css"/>
<script defer src="/js/slide-responsively.js"></script>
